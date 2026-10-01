const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const path = require('path');

async function testDatabase() {
  console.log('--- TEST 1: Initializing SQL.js in-memory database ---');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // 1. Create tables
  console.log('--- TEST 2: Testing Schema Creation ---');
  db.run(`
    CREATE TABLE roles (id TEXT PRIMARY KEY, name TEXT UNIQUE);
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, username TEXT UNIQUE, password_hash TEXT, pin_hash TEXT, role_id TEXT);
    CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT, category_id TEXT, selling_price REAL, cost_price REAL, is_active INTEGER DEFAULT 1);
    CREATE TABLE tables (id TEXT PRIMARY KEY, number INTEGER UNIQUE, capacity INTEGER, status TEXT DEFAULT 'available');
    CREATE TABLE orders (id TEXT PRIMARY KEY, order_number TEXT UNIQUE, order_type TEXT, status TEXT, subtotal REAL, discount_amount REAL, tax_amount REAL, total REAL, created_at TEXT);
    CREATE TABLE order_items (id TEXT PRIMARY KEY, order_id TEXT, product_name TEXT, quantity INTEGER, unit_price REAL, total REAL);
    CREATE TABLE payments (id TEXT PRIMARY KEY, order_id TEXT, method TEXT, amount REAL, received_amount REAL, change_amount REAL);
    CREATE TABLE inventory_items (id TEXT PRIMARY KEY, name TEXT, current_stock REAL, minimum_stock REAL);
    CREATE TABLE recipes (id TEXT PRIMARY KEY, product_id TEXT UNIQUE);
    CREATE TABLE recipe_items (id TEXT PRIMARY KEY, recipe_id TEXT, inventory_item_id TEXT, quantity REAL, unit TEXT);
    CREATE TABLE audit_logs (id TEXT PRIMARY KEY, action TEXT, details TEXT, created_at TEXT);
  `);
  console.log('Schema created successfully.');

  // 2. Test User Auth / Password Hashing
  console.log('--- TEST 3: User Creation & Password Verification ---');
  const roleId = uuid();
  db.run("INSERT INTO roles (id, name) VALUES (?, ?)", [roleId, 'admin']);
  
  const userId = uuid();
  const passHash = bcrypt.hashSync('admin123', 10);
  const pinHash = bcrypt.hashSync('1234', 10);
  db.run("INSERT INTO users (id, name, username, password_hash, pin_hash, role_id) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, 'Admin User', 'admin', passHash, pinHash, roleId]);
  
  const userRow = db.exec("SELECT * FROM users WHERE username = 'admin'")[0].values[0];
  const isValidPass = bcrypt.compareSync('admin123', userRow[3]);
  const isValidPin = bcrypt.compareSync('1234', userRow[4]);
  if (!isValidPass || !isValidPin) throw new Error('Password or PIN verification failed!');
  console.log('Auth check passed: password and PIN hash verified.');

  // 3. Test POS Product Creation & Category
  console.log('--- TEST 4: Categories, Products & Recipe Setup ---');
  const catId = uuid();
  db.run("INSERT INTO categories (id, name) VALUES (?, ?)", [catId, 'Burgers']);

  const prodId = uuid();
  db.run("INSERT INTO products (id, name, category_id, selling_price, cost_price) VALUES (?, ?, ?, ?, ?)",
    [prodId, 'Classic Cheese Burger', catId, 850.0, 350.0]);

  const ingId1 = uuid(); // Bun
  const ingId2 = uuid(); // Patty
  db.run("INSERT INTO inventory_items (id, name, current_stock, minimum_stock) VALUES (?, ?, ?, ?)", [ingId1, 'Burger Bun', 100, 20]);
  db.run("INSERT INTO inventory_items (id, name, current_stock, minimum_stock) VALUES (?, ?, ?, ?)", [ingId2, 'Beef Patty', 50, 10]);

  const recipeId = uuid();
  db.run("INSERT INTO recipes (id, product_id) VALUES (?, ?)", [recipeId, prodId]);
  db.run("INSERT INTO recipe_items (id, recipe_id, inventory_item_id, quantity, unit) VALUES (?, ?, ?, ?, ?)", [uuid(), recipeId, ingId1, 1, 'PCS']);
  db.run("INSERT INTO recipe_items (id, recipe_id, inventory_item_id, quantity, unit) VALUES (?, ?, ?, ?, ?)", [uuid(), recipeId, ingId2, 1, 'PCS']);
  console.log('Products, recipes, and inventory items initialized.');

  // 4. Test POS Order Flow (Creation, Recalculation, Payment, Inventory Deduction)
  console.log('--- TEST 5: Complete POS Order & Financial Transaction ---');
  const orderId = uuid();
  const orderNum = 'ORD-20260905-0001';
  const qty = 2;
  const unitPrice = 850.0;
  const subtotal = qty * unitPrice; // 1700.0
  const tax = subtotal * 0.16; // 272.0
  const total = subtotal + tax; // 1972.0

  db.run("BEGIN TRANSACTION");
  try {
    db.run(`INSERT INTO orders (id, order_number, order_type, status, subtotal, discount_amount, tax_amount, total, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [orderId, orderNum, 'dine_in', 'confirmed', subtotal, 0, tax, total]);

    db.run(`INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), orderId, 'Classic Cheese Burger', qty, unitPrice, subtotal]);

    // Payment
    const received = 2000.0;
    const change = received - total;
    db.run(`INSERT INTO payments (id, order_id, method, amount, received_amount, change_amount)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), orderId, 'cash', total, received, change]);

    // Deduct stock using recipe
    const recItems = db.exec(`SELECT inventory_item_id, quantity FROM recipe_items WHERE recipe_id = ?`, [recipeId]);
    if (recItems.length > 0 && recItems[0].values) {
      for (const row of recItems[0].values) {
        const invId = row[0];
        const reqQty = row[1] * qty;
        db.run(`UPDATE inventory_items SET current_stock = current_stock - ? WHERE id = ?`, [reqQty, invId]);
      }
    }

    // Complete order
    db.run(`UPDATE orders SET status = 'completed' WHERE id = ?`, [orderId]);
    db.run("COMMIT");
  } catch (err) {
    db.run("ROLLBACK");
    throw err;
  }

  // 5. Verify Results
  const orderCheck = db.exec("SELECT status, total FROM orders WHERE id = ?", [orderId])[0].values[0];
  if (orderCheck[0] !== 'completed' || Math.abs(orderCheck[1] - 1972.0) > 0.01) {
    throw new Error('Order verification failed!');
  }

  const bunStock = db.exec("SELECT current_stock FROM inventory_items WHERE id = ?", [ingId1])[0].values[0][0];
  const pattyStock = db.exec("SELECT current_stock FROM inventory_items WHERE id = ?", [ingId2])[0].values[0][0];
  if (bunStock !== 98 || pattyStock !== 48) {
    throw new Error(`Inventory deduction failed! Bun: ${bunStock}, Patty: ${pattyStock}`);
  }
  console.log(`Order completed with total: Rs. ${orderCheck[1]}, Bun remaining: ${bunStock}, Patty remaining: ${pattyStock}`);

  // 6. Test DB Export & File Persistence
  console.log('--- TEST 6: SQLite Export and Re-load ---');
  const exported = db.export();
  const dbReloaded = new SQL.Database(exported);
  const reloadedOrders = dbReloaded.exec("SELECT count(*) FROM orders")[0].values[0][0];
  if (reloadedOrders !== 1) throw new Error('Persistence export/import failed!');
  console.log('SQLite export and re-load successful! Order count in reloaded db: ' + reloadedOrders);

  console.log('\n==================================================');
  console.log('ALL CRITICAL CORE WORKFLOW TESTS PASSED PERFECTLY!');
  console.log('==================================================\n');
}

testDatabase().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
