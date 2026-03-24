export const getShopProfile = async (db) => {
  const results = await db.getAllAsync('SELECT * FROM ShopProfile LIMIT 1');
  return results.length > 0 ? results[0] : null;
};

export const createShopProfile = async (db, { shop_name, phone, gst_number }) => {
  const result = await db.runAsync(
    'INSERT INTO ShopProfile (shop_name, phone, gst_number) VALUES (?, ?, ?)',
    [shop_name, phone, gst_number || '']
  );
  return result.lastInsertRowId;
};

export const getProducts = async (db) => {
  return await db.getAllAsync('SELECT * FROM Products ORDER BY created_at DESC');
};

export const addProduct = async (db, { name, category, unit, purchase_price, selling_price, stock_quantity }) => {
  try {
    const p = parseFloat(purchase_price) || 0;
    const s = parseFloat(selling_price) || 0;
    const q = parseFloat(stock_quantity) || 0;

    const result = await db.runAsync(
      'INSERT INTO Products (name, category, unit, purchase_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        category || '',
        unit || 'piece',
        p,
        s,
        q
      ]
    );

    // Also record initial stock in history if > 0
    if (q > 0) {
      await db.runAsync(
        'INSERT INTO StockHistory (product_id, added_quantity, purchase_price) VALUES (?, ?, ?)',
        [result.lastInsertRowId, q, p]
      );
    }

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProductStock = async (db, productId, addQuantity, newPurchasePrice, newSellingPrice) => {
  try {
    const q = parseFloat(addQuantity) || 0;
    const p = parseFloat(newPurchasePrice) || 0;
    const s = parseFloat(newSellingPrice) || 0;
    
    console.log(`Updating stock for Product ID: ${productId}, Add: ${q}, New P: ${p}, New S: ${s}`);
    
    if (!productId) throw new Error("Missing Product ID");

    await db.runAsync('BEGIN TRANSACTION');
    
    await db.runAsync(
      'INSERT INTO StockHistory (product_id, type, added_quantity, purchase_price) VALUES (?, ?, ?, ?)',
      [productId, 'add', q, p]
    );
    
    await db.runAsync(
      'UPDATE Products SET stock_quantity = stock_quantity + ?, purchase_price = ?, selling_price = ? WHERE id = ?',
      [q, p, s, productId]
    );
    
    await db.runAsync('COMMIT');
    console.log('Stock update successful');
  } catch (error) {
    console.error('Error updating stock database:', error);
    try { await db.runAsync('ROLLBACK'); } catch (_) {}
    throw error;
  }
};

export const deductStock = async (db, productId, deductQuantity, reason) => {
  try {
    const qty = parseFloat(deductQuantity);

    // Get current purchase price for loss calculation
    const products = await db.getAllAsync('SELECT purchase_price FROM Products WHERE id = ?', [productId]);
    const pPrice = products.length > 0 ? products[0].purchase_price : 0;

    // Only UPDATE if current stock is sufficient
    const result = await db.runAsync(
      'UPDATE Products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
      [qty, productId, qty]
    );

    if (result.changes === 0) {
      throw new Error('Insufficient stock for deduction');
    }

    await db.runAsync(
      'INSERT INTO StockHistory (product_id, type, added_quantity, purchase_price, reason) VALUES (?, ?, ?, ?, ?)',
      [productId, 'deduct', qty, pPrice, reason || 'Other']
    );
  } catch (error) {
    console.error('Error deducting stock:', error);
    throw error;
  }
};


export const createOrder = async (db, items, totalAmount, customerName, paymentType) => {
  try {
    // Manually manage the transaction
    await db.runAsync('BEGIN TRANSACTION');

    const totalAmt = parseFloat(totalAmount) || 0;
    const orderResult = await db.runAsync(
      'INSERT INTO Orders (total_amount, customer_name, payment_type) VALUES (?, ?, ?)',
      [totalAmt, customerName || '', paymentType || 'Cash']
    );
    const orderId = orderResult.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        'INSERT INTO OrderItems (order_id, product_id, quantity, selling_price, purchase_price, unit) VALUES (?, ?, ?, ?, ?, ?)',
        [
          orderId,
          item.id,
          parseFloat(item.quantity),
          parseFloat(item.selling_price),
          parseFloat(item.purchase_price) || 0,
          item.unit || 'piece'
        ]
      );
      await db.runAsync(
        'UPDATE Products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [parseFloat(item.quantity), item.id]
      );
    }

    await db.runAsync('COMMIT');
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    try { await db.runAsync('ROLLBACK'); } catch (_) {}
    throw error;
  }
};

export const getDailySales = async (db) => {
  return await db.getAllAsync(`
    SELECT 
      d.date,
      COALESCE(s.total_sales, 0) as total_sales,
      COALESCE(s.cash_sales, 0) as cash_sales,
      COALESCE(s.bank_sales, 0) as bank_sales,
      COALESCE(s.credit_sales, 0) as credit_sales,
      COALESCE(s.gross_profit, 0) as gross_profit,
      COALESCE(h.total_loss, 0) as total_loss,
      (COALESCE(s.gross_profit, 0) - COALESCE(h.total_loss, 0)) as net_profit
    FROM (
      SELECT DISTINCT date(created_at) as date FROM Orders
      UNION
      SELECT DISTINCT date(purchase_date) as date FROM StockHistory WHERE type = 'deduct'
    ) d
    LEFT JOIN (
      SELECT 
        date(o.created_at) as date,
        SUM(o.total_amount) as total_sales,
        SUM(CASE WHEN o.payment_type = 'Cash' THEN o.total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN o.payment_type = 'Bank' THEN o.total_amount ELSE 0 END) as bank_sales,
        SUM(CASE WHEN o.payment_type = 'Credit' THEN o.total_amount ELSE 0 END) as credit_sales,
        SUM((oi.selling_price - oi.purchase_price) * oi.quantity) as gross_profit
      FROM Orders o
      JOIN OrderItems oi ON o.id = oi.order_id
      GROUP BY date(o.created_at)
    ) s ON d.date = s.date
    LEFT JOIN (
      SELECT 
        date(purchase_date) as date,
        SUM(added_quantity * purchase_price) as total_loss
      FROM StockHistory
      WHERE type = 'deduct'
      GROUP BY date(purchase_date)
    ) h ON d.date = h.date
    ORDER BY d.date DESC
    LIMIT 30
  `);
};

export const getLowStockProducts = async (db, threshold = 5) => {
  return await db.getAllAsync(
    'SELECT * FROM Products WHERE stock_quantity <= ?',
    [threshold]
  );
};

export const getRecentOrders = async (db, limit = 50) => {
  const orders = await db.getAllAsync(
    `SELECT *, datetime(created_at, 'localtime') as local_time FROM Orders ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  
  // For each order, we might want to attach items for the combined PDF
  for (const order of orders) {
    order.items = await db.getAllAsync(
      'SELECT oi.*, p.name FROM OrderItems oi JOIN Products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [order.id]
    );
  }
  return orders;
};

export const deleteOrders = async (db, orderIds) => {
  if (!orderIds || orderIds.length === 0) return;
  const placeholders = orderIds.map(() => '?').join(',');
  await db.withTransactionAsync(async () => {
    // Delete order items first (FK constraint)
    await db.runAsync(`DELETE FROM OrderItems WHERE order_id IN (${placeholders})`, orderIds);
    await db.runAsync(`DELETE FROM Orders WHERE id IN (${placeholders})`, orderIds);
  });
};
