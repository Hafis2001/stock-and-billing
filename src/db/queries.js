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
    const result = await db.runAsync(
      'INSERT INTO Products (name, category, unit, purchase_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        category || '',
        unit || 'piece',
        parseFloat(purchase_price) || 0,
        parseFloat(selling_price) || 0,
        parseFloat(stock_quantity) || 0
      ]
    );

    // Also record initial stock in history if > 0
    if (parseFloat(stock_quantity) > 0) {
      await db.runAsync(
        'INSERT INTO StockHistory (product_id, added_quantity, purchase_price) VALUES (?, ?, ?)',
        [result.lastInsertRowId, parseFloat(stock_quantity), parseFloat(purchase_price) || 0]
      );
    }

    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProductStock = async (db, productId, addQuantity, newPurchasePrice) => {
  try {
    await db.runAsync(
      'INSERT INTO StockHistory (product_id, type, added_quantity, purchase_price) VALUES (?, ?, ?, ?)',
      [productId, 'add', parseFloat(addQuantity), parseFloat(newPurchasePrice)]
    );
    await db.runAsync(
      'UPDATE Products SET stock_quantity = stock_quantity + ?, purchase_price = ? WHERE id = ?',
      [parseFloat(addQuantity), parseFloat(newPurchasePrice), productId]
    );
  } catch (error) {
    console.error('Error updating stock:', error);
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


export const createOrder = async (db, items, totalAmount) => {
  try {
    // Manually manage the transaction
    await db.runAsync('BEGIN TRANSACTION');

    const orderResult = await db.runAsync(
      'INSERT INTO Orders (total_amount) VALUES (?)',
      [parseFloat(totalAmount)]
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
