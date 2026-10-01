// Integration tests for the real main-process data layer.
// Run with: node scripts/run-integration.mjs
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  initDb,
  closeDb,
  queryAll,
  queryOne,
  execute,
  runTransaction,
  saveDatabase,
  getDbPath
} from '../src/main/database/connection'
import { checkSetup, completeSetup } from '../src/main/services/setup.service'
import { login, loginPin, verifyManager } from '../src/main/services/auth.service'
import { createCategory } from '../src/main/services/category.service'
import { createProduct, getProduct } from '../src/main/services/product.service'
import { createItem, getItem, getMovements as getStockMovements, getLowStock, adjustStock, updateItem } from '../src/main/services/inventory.service'
import { save as saveRecipe, getByProduct as getRecipe, deleteRecipe } from '../src/main/services/recipe.service'
import { createSupplier, getSupplier, listSuppliers, updateSupplier, deleteSupplier } from '../src/main/services/supplier.service'
import { createPurchase, deletePurchase, getPurchase, listPurchases } from '../src/main/services/purchase.service'
import { createWastage, listWastage } from '../src/main/services/wastage.service'
import { createGroup, linkProduct } from '../src/main/services/modifier.service'
import { createTable, deleteTable, getTable, listTables, transferTable, updateStatus } from '../src/main/services/table.service'
import {
  addItem,
  applyDiscount,
  createOrder,
  deleteOrder,
  getOrder,
  getHeldOrders,
  holdOrder,
  listOrders,
  recallOrder,
  removeItem,
  sendToKitchen,
  updateItem as updateOrderItem,
  updateOrder,
  updateOrderStatus
} from '../src/main/services/order.service'
import { completeOrder, getKitchenOrders, updateItemStatus, updateOrderKitchenStatus } from '../src/main/services/kitchen.service'
import { getPaymentsByOrder, processPayment, refund } from '../src/main/services/payment.service'
import {
  addMovement,
  cashIn,
  cashOut,
  closeRegister,
  getActiveRegister,
  getHistory,
  getMovements,
  openRegister
} from '../src/main/services/cash.service'
import {
  createExpense,
  deleteExpense,
  listExpenses,
  createCategory as createExpenseCategory,
  listCategories as listExpenseCategories,
  deleteCategory as deleteExpenseCategory,
  updateExpense
} from '../src/main/services/expense.service'
import { ordersReport, productsReport, salesReport } from '../src/main/services/report.service'
import { getCharts, getLowStock as dashboardLowStock, getRecentActivity, getRecentOrders, getStats } from '../src/main/services/dashboard.service'
import { createStaff, deleteStaff, getStaff, listStaff, updateStaff } from '../src/main/services/staff.service'
import { createRole, deleteRole, getRole, listPermissions, listRoles, updateRole } from '../src/main/services/role.service'
import { listLogs, exportLogs } from '../src/main/services/audit.service'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomerOrders,
  listCustomers,
  searchCustomers,
  updateCustomer
} from '../src/main/services/customer.service'
import { getRestaurant, getSetting, setSetting, updateRestaurant, bulkSet } from '../src/main/services/settings.service'
import { createBackup, deleteBackup, getBackupSettings, listBackups, restoreBackup, updateBackupSettings } from '../src/main/services/backup.service'
import { deleteConfig, getConfigs, printKitchenTicket, printReceipt, saveConfig, testPrint } from '../src/main/services/print.service'
import bcrypt from 'bcryptjs'

const SCHEMA_TABLES = [
  'roles', 'permissions', 'role_permissions', 'users',
  'restaurant', 'settings',
  'categories', 'products', 'modifier_groups', 'product_modifier_groups', 'modifiers',
  'tables', 'customers',
  'orders', 'order_items', 'order_item_modifiers',
  'payments', 'refunds',
  'cash_registers', 'cash_movements',
  'suppliers', 'inventory_items', 'inventory_movements',
  'recipes', 'recipe_items',
  'purchases', 'purchase_items',
  'expense_categories', 'expenses',
  'wastage', 'audit_logs', 'backups', 'printer_configs'
]

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-int-'))
process.env.POS_TEST_USER_DATA = tmpDir
process.env.DATABASE_PATH = path.join(tmpDir, 'restaurant.db')

function count(table: string): number {
  return queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`).c
}

test('initDb creates the schema declared in connection.ts', async () => {
  await initDb()

  const present = new Set(
    queryAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).map((r) => r.name)
  )

  const missing = SCHEMA_TABLES.filter((t) => !present.has(t))
  assert.deepEqual(missing, [], 'every table in initializeSchema() should exist')

  assert.equal(count('restaurant'), 1, 'a default restaurant row should be seeded')
  assert.ok(count('permissions') > 0, 'permissions should be seeded on a fresh database')
  assert.equal(getDbPath(), process.env.DATABASE_PATH, 'DATABASE_PATH should win over app.getPath')
})

test('runTransaction joins an outer transaction instead of issuing a nested BEGIN', () => {
  // Services delegate to each other (purchase.createPurchase -> inventory.adjustStock,
  // setup.completeSetup -> role/category seeding), which nested a BEGIN and aborted.
  runTransaction(() => {
    execute("INSERT INTO categories (id, name) VALUES ('cat-outer', 'Outer')")
    runTransaction(() => {
      execute("INSERT INTO categories (id, name) VALUES ('cat-inner', 'Inner')")
    })
    assert.equal(
      count('categories'),
      2,
      'both writes should be visible inside the open transaction'
    )
  })

  assert.equal(count('categories'), 2, 'the outer commit should persist the inner write')
})

test('a failure inside a nested transaction rolls back the whole outer transaction', () => {
  assert.throws(() => {
    runTransaction(() => {
      execute("INSERT INTO categories (id, name) VALUES ('cat-keep', 'Keep')")
      runTransaction(() => {
        execute("INSERT INTO categories (id, name) VALUES ('cat-lost', 'Lost')")
        throw new Error('boom from inner scope')
      })
    })
  }, /boom from inner scope/)

  assert.equal(
    count('categories'),
    2,
    'the rolled-back rows must be gone; the committed ones from the previous test must survive'
  )
})

test('a failing query is logged with its SQL before being rethrown', () => {
  const lines: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => { lines.push(args.join(' ')) }
  try {
    assert.throws(() => queryOne('SELECT no_such_column FROM products'), /no such column/)
  } finally {
    console.error = original
  }

  assert.equal(lines.length, 1, 'the failure should be reported once, at the data layer')
  assert.match(lines[0], /\[sql\] queryOne failed/)
  assert.match(lines[0], /no_such_column/, 'the log must name the missing column')
  assert.match(lines[0], /FROM products/, 'the log must include the offending SQL')
})

// Shared by the three spine tests below; node:test runs declarations in order.
const spine: Record<string, any> = {}

test('foreign keys stay enforced after the database is flushed to disk', () => {
  // sql.js resets PRAGMA foreign_keys inside export(), so every save used to switch the whole
  // schema's foreign keys - and ON DELETE CASCADE - off for the rest of the session.
  assert.equal(queryAll<{ foreign_keys: number }>('PRAGMA foreign_keys')[0].foreign_keys, 1)
  saveDatabase()
  assert.equal(queryAll<{ foreign_keys: number }>('PRAGMA foreign_keys')[0].foreign_keys, 1)

  assert.throws(
    () => execute("INSERT INTO role_permissions (role_id, permission_id) VALUES ('ghost', 'ghost')"),
    /FOREIGN KEY constraint failed/
  )
})

test('setup unlocks authentication', () => {
  assert.equal(checkSetup().setup_completed, 0, 'a fresh database must start unlocked for setup')

  completeSetup({
    restaurant: {
      name: 'Spine Diner',
      phone: '0300-0000000',
      address: '1 Main Bazaar',
      currency: 'Rs.',
      taxRate: 10,
      receiptFooter: 'See you soon'
    },
    admin: { name: 'Ada Owner', username: 'ada', password: 'secret123' },
    settings: { timezone: 'Asia/Karachi', orderType: 'dine_in' }
  })

  assert.equal(checkSetup().setup_completed, 1)
  assert.throws(() => completeSetup({ admin: { username: 'x', password: 'secret123' } }), /already been completed/)

  assert.throws(() => login('ada', 'nope'), /Invalid credentials/)
  // A missing username must fail identically, or the login form becomes an enumeration oracle.
  assert.throws(() => login('nobody', 'secret123'), /Invalid credentials/)

  const user = login('ada', 'secret123')
  assert.equal(user.username, 'ada')
  assert.equal(user.role_name, 'Admin')
  assert.equal(user.password_hash, undefined, 'the hash must never cross the IPC boundary')
  assert.equal(user.pin_hash, undefined)
  assert.ok(user.permissions.length > 20, 'the admin role should hold every seeded permission')

  assert.throws(() => loginPin('4321'), /Invalid credentials/, 'no PIN set yet')
  execute(`UPDATE users SET pin_hash = ? WHERE id = ?`, [bcrypt.hashSync('4321', 10), user.id])
  assert.equal(loginPin('4321').id, user.id)
  assert.throws(() => loginPin('1111'), /Invalid credentials/)

  assert.throws(() => verifyManager('ada', 'nope'), /Invalid credentials/)
  spine.user = user
})

test('the menu can be built and read back the way the POS consumes it', () => {
  const category = createCategory({ name: 'Mains', sort_order: 1 })
  const patty = createItem({ name: 'Beef patty', unit: 'PCS', current_stock: 100, minimum_stock: 10, cost_per_unit: 1.5 })
  const product = createProduct({
    name: 'Burger',
    category_id: category.id,
    selling_price: 100,
    cost_price: 40,
    tax_rate: 0,
    track_stock: true
  })
  // A group with a priced modifier, because the POS grid renders these inline.
  const extras = createGroup({
    name: 'Extras',
    is_required: false,
    min_selections: 0,
    max_selections: 2,
    modifiers: [{ name: 'Cheese', price_adjustment: 20, is_default: false }]
  })
  linkProduct(product.id, extras.id)
  saveRecipe(product.id, [{ inventory_item_id: patty.id, quantity: 2, unit: 'PCS' }])

  const loaded = getProduct(product.id)
  assert.equal(loaded.category_name, 'Mains')
  assert.equal(loaded.modifier_groups.length, 1, 'getProduct must surface linked modifier groups')
  assert.equal(loaded.modifier_groups[0].modifiers[0].name, 'Cheese')
  assert.equal(loaded.current_stock, 50, '100 patties at 2 per burger is 50 saleable burgers')

  Object.assign(spine, { category, patty, product, extras })
})

test('an order prices, discounts, pays, and depletes stock as one spine', () => {
  const table = createTable({ number: 12, name: 'T12', capacity: 2 })
  const cheeseId = spine.extras.modifiers[0].id

  const order = createOrder({
    order_type: 'dine_in',
    table_id: table.id,
    user_id: spine.user.id,
    items: [
      // The bogus price below must be ignored - the server owns pricing.
      { product_id: spine.product.id, quantity: 3, notes: 'no onions', modifiers: [{ id: cheeseId }] }
    ]
  })

  const line = order.items[0]
  assert.equal(line.product_name, 'Burger')
  assert.equal(line.unit_price, 100, 'the client-supplied price must not reach the order')
  assert.equal(line.total, 360, '3 x (100 + 20 modifier)')
  assert.equal(line.modifiers.length, 1)
  assert.equal(line.modifiers[0].modifier_name, 'Cheese')

  assert.equal(order.subtotal, 360)
  assert.equal(order.tax_amount, 36, '10% tax configured during setup must be applied')
  assert.equal(order.total, 396)
  assert.equal(order.status, 'draft')
  assert.equal(getTable(table.id).status, 'occupied')
  assert.equal(getTable(table.id).current_order_id, order.id)

  const discounted = applyDiscount(order.id, 'percentage', 10, spine.user.id)
  assert.equal(discounted.discount_amount, 36)
  assert.equal(discounted.tax_amount, 32.4, 'tax is charged on the discounted amount')
  assert.equal(discounted.total, 356.4)

  spine.register = openRegister(spine.user.id, 500, spine.user.name)
  const paid = processPayment(
    { orderId: order.id, payments: [{ method: 'cash', amount: 400 }] },
    spine.user.id,
    spine.user.name
  )

  assert.equal(paid.change, 43.6)
  const completed = getOrder(order.id)
  assert.equal(completed.status, 'completed')
  assert.equal(completed.items.length, 1)
  assert.equal(getPaymentsByOrder(order.id).length, 1)
  assert.equal(getPaymentsByOrder(order.id)[0].change_amount, 43.6)

  const movements = getMovements(spine.register.id)
  assert.equal(movements.length, 1)
  assert.equal(movements[0].type, 'sale')
  assert.equal(movements[0].amount, 356.4, 'the drawer takes the tender less change')

  assert.equal(getItem(spine.patty.id).current_stock, 94, '3 burgers x 2 patties must leave the shelf')
  assert.equal(getProduct(spine.product.id).current_stock, 47)
  assert.equal(getTable(table.id).status, 'cleaning')
  assert.equal(getTable(table.id).current_order_id, null)

  const refunded = refund(order.id, 56.4, 'one burger returned', spine.user.id, spine.user.id, spine.user.name)
  assert.equal(refunded, true)
  assert.equal(getOrder(order.id).status, 'refunded')
  const afterRefund = getMovements(spine.register.id)
  assert.equal(afterRefund[0].type, 'refund')
  assert.equal(afterRefund[0].amount, -56.4)
  assert.throws(
    () => refund(order.id, 9999, 'too much', spine.user.id, spine.user.id, spine.user.name),
    /exceeds/
  )
})

test('a rejected payment leaves the order, the drawer and the shelf untouched', () => {
  const order = createOrder({
    order_type: 'takeaway',
    user_id: spine.user.id,
    items: [{ product_id: spine.product.id, quantity: 2 }]
  })
  const stockBefore = getItem(spine.patty.id).current_stock
  const drawerBefore = getMovements(spine.register.id).length

  assert.throws(
    () =>
      processPayment(
        { orderId: order.id, payments: [{ method: 'cash', amount: 1 }] },
        spine.user.id,
        spine.user.name
      ),
    /short of/
  )

  assert.equal(getOrder(order.id).status, 'draft', 'a failed payment must not complete the order')
  assert.equal(getPaymentsByOrder(order.id).length, 0)
  assert.equal(getItem(spine.patty.id).current_stock, stockBefore, 'a failed payment must not deplete stock')
  assert.equal(getMovements(spine.register.id).length, drawerBefore)
})

test('a supplier delivery, a waste slip and a recount move the shelf correctly', () => {
  const before = getItem(spine.patty.id).current_stock

  const supplier = createSupplier(
    { name: 'Meat Co', company: 'Meat Co Ltd', phone: '0300-0000000', email: 'ops@meat.co', tax_id: 'NTN-1' },
    spine.user.id,
    spine.user.name
  )
  assert.equal(supplier.purchase_count, 0)
  assert.equal(listSuppliers({ search: 'Meat' }).total, 1)

  // No header total and no line totals are supplied, so the service has to derive both.
  const purchase = createPurchase(
    {
      supplier_id: supplier.id,
      invoice_number: 'INV-9',
      date: '2026-09-01',
      items: [{ inventory_item_id: spine.patty.id, quantity: 50, unit_cost: 2 }]
    },
    spine.user.id,
    spine.user.name
  )

  assert.equal(purchase.total, 100, 'the header total is the sum of its lines')
  assert.equal(purchase.items.length, 1)
  assert.equal(purchase.items[0].total, 100)
  assert.equal(purchase.supplier_name, 'Meat Co')
  assert.equal(getPurchase(purchase.id).payment_status, 'pending')
  assert.equal(listPurchases({ supplier_id: supplier.id, payment_status: 'pending' }).total, 1)
  assert.equal(getSupplier(supplier.id).purchase_count, 1)
  assert.equal(getSupplier(supplier.id).total_purchases, 100)
  assert.equal(getItem(spine.patty.id).current_stock, before + 50, 'the delivery lands on the shelf')

  const stockMoves = getStockMovements(spine.patty.id)
  assert.equal(stockMoves.data[0].type, 'purchase')
  assert.equal(stockMoves.data[0].quantity, 50)

  const wasted = createWastage(
    { inventory_item_id: spine.patty.id, quantity: 4, reason: 'expired' },
    spine.user.id,
    spine.user.name
  )
  assert.equal(wasted.inventory_item_name, 'Beef patty')
  assert.equal(listWastage().total, 1)
  assert.equal(getItem(spine.patty.id).current_stock, before + 46)

  adjustStock(spine.patty.id, 80, 'adjustment', 'Monthly recount', undefined, undefined, spine.user.id, spine.user.name)
  assert.equal(getItem(spine.patty.id).current_stock, 80, 'a recount sets the counted amount')
  assert.equal(
    getStockMovements(spine.patty.id).data[0].quantity,
    80 - (before + 46),
    'the movement records the delta, not the counted total'
  )

  updateItem(spine.patty.id, { minimum_stock: 100 })
  assert.ok(getLowStock().some((i: any) => i.id === spine.patty.id), '80 against a 100 minimum is low stock')

  // A recipe line written without a unit inherits it from the stock item.
  saveRecipe(spine.product.id, [{ inventory_item_id: spine.patty.id, quantity: 2 }])
  const recipe = getRecipe(spine.product.id)
  assert.equal(recipe.items[0].unit, 'PCS')
  assert.equal(recipe.items[0].available_stock, 80)
  assert.equal(getProduct(spine.product.id).current_stock, 40, '80 patties at 2 per burger')

  deletePurchase(purchase.id, spine.user.id, spine.user.name)
  assert.equal(getPurchase(purchase.id), null)
  assert.equal(getItem(spine.patty.id).current_stock, 30, 'deleting the delivery takes the 50 back off')
  assert.equal(getStockMovements(spine.patty.id).data[0].quantity, -50)
  assert.equal(getSupplier(supplier.id).total_purchases, null, 'the supplier total follows the ledger')

  const renamed = updateSupplier(supplier.id, { name: 'Meat Co International' })
  assert.equal(renamed.name, 'Meat Co International')
  assert.equal(deleteSupplier(supplier.id), true)
  assert.equal(getSupplier(supplier.id), null, 'a deleted supplier is soft-deleted, not erased')

  assert.equal(deleteRecipe(spine.product.id), true)
  assert.equal(getRecipe(spine.product.id), null)
})

test('a dine-in order walks the floor and the kitchen display', () => {
  const tableA = createTable({ number: 21, name: 'T21', capacity: 4, floor: 'Patio' })
  const tableB = createTable({ number: 22, name: 'T22', capacity: 2 })
  assert.equal(tableA.status, 'available')
  assert.equal(tableA.floor, 'Patio')
  assert.ok(listTables().some((t: any) => t.id === tableB.id))
  assert.throws(() => createTable({ number: 21, name: 'Duplicate' }), /Table 21 already exists/)
  assert.throws(() => updateStatus(tableB.id, 'busy'), /Unsupported table status/)

  const order = createOrder({
    order_type: 'dine_in',
    table_id: tableA.id,
    user_id: spine.user.id,
    items: [{ product_id: spine.product.id, quantity: 1 }]
  })
  assert.equal(getTable(tableA.id).status, 'occupied')
  assert.equal(getTable(tableA.id).current_order_id, order.id)
  assert.equal(getKitchenOrders().length, 0, 'a draft order is not on the kitchen display')

  const twoLines = addItem(order.id, { product_id: spine.product.id, quantity: 2 })
  assert.equal(twoLines.items.length, 2)
  assert.equal(twoLines.subtotal, 300, '1 + 2 burgers at Rs.100')

  const extraLine = twoLines.items[1]
  assert.equal(updateOrderItem(extraLine.id, { quantity: 3 }).subtotal, 400)
  assert.equal(removeItem(extraLine.id).items.length, 1)
  assert.equal(getOrder(order.id).subtotal, 100)

  const held = holdOrder(order.id)
  assert.equal(held.is_held, 1)
  const heldList = getHeldOrders()
  assert.equal(heldList.length, 1)
  assert.equal(heldList[0].items.length, 1)
  assert.equal(recallOrder(order.id).is_held, 0)
  assert.equal(getHeldOrders().length, 0)

  const detailed = updateOrder(order.id, { customer_name: 'Ali', customer_phone: '0311-1', delivery_fee: 50, notes: 'ring the bell' })
  assert.equal(detailed.customer_name, 'Ali')
  assert.equal(detailed.delivery_fee, 50)

  const sent = sendToKitchen(order.id, spine.user.id)
  assert.equal(sent.status, 'confirmed')
  assert.equal(sent.items[0].sent_to_kitchen, 1)
  assert.throws(() => updateOrderItem(sent.items[0].id, { quantity: 5 }), /can no longer be edited/, 'sending to the kitchen locks the order')

  const tickets = getKitchenOrders()
  assert.equal(tickets.length, 1)
  assert.equal(tickets[0].items[0].product_name, 'Burger')

  updateItemStatus(tickets[0].items[0].id, 'preparing')
  assert.equal(getOrder(order.id).items[0].status, 'preparing')
  updateOrderKitchenStatus(order.id, 'preparing')
  assert.equal(getOrder(order.id).status, 'preparing')
  completeOrder(order.id)
  assert.equal(getOrder(order.id).status, 'ready')
  assert.throws(() => addItem(order.id, { product_id: spine.product.id, quantity: 1 }), /can no longer be edited/)

  assert.equal(transferTable(tableA.id, tableB.id), true)
  assert.equal(getTable(tableA.id).status, 'cleaning')
  assert.equal(getTable(tableA.id).current_order_id, null)
  assert.equal(getTable(tableB.id).status, 'occupied')
  assert.equal(getTable(tableB.id).current_order_id, order.id)
  assert.equal(getOrder(order.id).table_id, tableB.id)
  const tableC = createTable({ number: 23, name: 'T23', capacity: 2 })
  assert.throws(() => transferTable(tableA.id, tableC.id), /has no order to move/, 'an empty table has nothing to move')
  const seated = createOrder({ order_type: 'dine_in', table_id: tableC.id, user_id: spine.user.id, items: [{ product_id: spine.product.id, quantity: 1 }] })
  assert.throws(() => transferTable(tableC.id, tableB.id), /already occupied/, 'a seated table cannot receive another order')
  assert.equal(deleteOrder(seated.id, spine.user.id), true)
  assert.equal(getTable(tableC.id).status, 'available', 'deleting an order frees its table')

  const cancelled = updateOrderStatus(order.id, 'cancelled', spine.user.id, spine.user.name)
  assert.equal(cancelled.status, 'cancelled')
  assert.equal(getTable(tableB.id).status, 'cleaning')
  assert.equal(getTable(tableB.id).current_order_id, null)
  assert.equal(listOrders({ status: 'cancelled' }).total, 1)
  assert.throws(() => deleteOrder(order.id), /can no longer be deleted|Only draft/)

  const throwaway = createOrder({ order_type: 'takeaway', user_id: spine.user.id, items: [{ product_id: spine.product.id, quantity: 1 }] })
  assert.match(throwaway.order_number, /^ORD-\d{8}-\d{4}$/, 'order numbers are ORD-YYYYMMDD-NNNN')
  assert.notEqual(throwaway.order_number, order.order_number, 'two orders on the same day cannot share a number')
  assert.equal(deleteOrder(throwaway.id, spine.user.id), true)
  assert.equal(getOrder(throwaway.id), null)
  assert.equal(updateStatus(tableA.id, 'available').current_order_id, null)
  assert.equal(deleteTable(tableA.id), true)
  assert.equal(getTable(tableA.id), null)
})

test('the drawer takes cash in and out, then closes on a counted balance', () => {
  const register = spine.register
  assert.equal(getActiveRegister()?.id, register.id)
  assert.equal(getActiveRegister(spine.user.id)?.id, register.id)
  assert.equal(getActiveRegister('not-a-user'), null, 'a register belongs to whoever opened it')
  assert.throws(() => openRegister(spine.user.id, 100, spine.user.name), /already open/)

  const movementsBefore = getMovements(register.id).length
  const topUp = cashIn(register.id, 1000, 'Float top-up', spine.user.id)
  assert.equal(topUp.type, 'cash_in')
  assert.equal(topUp.amount, 1000)
  assert.equal(topUp.reason, 'Float top-up')
  assert.equal(topUp.user_name, spine.user.name, 'the movements list joins the user for display')

  const courier = cashOut(register.id, 250, 'Courier payment', spine.user.id)
  assert.equal(courier.type, 'cash_out')
  assert.equal(courier.amount, -250, 'cash out is stored signed so the drawer is a plain sum')
  assert.equal(getMovements(register.id).length, movementsBefore + 2)
  assert.equal(getMovements(register.id)[0].id, courier.id, 'newest movement first')

  assert.throws(() => cashIn(register.id, 0, 'No float', spine.user.id), /must be positive/)
  assert.throws(() => cashOut(register.id, 10, '', spine.user.id), /reason is required/)
  assert.throws(() => addMovement('no-such-register', 'cash_in', 10, 'x', spine.user.id), /register not found/)

  // 500 float + 356.4 sale - 56.4 refund + 1000 in - 250 out
  const closed = closeRegister(register.id, 1535, 'Short by 15', spine.user.id, spine.user.name)
  assert.equal(closed.status, 'closed')
  assert.equal(closed.expected_amount, 1550)
  assert.equal(closed.closing_amount, 1535)
  assert.equal(closed.difference, -15)
  assert.equal(closed.notes, 'Short by 15')
  assert.equal(closed.user_name, spine.user.name)
  assert.ok(closed.closed_at)
  assert.equal(getActiveRegister(), null)
  assert.throws(() => closeRegister(register.id, 0, 'Again', spine.user.id, spine.user.name), /No open register/)

  const today = new Date().toISOString().slice(0, 10)
  assert.equal(getHistory().length, 1)
  assert.equal(getHistory({ status: 'closed' })[0].id, register.id)
  assert.equal(getHistory({ status: 'open' }).length, 0)
  assert.equal(getHistory({ user_id: spine.user.id }).length, 1)
  assert.equal(getHistory({ user_id: 'someone-else' }).length, 0)
  assert.equal(getHistory({ start_date: today, end_date: today }).length, 1)
  assert.equal(getHistory({ start_date: '2000-01-01', end_date: '2000-01-02' }).length, 0)

  // Sales are still recorded with no open drawer - the order must not fail, just go untracked.
  const takeaway = createOrder({
    order_type: 'takeaway',
    user_id: spine.user.id,
    items: [{ product_id: spine.product.id, quantity: 1 }]
  })
  const carded = processPayment(
    { orderId: takeaway.id, payments: [{ method: 'card', amount: 110, reference_number: 'AUTH-1' }] },
    spine.user.id,
    spine.user.name
  )
  assert.equal(carded.change, 0, 'card tenders never produce change')
  assert.equal(getOrder(takeaway.id).status, 'completed')
  assert.equal(getMovements(register.id).length, movementsBefore + 2)
  spine.paidOrder = takeaway
})

test('expenses, reports and the dashboard read the same money spine', () => {
  const today = new Date().toISOString().slice(0, 10)

  const rent = createExpenseCategory('Rent', 'Premises')
  assert.throws(() => createExpenseCategory('Rent', 'Duplicate'), /already exists/)
  const utilities = createExpenseCategory('Utilities', '')
  assert.deepEqual(listExpenseCategories().map((row: any) => row.name), ['Rent', 'Utilities'])

  assert.throws(() => createExpense({ amount: 100 }), /date is required/)
  const bill = createExpense(
    { category_id: utilities.id, amount: 400, date: '2026-01-05', description: 'Power bill' },
    spine.user.id,
    spine.user.name
  )
  assert.equal(bill.category_name, 'Utilities')
  assert.equal(bill.user_name, spine.user.name)
  assert.equal(bill.date, '2026-01-05')

  const revised = updateExpense(bill.id, { amount: 450, description: 'Power bill (revised)' }, spine.user.id, spine.user.name)
  assert.equal(revised.amount, 450)
  assert.equal(revised.description, 'Power bill (revised)')

  assert.equal(listExpenses({ start_date: '2026-01-01', end_date: '2026-01-31' }).length, 1)
  assert.equal(listExpenses({ categoryId: utilities.id }).length, 1)
  assert.equal(listExpenses({ categoryId: rent.id }).length, 0)
  assert.throws(() => deleteExpenseCategory(utilities.id), /associated expenses/)
  assert.equal(deleteExpense(bill.id, spine.user.id, spine.user.name).success, true)
  assert.equal(listExpenses().length, 0)
  assert.equal(deleteExpenseCategory(utilities.id).success, true)

  createExpense({ category_id: rent.id, amount: 1000, date: today, description: 'Monthly rent' }, spine.user.id, spine.user.name)

  const sales = salesReport({ start: today, end: today })
  assert.deepEqual(sales.headers, ['Date', 'Orders', 'Total Sales'])
  assert.equal(sales.date_range.start, today)
  assert.equal(sales.rows.length, 1, 'every completed order so far is from today')
  assert.equal(sales.rows[0][0], today)
  const completed = queryOne<{ c: number; t: number }>(
    `SELECT COUNT(*) AS c, SUM(total) AS t FROM orders WHERE status = 'completed' AND date(created_at) = ?`,
    [today]
  )
  assert.equal(sales.rows[0][1], completed.c)
  assert.equal(sales.rows[0][2], completed.t, 'cancelled, refunded and draft tickets are not sales')
  assert.equal(sales.summary.totalSales, completed.t)

  const products = productsReport({ start: today, end: today })
  assert.deepEqual(products.headers, ['Product', 'Quantity Sold', 'Revenue'])
  assert.equal(products.rows.length, 1)
  assert.equal(products.rows[0][0], 'Burger')
  const soldBurgers = Number(products.rows[0][1])
  assert.ok(soldBurgers > 0)
  assert.equal(products.rows[0][2], soldBurgers * 100, 'revenue comes from the item total column')

  const byStatus = ordersReport({ start: today, end: today })
  assert.deepEqual(byStatus.headers, ['Type', 'Status', 'Count', 'Avg Value'])
  const counted = byStatus.rows.reduce((sum: number, row) => sum + Number(row[2]), 0)
  assert.equal(counted, count('orders'), 'grouping must not drop a ticket')

  const stats = getStats()
  for (const [key, value] of Object.entries(stats)) {
    assert.ok(Number.isFinite(value), `${key} must be a number, got ${value}`)
  }
  assert.equal(stats.expenses, 1000)
  assert.equal(stats.refunds, 56.4)
  assert.equal(stats.discounts, 36)
  assert.equal(stats.cashBalance, 1050, 'the closed drawer is the sum of today signed movements')

  const beforeTicket = getStats()
  const walkedOut = createOrder({ order_type: 'dine_in', user_id: spine.user.id, items: [{ product_id: spine.product.id, quantity: 5 }] })
  updateOrderStatus(walkedOut.id, 'cancelled', spine.user.id, spine.user.name)
  assert.equal(getStats().sales, beforeTicket.sales, 'a cancelled ticket must not count as a sale')
  assert.equal(getStats().orders, beforeTicket.orders)

  const fresh = createOrder({ order_type: 'takeaway', user_id: spine.user.id, items: [{ product_id: spine.product.id, quantity: 1 }] })
  assert.equal(
    getRecentOrders(1)[0].id,
    fresh.id,
    'same-second rows still need the rowid tiebreak'
  )
  processPayment({ orderId: fresh.id, payments: [{ method: 'cash', amount: 110 }] }, spine.user.id, spine.user.name)
  const afterSale = getStats()
  assert.equal(afterSale.orders, beforeTicket.orders + 1)
  assert.equal(Math.round((afterSale.sales - beforeTicket.sales) * 100) / 100, 110)

  assert.throws(() => deleteOrder(walkedOut.id, spine.user.id), /Only draft|can no longer be deleted/,
    'a cancelled ticket stays in the ledger')

  const charts = getCharts('today')
  assert.equal(charts.sales.length, 1)
  assert.equal(charts.sales[0].date, today)
  assert.equal(charts.topProducts[0].name, 'Burger')
  assert.ok(Number(charts.topProducts[0].count) > 0)
  assert.equal(getCharts('month').sales.length, 1)

  for (const item of dashboardLowStock()) {
    assert.ok(item.current_stock <= item.minimum_stock, 'only short items belong on the low-stock list')
    assert.equal(item.is_active, 1)
  }

  const activity = getRecentActivity(50)
  const actions = activity.map((entry: any) => entry.action)
  assert.ok(actions.includes('process_payment'), 'payments must be auditable')
  assert.ok(actions.includes('close_register'), 'the drawer close must be auditable')
  assert.ok(activity.every((entry: any) => typeof entry.action === 'string'))
  assert.ok(activity.some((entry: any) => entry.user_name === spine.user.name))

  assert.equal(
    productsReport({ start: today, end: today }).rows[0][1],
    soldBurgers + 1,
    'the newly paid burger counts, the five cancelled ones never did'
  )
})

test('staff, roles and settings are managed against the real users table', () => {
  const permissions = listPermissions()
  assert.ok(permissions.length >= 30, 'the permission catalogue is seeded')
  assert.ok(permissions.every((p: any) => p.group && p.key && p.name))

  const cashierKeys = ['pos.access', 'orders.create', 'payments.accept', 'cash.open']
  const cashier = createRole('Cashier', 'Front of house', cashierKeys, spine.user.id, spine.user.name)
  assert.equal(cashier.name, 'Cashier')
  assert.equal(cashier.is_system, 0)
  assert.deepEqual([...cashier.permissions].sort(), [...cashierKeys].sort())

  assert.throws(() => createRole('Broken', '', ['reports.does.not.exist']), /Unknown permission/)
  assert.equal(listRoles().find((role: any) => role.name === 'Broken'), undefined, 'a bad permission key rolls the whole create back')
  assert.throws(() => updateRole(spine.user.role_id, 'Superadmin', '', cashierKeys), /Cannot rename a system role/)

  const adminRole = listRoles().find((role: any) => role.id === spine.user.role_id)
  assert.equal(adminRole.permission_count, permissions.length)

  const waiter = createStaff(
    { name: 'Omar Waiter', username: 'omar', password: 'waiter123', role_id: cashier.id, pin: '1234' },
    spine.user.id,
    spine.user.name
  )
  assert.equal(waiter.name, 'Omar Waiter')
  assert.equal(waiter.role_name, 'Cashier')
  assert.equal(waiter.is_active, 1)
  assert.equal(waiter.password_hash, undefined, 'the hash must never leave the data layer')
  assert.equal(waiter.pin_hash, undefined)
  assert.ok(waiter.permissions.includes('pos.access'))
  assert.equal(getRole(cashier.id).description, 'Front of house')
  assert.equal(listStaff().filter((row: any) => row.role_name === 'Cashier').length, 1)

  assert.equal(login('omar', 'waiter123').role_name, 'Cashier')
  assert.equal(loginPin('1234').id, waiter.id)
  assert.equal(getStaff(waiter.id).last_login !== null, true, 'login stamps last_login')
  assert.throws(() => verifyManager('omar', 'waiter123'), /manager or admin/)

  assert.throws(() => createStaff({ username: 'omar', password: 'waiter123', role_id: cashier.id }), /already taken/)
  assert.throws(() => createStaff({ password: 'waiter123', role_id: cashier.id }), /username is required/)
  assert.throws(() => createStaff({ username: 'sara', password: 'waiter123' }), /role is required/)
  assert.throws(() => createStaff({ username: 'sara', password: 'waiter123', role_id: 'nope' }), /Role not found/)

  const repinned = updateStaff(waiter.id, { name: 'Omar S.', pin: '9999' }, spine.user.id, spine.user.name)
  assert.equal(repinned.name, 'Omar S.')
  assert.throws(() => loginPin('1234'), /Invalid credentials/)
  assert.equal(loginPin('9999').id, waiter.id)
  assert.equal(login('omar', 'waiter123').id, waiter.id, 'an update that omits the password must keep the hash')

  assert.throws(() => deleteStaff(spine.user.id, spine.user.id, spine.user.name), /last active account with this role/,
    'deactivating the only admin would lock everybody out')
  assert.equal(getStaff(spine.user.id).is_active, 1)

  const second = createStaff({ username: 'sara', password: 'waiter123', role_id: cashier.id }, spine.user.id, spine.user.name)
  assert.equal(second.name, 'sara', 'the username stands in for a missing display name')

  assert.equal(deleteStaff(waiter.id, spine.user.id, spine.user.name).success, true)
  assert.equal(getStaff(waiter.id).is_active, 0, 'deleteStaff deactivates instead of erasing')
  assert.throws(() => login('omar', 'waiter123'), /inactive/)

  assert.throws(() => deleteRole(cashier.id, spine.user.id, spine.user.name), /still has users/)
  assert.throws(() => deleteRole(spine.user.role_id, spine.user.id, spine.user.name), /system role/)
  assert.deepEqual(
    updateRole(cashier.id, 'Cashier', 'Till operators', ['pos.access', 'reports.view'], spine.user.id, spine.user.name).permissions.sort(),
    ['pos.access', 'reports.view']
  )

  assert.equal(updateStaff(second.id, { role_id: spine.user.role_id, is_active: 1 }).role_name, 'Admin')
  assert.throws(() => deleteRole(cashier.id, spine.user.id, spine.user.name), /still has users/,
    'a deactivated account still occupies its role')
  assert.equal(updateStaff(waiter.id, { role_id: spine.user.role_id }).role_name, 'Admin')
  assert.equal(deleteRole(cashier.id, spine.user.id, spine.user.name).success, true)
  assert.equal(listRoles().find((role: any) => role.id === cashier.id), undefined)
  assert.equal(
    queryOne<{ c: number }>('SELECT COUNT(*) AS c FROM role_permissions WHERE role_id = ?', [cashier.id]).c,
    0,
    'role_permissions must cascade with the role'
  )

  setSetting('test.flag', 'on', 'general', spine.user.id, spine.user.name)
  assert.equal(getSetting('test.flag'), 'on')
  assert.equal(getSetting('missing.key'), null)
  assert.throws(() => setSetting('', 'x'), /key is required/)
  bulkSet([
    { key: 'test.a', value: '1', group: 'backup' },
    { key: 'test.b', value: '2', group: 'backup' }
  ])
  assert.equal(getSetting('test.a'), '1')

  const restaurant = updateRestaurant({ name: 'Spine Diner Extended', currency: 'PKR', tax_rate: 5 }, spine.user.id, spine.user.name)
  assert.equal(restaurant.name, 'Spine Diner Extended')
  assert.equal(restaurant.currency, 'PKR')
  assert.equal(restaurant.tax_rate, 5)
  assert.equal(restaurant.receipt_footer, 'See you soon', 'fields left out of the patch survive')
  assert.equal(restaurant.timezone, 'Asia/Karachi')
  assert.equal(getRestaurant().name, 'Spine Diner Extended')
})

test('customers, their tickets and the audit trail are queryable', () => {
  assert.throws(() => createCustomer({ phone: '0300' }, spine.user.id, spine.user.name), /name is required/)
  assert.throws(() => getCustomer('no-such-customer'), /not found/)

  const customer = createCustomer(
    { name: 'Bilal Khan', phone: '0311-1111111', email: 'bilal@example.com', address: '5 Club Road', notes: 'Window seat' },
    spine.user.id,
    spine.user.name
  )
  assert.equal(customer.name, 'Bilal Khan')
  assert.equal(customer.order_count, 0, 'a brand new customer has no history')
  assert.equal(customer.total_spending, 0)
  assert.equal(customer.last_order_at, null)

  const delivery = createOrder({
    order_type: 'delivery',
    customer_id: customer.id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    delivery_fee: 60,
    user_id: spine.user.id,
    items: [{ product_id: spine.product.id, quantity: 2 }]
  })
  assert.equal(delivery.customer_id, customer.id)
  assert.equal(delivery.subtotal, 200, 'two burgers at the counter price')
  const ticketTotal = Math.round((delivery.subtotal + delivery.tax_amount + 60) * 100) / 100
  assert.equal(delivery.total, ticketTotal, 'the delivery fee is added after tax')

  processPayment({ orderId: delivery.id, payments: [{ method: 'cash', amount: ticketTotal }] }, spine.user.id, spine.user.name)

  const listed = listCustomers({}).customers.find((row: any) => row.id === customer.id)
  assert.equal(listed.order_count, 1, 'the lifetime stats come from the tickets, not a column nothing writes')
  assert.equal(listed.total_spending, ticketTotal)
  assert.notEqual(listed.last_order_at, null)
  assert.equal(getCustomer(customer.id).total_spending, ticketTotal)

  const unpaid = createOrder({
    order_type: 'delivery',
    customer_id: customer.id,
    user_id: spine.user.id,
    items: [{ product_id: spine.product.id, quantity: 1 }]
  })
  assert.equal(listCustomers({ search: 'bilal' }).customers.length, 1)
  assert.equal(listCustomers({ search: 'Bilal' }).total, 1)
  assert.equal(searchCustomers('0311-111').length, 1)
  assert.equal(listCustomers({ search: 'nobody' }).total, 0)
  assert.equal(getCustomerOrders(customer.id).length, 2, 'the tab shows every ticket, paid or not')
  assert.equal(getCustomerOrders(customer.id)[0].id, unpaid.id)

  const patched = updateCustomer(customer.id, { phone: '0322-2222222' }, spine.user.id, spine.user.name)
  assert.equal(patched.phone, '0322-2222222')
  assert.equal(patched.name, 'Bilal Khan', 'a partial patch must not blank the other fields')
  assert.equal(deleteOrder(unpaid.id, spine.user.id), true)
  assert.equal(listCustomers({}).customers.find((row: any) => row.id === customer.id).order_count, 1)

  assert.equal(deleteCustomer(customer.id, spine.user.id, spine.user.name).success, true)
  assert.throws(() => getCustomer(customer.id), /not found/)
  assert.throws(() => updateCustomer(customer.id, { phone: '1' }), /not found/)
  assert.throws(() => deleteCustomer(customer.id), /not found/)

  const { logs, total } = listLogs({ action: 'process_payment' })
  assert.ok(total >= 3, 'every payment is in the audit trail')
  assert.equal(logs.length, total)
  assert.ok(logs.every((entry: any) => entry.entity === 'order'))
  assert.equal(listLogs({ userId: spine.user.id, entity: 'cash_register' }).total, 2, 'open and close are both logged')
  assert.equal(listLogs({ action: 'never_happened' }).total, 0)
  assert.ok(listLogs({ startDate: '2000-01-01', endDate: '2000-01-02' }).total === 0)
  assert.ok(listLogs({ search: 'close_register' }).total >= 1)

  const page = listLogs({ limit: 5 })
  assert.equal(page.logs.length, 5)
  assert.ok(page.total > 5)
  assert.equal(
    listLogs({ limit: 5, offset: 5 }).logs.every((entry: any, index: number) => entry.id !== page.logs[index].id),
    true,
    'paging must not repeat rows'
  )

  const csv = exportLogs({ action: 'user_login' })
  assert.equal(csv.split('\n')[0], 'ID,Date,User,Action,Entity,Entity ID,Details')
  assert.ok(csv.includes('user_login'))
  assert.equal(csv.split('\n').length - 1, listLogs({ action: 'user_login' }).logs.length)
})

test('printers and backups round-trip through the real tables', async () => {
  const receipt = saveConfig({
    name: 'Front Receipt',
    type: 'receipt',
    printer_name: 'TM-T88',
    paper_width: 80,
    copies: 2,
    auto_print: 1,
    is_default: 1
  })
  assert.equal(receipt.is_default, 1)
  assert.equal(receipt.copies, 2)

  const kitchen = saveConfig({ name: 'Kitchen Pass', type: 'kitchen', printer_name: 'TM-T70', paper_width: 58 })
  assert.equal(kitchen.is_default, 0)
  assert.equal(getConfigs()[0].id, receipt.id, 'the default printer sorts first')

  const renamed = saveConfig({ id: kitchen.id, name: 'Kitchen Line', type: 'kitchen', printer_name: 'TM-T70', paper_width: 58 })
  assert.equal(renamed.name, 'Kitchen Line')
  assert.equal(getConfigs().length, 2)
  assert.throws(() => saveConfig({ type: 'receipt' }), /printer name is required/)
  assert.throws(() => deleteConfig('no-such-printer'), /not found/)

  const ticket = await printKitchenTicket(spine.paidOrder.id)
  assert.match(ticket.html, /Order/)
  assert.match(ticket.html, /Burger/)

  const printed = await printReceipt(spine.paidOrder.id)
  assert.equal(printed.printer_name, 'TM-T88')
  assert.equal(printed.copies, 2)
  assert.match(printed.html, /Spine Diner Extended/)
  assert.ok(printed.html.includes(spine.paidOrder.order_number))
  assert.match(printed.html, /See you soon/)

  assert.equal((await testPrint(receipt.id)).printer_name, 'TM-T88')
  const nameless = saveConfig({ name: 'No Device', type: 'receipt', paper_width: 80 })
  await assert.rejects(() => testPrint(nameless.id), /no printer name/)

  const before = getBackupSettings()
  assert.equal(before.retain_count, 7, 'an unset preference falls back to the default')
  const after = updateBackupSettings({ auto_backup_enabled: 1, backup_frequency: 'weekly', backup_location: '', retain_count: 3 })
  assert.equal(after.auto_backup_enabled, 1)
  assert.equal(after.backup_frequency, 'weekly')
  assert.equal(after.retain_count, 3)
  assert.equal(getSetting('backup.frequency'), 'weekly')
  assert.equal(getBackupSettings().backup_location, before.backup_location)

  const backup = await createBackup(spine.user.id, spine.user.name)
  assert.match(backup.filename, /^backup_.+\.db$/)
  assert.equal(fs.existsSync(backup.filepath), true)
  assert.ok(fs.statSync(backup.filepath).size > 0, 'a backup of an empty file would restore nothing')
  assert.equal(backup.filepath.startsWith(tmpDir), true, 'the snapshot lands inside the configured folder')
  const listed = listBackups()
  assert.equal(listed.length, 1)
  assert.equal(listed[0].user_name, spine.user.name)
  assert.equal(listed[0].size, fs.statSync(backup.filepath).size)

  const second = await createBackup(spine.user.id, spine.user.name, 'auto')
  assert.equal(listBackups().length, 2)
  assert.equal(listBackups()[0].type, 'auto', 'newest snapshot first')
  assert.equal(deleteBackup(second.id, spine.user.id, spine.user.name).success, true)
  assert.equal(fs.existsSync(second.filepath), false, 'deleting must take the file with it')
  assert.equal(listBackups().length, 1)
  assert.throws(() => deleteBackup(second.id), /not found/)

  execute(`INSERT INTO categories (id, name) VALUES ('cat-after-backup', 'After Backup')`)

  assert.equal((await restoreBackup(backup.id, spine.user.id, spine.user.name)).success, true)
  assert.equal(
    queryOne("SELECT id FROM categories WHERE id = 'cat-after-backup'"),
    null,
    'restoring must roll the live database back to the snapshot'
  )
  // The snapshot is exported before its own row is written, so the backup list rewinds with it.
  assert.equal(listBackups().length, 0)
  assert.equal(fs.existsSync(backup.filepath), true, 'the file itself survives its own restore')
  fs.unlinkSync(backup.filepath)
  await assert.rejects(() => restoreBackup('no-such-backup'), /Backup not found/)
})

after(() => {
  closeDb()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})
