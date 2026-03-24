import * as SQLite from 'expo-sqlite';

export const openDatabase = async () => {
  return await SQLite.openDatabaseAsync('smallbizpos_v2.db');
};

export const initDB = async (db) => {
  try {
    console.log('Starting DB initialization...');
    
    // Some Android versions/Expo versions have issues with WAL, let's keep it simple
    // await db.execAsync(`PRAGMA journal_mode = WAL`);

    console.log('Creating ShopProfile table...');
    await db.execAsync(`CREATE TABLE IF NOT EXISTS ShopProfile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      gst_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Creating Products table...');
    await db.execAsync(`CREATE TABLE IF NOT EXISTS Products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'piece',
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      stock_quantity REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Creating StockHistory table...');
    await db.execAsync(`CREATE TABLE IF NOT EXISTS StockHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      type TEXT DEFAULT 'add',
      added_quantity REAL NOT NULL,
      purchase_price REAL,
      reason TEXT,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES Products (id)
    )`);

    console.log('Creating Orders table...');
    await db.execAsync(`CREATE TABLE IF NOT EXISTS Orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL,
      customer_name TEXT,
      payment_type TEXT DEFAULT 'Cash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Creating OrderItems table...');
    await db.execAsync(`CREATE TABLE IF NOT EXISTS OrderItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity REAL NOT NULL,
      selling_price REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'piece',
      FOREIGN KEY (order_id) REFERENCES Orders (id),
      FOREIGN KEY (product_id) REFERENCES Products (id)
    )`);

    console.log('Running migrations...');
    // Sequential migrations to prevent bridge overload
    const migrations = [
      `ALTER TABLE Products ADD COLUMN unit TEXT DEFAULT 'piece'`,
      `ALTER TABLE OrderItems ADD COLUMN unit TEXT DEFAULT 'piece'`,
      `ALTER TABLE OrderItems ADD COLUMN purchase_price REAL DEFAULT 0`,
      `ALTER TABLE StockHistory ADD COLUMN type TEXT DEFAULT 'add'`,
      `ALTER TABLE StockHistory ADD COLUMN reason TEXT`,
      `ALTER TABLE Orders ADD COLUMN customer_name TEXT`,
      `ALTER TABLE Orders ADD COLUMN payment_type TEXT DEFAULT 'Cash'`
    ];

    for (const sql of migrations) {
      try {
        await db.execAsync(sql);
        console.log(`Migration applied: ${sql.substring(0, 30)}...`);
      } catch (e) {
        // Silently fail if column already exists
        // console.log(`Migration skipped (already exists?): ${sql.substring(0, 30)}`);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
