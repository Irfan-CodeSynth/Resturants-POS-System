// ============================================================
// Database Connection & Schema — using sql.js (pure JS SQLite)
// ============================================================
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'

let db: SqlJsDatabase | null = null
let dbPath: string = ''
let saveTimer: ReturnType<typeof setInterval> | null = null
let txDepth = 0

export function getDbPath(): string {
  if (!dbPath) {
    // Documented in .env.example; also how the integration tests point the app at a temp db.
    dbPath = process.env.DATABASE_PATH || path.join(app.getPath('userData'), 'restaurant.db')
  }
  return dbPath
}

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()
  const filePath = getDbPath()

  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }
  } catch {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')

  initializeSchema(db)
  scheduleSave()

  return db
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function saveDatabase(): void {
  if (!db) return
  try {
    const data = db.export()
    // sql.js resets PRAGMA foreign_keys when it exports, which silently switches off every
    // foreign key (and ON DELETE CASCADE) for the rest of the session.
    db.run('PRAGMA foreign_keys = ON')
    const buffer = Buffer.from(data)
    const filePath = getDbPath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, buffer)
  } catch (err) {
    console.error('Failed to save database:', err)
  }
}

function scheduleSave(): void {
  // Flushes the whole in-memory database on an interval
  if (saveTimer) clearInterval(saveTimer)
  saveTimer = setInterval(() => {
    saveDatabase()
  }, 5000)
  // A background flush must not be the reason the process can't exit
  saveTimer.unref()
}

export function closeDb(): void {
  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

function initializeSchema(database: SqlJsDatabase): void {
  database.run(`
    -- ==============================
    -- Authentication & Authorization
    -- ==============================

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      "group" TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      pin_hash TEXT,
      role_id TEXT NOT NULL REFERENCES roles(id),
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Restaurant & Settings
    -- ==============================

    CREATE TABLE IF NOT EXISTS restaurant (
      id TEXT PRIMARY KEY DEFAULT '1',
      name TEXT NOT NULL DEFAULT 'My Restaurant',
      logo TEXT,
      phone TEXT,
      address TEXT,
      currency TEXT DEFAULT 'Rs.',
      currency_code TEXT DEFAULT 'PKR',
      timezone TEXT DEFAULT 'Asia/Karachi',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      time_format TEXT DEFAULT '12h',
      tax_rate REAL DEFAULT 0,
      service_charge_rate REAL DEFAULT 0,
      receipt_footer TEXT DEFAULT 'Thank you for dining with us!',
      default_order_type TEXT DEFAULT 'dine_in',
      setup_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      "group" TEXT DEFAULT 'general',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Categories & Products
    -- ==============================

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      barcode TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      description TEXT,
      image TEXT,
      selling_price REAL NOT NULL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      track_stock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS modifier_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      min_selections INTEGER DEFAULT 0,
      max_selections INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_modifier_groups (
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      modifier_group_id TEXT NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, modifier_group_id)
    );

    CREATE TABLE IF NOT EXISTS modifiers (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price_adjustment REAL DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Tables
    -- ==============================

    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL UNIQUE,
      name TEXT,
      capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'available',
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      floor TEXT DEFAULT 'Main',
      shape TEXT DEFAULT 'square',
      current_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Customers
    -- ==============================

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      total_spending REAL DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      last_order_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Orders
    -- ==============================

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL DEFAULT 'dine_in',
      status TEXT NOT NULL DEFAULT 'draft',
      table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      delivery_fee REAL DEFAULT 0,
      delivery_notes TEXT,
      subtotal REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      discount_type TEXT,
      discount_value REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      is_held INTEGER DEFAULT 0,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      sent_to_kitchen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_item_modifiers (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      modifier_id TEXT REFERENCES modifiers(id) ON DELETE SET NULL,
      modifier_name TEXT NOT NULL,
      price_adjustment REAL DEFAULT 0
    );

    -- ==============================
    -- Payments & Refunds
    -- ==============================

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      method TEXT NOT NULL DEFAULT 'cash',
      amount REAL NOT NULL DEFAULT 0,
      reference TEXT,
      received_amount REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      payment_id TEXT REFERENCES payments(id),
      amount REAL NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      approved_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Cash Register
    -- ==============================

    CREATE TABLE IF NOT EXISTS cash_registers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      opening_amount REAL NOT NULL DEFAULT 0,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      status TEXT DEFAULT 'open',
      opened_at TEXT DEFAULT (datetime('now')),
      closed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS cash_movements (
      id TEXT PRIMARY KEY,
      register_id TEXT NOT NULL REFERENCES cash_registers(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      reason TEXT,
      reference_type TEXT,
      reference_id TEXT,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Suppliers
    -- ==============================

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_id TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Inventory
    -- ==============================

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      unit TEXT NOT NULL DEFAULT 'PCS',
      current_stock REAL DEFAULT 0,
      minimum_stock REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES inventory_items(id),
      type TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      reference_type TEXT,
      reference_id TEXT,
      reason TEXT,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Recipes
    -- ==============================

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipe_items (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL
    );

    -- ==============================
    -- Purchases
    -- ==============================

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
      invoice_number TEXT,
      date TEXT NOT NULL,
      total REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'pending',
      notes TEXT,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      total REAL DEFAULT 0
    );

    -- ==============================
    -- Expenses
    -- ==============================

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category_id TEXT REFERENCES expense_categories(id) ON DELETE SET NULL,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      description TEXT,
      payment_method TEXT DEFAULT 'cash',
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Wastage
    -- ==============================

    CREATE TABLE IF NOT EXISTS wastage (
      id TEXT PRIMARY KEY,
      inventory_item_id TEXT NOT NULL REFERENCES inventory_items(id),
      quantity REAL NOT NULL DEFAULT 0,
      reason TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ==============================
    -- Audit & System
    -- ==============================

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      type TEXT DEFAULT 'manual',
      user_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS printer_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'receipt',
      printer_name TEXT,
      paper_width INTEGER DEFAULT 80,
      copies INTEGER DEFAULT 1,
      auto_print INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Create indexes separately (sql.js handles these fine)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
    'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type)',
    'CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_orders_held ON orders(is_held)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status)',
    'CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_item ON order_item_modifiers(order_item_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_cash_registers_user ON cash_registers(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status)',
    'CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(register_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier ON inventory_items(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id)',
    'CREATE INDEX IF NOT EXISTS idx_recipes_product ON recipes(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)',
    'CREATE INDEX IF NOT EXISTS idx_wastage_item ON wastage(inventory_item_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order)',
  ]
  for (const idx of indexes) {
    database.run(idx)
  }

  // Ensure default restaurant record exists
  const result = database.exec('SELECT COUNT(*) as count FROM restaurant')
  const count = result.length > 0 ? result[0].values[0][0] as number : 0
  if (count === 0) {
    database.run("INSERT INTO restaurant (id) VALUES ('1')")
  }

  // Seed permissions if empty
  const permResult = database.exec('SELECT COUNT(*) as count FROM permissions')
  const permCount = permResult.length > 0 ? permResult[0].values[0][0] as number : 0
  if (permCount === 0) {
    seedPermissions(database)
  }
}

function seedPermissions(database: SqlJsDatabase): void {
  // Import inline to avoid circular deps
  const PERMISSION_DEFINITIONS = [
    { key: 'dashboard.view', name: 'View Dashboard', group: 'Dashboard', description: 'View dashboard statistics and charts' },
    { key: 'pos.access', name: 'Access POS', group: 'POS', description: 'Access the point of sale interface' },
    { key: 'orders.create', name: 'Create Orders', group: 'Orders', description: 'Create new orders' },
    { key: 'orders.edit', name: 'Edit Orders', group: 'Orders', description: 'Edit existing orders' },
    { key: 'orders.cancel', name: 'Cancel Orders', group: 'Orders', description: 'Cancel orders' },
    { key: 'orders.refund', name: 'Refund Orders', group: 'Orders', description: 'Process refunds' },
    { key: 'orders.discount', name: 'Apply Discounts', group: 'Orders', description: 'Apply discounts to orders' },
    { key: 'orders.change_price', name: 'Change Prices', group: 'Orders', description: 'Change item prices on orders' },
    { key: 'orders.delete', name: 'Delete Orders', group: 'Orders', description: 'Delete orders' },
    { key: 'payments.accept', name: 'Accept Payments', group: 'Payments', description: 'Process payments' },
    { key: 'cash.open', name: 'Open Cash Register', group: 'Cash Register', description: 'Open cash register sessions' },
    { key: 'cash.close', name: 'Close Cash Register', group: 'Cash Register', description: 'Close cash register sessions' },
    { key: 'products.view', name: 'View Products', group: 'Products', description: 'View products and categories' },
    { key: 'products.create', name: 'Create Products', group: 'Products', description: 'Create new products' },
    { key: 'products.edit', name: 'Edit Products', group: 'Products', description: 'Edit existing products' },
    { key: 'products.delete', name: 'Delete Products', group: 'Products', description: 'Delete products' },
    { key: 'inventory.view', name: 'View Inventory', group: 'Inventory', description: 'View inventory and stock levels' },
    { key: 'inventory.edit', name: 'Edit Inventory', group: 'Inventory', description: 'Edit inventory items' },
    { key: 'inventory.purchase', name: 'Manage Purchases', group: 'Inventory', description: 'Create and manage purchases' },
    { key: 'inventory.adjust', name: 'Adjust Stock', group: 'Inventory', description: 'Make stock adjustments' },
    { key: 'reports.view', name: 'View Reports', group: 'Reports', description: 'View reports and analytics' },
    { key: 'reports.export', name: 'Export Reports', group: 'Reports', description: 'Export reports as PDF/CSV' },
    { key: 'staff.view', name: 'View Staff', group: 'Staff', description: 'View staff members' },
    { key: 'staff.manage', name: 'Manage Staff', group: 'Staff', description: 'Create, edit, and manage staff' },
    { key: 'customers.view', name: 'View Customers', group: 'Customers', description: 'View customer information' },
    { key: 'customers.manage', name: 'Manage Customers', group: 'Customers', description: 'Create, edit, and manage customers' },
    { key: 'tables.view', name: 'View Tables', group: 'Tables', description: 'View table layout' },
    { key: 'tables.manage', name: 'Manage Tables', group: 'Tables', description: 'Create, edit, and manage tables' },
    { key: 'kitchen.view', name: 'View Kitchen', group: 'Kitchen', description: 'View kitchen display' },
    { key: 'kitchen.manage', name: 'Manage Kitchen', group: 'Kitchen', description: 'Update kitchen order statuses' },
    { key: 'expenses.view', name: 'View Expenses', group: 'Expenses', description: 'View expense records' },
    { key: 'expenses.manage', name: 'Manage Expenses', group: 'Expenses', description: 'Create and manage expenses' },
    { key: 'settings.manage', name: 'Manage Settings', group: 'Settings', description: 'Modify application settings' },
    { key: 'backup.create', name: 'Create Backup', group: 'Backup', description: 'Create database backups' },
    { key: 'backup.restore', name: 'Restore Backup', group: 'Backup', description: 'Restore from backup' },
    { key: 'audit.view', name: 'View Audit Logs', group: 'Audit', description: 'View audit log entries' },
  ]

  const stmt = database.prepare(
    'INSERT OR IGNORE INTO permissions (id, key, name, "group", description) VALUES (?, ?, ?, ?, ?)'
  )
  for (const p of PERMISSION_DEFINITIONS) {
    stmt.run([uuid(), p.key, p.name, p.group, p.description])
  }
  stmt.free()
}

// ============================================================
// Query Helpers for sql.js
// ============================================================

function logSqlError(context: string, sql: string, params: unknown[], err: unknown): void {
  // Every IPC handler reduces thrown errors to { success: false }, so without this the main
  // process shows a bad query identically to any other failure.
  console.error(
    `[sql] ${context} failed: ${(err as Error)?.message ?? err}\n  sql: ${sql}\n  params: ${JSON.stringify(params)}`
  )
}

/** Run a SELECT query and return all rows as an array of objects */
export function queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  const database = getDb()
  let stmt
  try {
    stmt = database.prepare(sql)
    if (params.length > 0) stmt.bind(params)
  } catch (err) {
    logSqlError('queryAll', sql, params, err)
    throw err
  }

  const results: T[] = []
  try {
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T)
    }
  } finally {
    stmt.free()
  }
  return results
}

/** Run a SELECT query and return the first row as an object, or null */
export function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
  const database = getDb()
  let stmt
  try {
    stmt = database.prepare(sql)
    if (params.length > 0) stmt.bind(params)
  } catch (err) {
    logSqlError('queryOne', sql, params, err)
    throw err
  }

  let result: T | null = null
  try {
    if (stmt.step()) {
      result = stmt.getAsObject() as T
    }
  } finally {
    stmt.free()
  }
  return result
}

/** Run an INSERT/UPDATE/DELETE statement */
export function execute(sql: string, params: unknown[] = []): void {
  const database = getDb()
  try {
    database.run(sql, params)
  } catch (err) {
    logSqlError('execute', sql, params, err)
    throw err
  }
}

/** Run multiple statements in a transaction. Nested calls join the outer transaction. */
export function runTransaction<T>(fn: () => T): T {
  const database = getDb()

  // Services call each other (purchase -> inventory.adjustStock, setup -> role/category
  // seeding), so a nested BEGIN would abort the whole operation with
  // "cannot start a transaction within a transaction".
  if (txDepth > 0) {
    txDepth++
    try {
      return fn()
    } finally {
      txDepth--
    }
  }

  database.run('BEGIN TRANSACTION')
  txDepth = 1
  try {
    const result = fn()
    database.run('COMMIT')
    saveDatabase()
    return result
  } catch (err) {
    database.run('ROLLBACK')
    throw err
  } finally {
    txDepth = 0
  }
}

/** Get the number of affected rows from the last statement */
export function getChanges(): number {
  const database = getDb()
  const result = database.exec('SELECT changes()')
  return result.length > 0 ? result[0].values[0][0] as number : 0
}

// Audit log helper
export function createAuditLog(
  userId: string | null,
  userName: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  details?: string
): void {
  execute(
    'INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuid(), userId, userName, action, entity || null, entityId || null, details || null]
  )
}
