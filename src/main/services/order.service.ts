import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

// A parked order keeps its status and is flagged with is_held, so 'held' stays out of
// the OrderStatus union declared in shared/types.ts.
const EDITABLE_STATUSES = ['draft']

function r2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

function getRestaurantRow(): { tax_rate: number; service_charge_rate: number } {
  return (
    queryOne<{ tax_rate: number; service_charge_rate: number }>(
      `SELECT tax_rate, service_charge_rate FROM restaurant WHERE id = '1'`
    ) || { tax_rate: 0, service_charge_rate: 0 }
  )
}

function requireOrder(orderId: string): any {
  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [orderId])
  if (!order) throw new Error('Order not found')
  return order
}

export function generateOrderNumber(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  // ORD-YYYYMMDD-NNNN: the sequence starts at character 14, so a deleted order cannot recycle a number.
  const row = queryOne<{ max_seq: number | null }>(
    `SELECT MAX(CAST(SUBSTR(order_number, 14) AS INTEGER)) AS max_seq
     FROM orders WHERE order_number LIKE ?`,
    [`ORD-${today}-%`]
  )
  const next = (Number(row?.max_seq ?? 0) || 0) + 1
  return `ORD-${today}-${String(next).padStart(4, '0')}`
}

export function getOrder(id: string): any {
  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [id])
  if (!order) return null

  order.items = queryAll<any>('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC', [id])
  for (const item of order.items) {
    item.modifiers = queryAll<any>('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id])
  }
  order.payments = queryAll<any>('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at ASC', [id])
  order.refunds = queryAll<any>('SELECT * FROM refunds WHERE order_id = ? ORDER BY created_at ASC', [id])
  return order
}

export function listOrders(filters: any = {}) {
  const where: string[] = ['1=1']
  const params: unknown[] = []

  if (filters?.status) {
    where.push('status = ?')
    params.push(filters.status)
  }
  if (filters?.order_type) {
    where.push('order_type = ?')
    params.push(filters.order_type)
  }
  if (filters?.user_id) {
    where.push('user_id = ?')
    params.push(filters.user_id)
  }
  if (filters?.table_id) {
    where.push('table_id = ?')
    params.push(filters.table_id)
  }
  if (filters?.customer_id) {
    where.push('customer_id = ?')
    params.push(filters.customer_id)
  }
  if (filters?.held) {
    where.push('is_held = 1')
  }
  if (filters?.search) {
    where.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like)
  }
  if (filters?.start_date && filters?.end_date) {
    where.push(`date(created_at) BETWEEN date(?) AND date(?)`)
    params.push(filters.start_date, filters.end_date)
  } else if (filters?.date) {
    where.push('date(created_at) = date(?)')
    params.push(filters.date)
  }

  const whereSql = where.join(' AND ')
  const total = Number(
    (queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM orders WHERE ${whereSql}`, params))?.c ?? 0
  )

  let query = `SELECT * FROM orders WHERE ${whereSql} ORDER BY created_at DESC`
  const pageParams = [...params]
  if (filters?.limit) {
    const limit = Number(filters.limit)
    const offset = Number(filters.offset ?? 0)
    query += ' LIMIT ? OFFSET ?'
    pageParams.push(limit, offset)
  }

  return { data: queryAll(query, pageParams), total }
}

function insertItemModifiers(orderItemId: string, modifiers: any[]): number {
  if (!modifiers?.length) return 0

  let adjustment = 0
  for (const modifier of modifiers) {
    const row = queryOne<any>('SELECT id, name, price_adjustment FROM modifiers WHERE id = ?', [
      modifier.modifier_id ?? modifier.id
    ])
    if (!row) continue
    execute(
      `INSERT INTO order_item_modifiers (id, order_item_id, modifier_id, modifier_name, price_adjustment)
       VALUES (?, ?, ?, ?, ?)`,
      [uuid(), orderItemId, row.id, row.name, row.price_adjustment]
    )
    adjustment += Number(row.price_adjustment) || 0
  }
  return adjustment
}

export function createOrder(data: any) {
  const orderType = data.order_type || 'dine_in'
  if (!['dine_in', 'takeaway', 'delivery'].includes(orderType)) {
    throw new Error(`Unsupported order type: ${orderType}`)
  }

  const id = uuid()
  const orderNumber = generateOrderNumber()

  runTransaction(() => {
    execute(
      `INSERT INTO orders
        (id, order_number, order_type, status, table_id, customer_id, customer_name, customer_phone,
         customer_address, delivery_fee, delivery_notes, notes, user_id)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderNumber,
        orderType,
        data.table_id || null,
        data.customer_id || null,
        data.customer_name || null,
        data.customer_phone || null,
        data.customer_address || null,
        r2(data.delivery_fee ?? 0),
        data.delivery_notes || null,
        data.notes || null,
        data.user_id || null
      ]
    )

    for (const item of data.items ?? []) {
      addItemWithinTransaction(id, item)
    }

    if (data.table_id) {
      execute(`UPDATE tables SET status = 'occupied', current_order_id = ?, updated_at = datetime('now') WHERE id = ?`, [
        id,
        data.table_id
      ])
    }

    recalculateTotalsWithinTransaction(id)
  })

  createAuditLog(data.user_id || null, null, 'create_order', 'order', id, `Created order ${orderNumber}`)
  return getOrder(id)
}

export function addItem(orderId: string, item: any) {
  const order = requireOrder(orderId)
  assertEditable(order)
  runTransaction(() => {
    addItemWithinTransaction(orderId, item)
    recalculateTotalsWithinTransaction(orderId)
  })
  return getOrder(orderId)
}

function addItemWithinTransaction(orderId: string, item: any) {
  const product = queryOne<any>('SELECT * FROM products WHERE id = ? AND is_active = 1', [item.product_id])
  if (!product) throw new Error('Product not found or unavailable')

  const quantity = Number(item.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Invalid quantity for ${product.name}`)

  // The server owns pricing; a client-supplied price is never trusted.
  const unitPrice = Number(product.selling_price) || 0
  const id = uuid()

  execute(
    `INSERT INTO order_items
      (id, order_id, product_id, product_name, quantity, unit_price, discount_amount, total, notes, status, sent_to_kitchen)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', 0)`,
    [id, orderId, product.id, product.name, quantity, unitPrice, item.notes || null]
  )

  const modifierAdjustment = insertItemModifiers(id, item.modifiers)
  execute('UPDATE order_items SET total = ? WHERE id = ?', [
    r2(quantity * (unitPrice + modifierAdjustment)),
    id
  ])
}

export function updateItem(itemId: string, data: any) {
  const item = queryOne<any>('SELECT * FROM order_items WHERE id = ?', [itemId])
  if (!item) throw new Error('Item not found')
  const order = requireOrder(item.order_id)
  assertEditable(order)
  if (item.sent_to_kitchen && data.quantity !== undefined) {
    throw new Error('Cannot change the quantity of an item already sent to the kitchen')
  }

  runTransaction(() => {
    const quantity =
      data.quantity !== undefined ? Number(data.quantity) : Number(item.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid quantity')

    const modifiers = queryAll<any>(
      'SELECT price_adjustment FROM order_item_modifiers WHERE order_item_id = ?',
      [itemId]
    )
    const modifierAdjustment = modifiers.reduce(
      (sum: number, m: any) => sum + (Number(m.price_adjustment) || 0),
      0
    )

    execute('UPDATE order_items SET quantity = ?, total = ?, notes = ? WHERE id = ?', [
      quantity,
      r2(quantity * (Number(item.unit_price) + modifierAdjustment)),
      data.notes !== undefined ? data.notes : item.notes,
      itemId
    ])

    recalculateTotalsWithinTransaction(item.order_id)
  })

  return getOrder(item.order_id)
}

export function removeItem(itemId: string) {
  const item = queryOne<any>('SELECT * FROM order_items WHERE id = ?', [itemId])
  if (!item) return null
  const order = requireOrder(item.order_id)
  assertEditable(order)
  if (item.sent_to_kitchen) throw new Error('Cannot remove an item already sent to the kitchen')

  runTransaction(() => {
    execute('DELETE FROM order_items WHERE id = ?', [itemId])
    recalculateTotalsWithinTransaction(item.order_id)
  })
  return getOrder(item.order_id)
}

export function recalculateTotals(orderId: string) {
  runTransaction(() => recalculateTotalsWithinTransaction(orderId))
  return getOrder(orderId)
}

function recalculateTotalsWithinTransaction(orderId: string) {
  const restaurant = getRestaurantRow()
  const totals = queryOne<{ subtotal: number | null }>(
    'SELECT SUM(total) AS subtotal FROM order_items WHERE order_id = ?',
    [orderId]
  )
  const order = queryOne<any>('SELECT discount_amount, delivery_fee FROM orders WHERE id = ?', [orderId])
  if (!order) return

  const subtotal = r2(Number(totals?.subtotal ?? 0))
  const discountAmount = r2(Number(order.discount_amount ?? 0))
  const afterDiscount = r2(Math.max(0, subtotal - discountAmount))

  const taxAmount = r2(afterDiscount * (Number(restaurant.tax_rate) || 0) / 100)
  const serviceCharge = r2(afterDiscount * (Number(restaurant.service_charge_rate) || 0) / 100)
  const deliveryFee = r2(Number(order.delivery_fee ?? 0))
  const total = r2(afterDiscount + taxAmount + serviceCharge + deliveryFee)

  execute(
    `UPDATE orders SET subtotal = ?, tax_amount = ?, service_charge = ?, total = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [subtotal, taxAmount, serviceCharge, total, orderId]
  )
}

export function applyDiscount(orderId: string, type: string, value: number, userId?: string) {
  const order = requireOrder(orderId)
  assertEditable(order)
  if (!['percentage', 'fixed'].includes(type)) throw new Error('Discount type must be percentage or fixed')

  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error('Invalid discount value')

  const items = queryOne<{ subtotal: number | null }>(
    'SELECT SUM(total) AS subtotal FROM order_items WHERE order_id = ?',
    [orderId]
  )
  const subtotal = Number(items?.subtotal ?? 0)

  const discountAmount = type === 'percentage'
    ? r2(subtotal * Math.min(numeric, 100) / 100)
    : r2(Math.min(numeric, subtotal))

  runTransaction(() => {
    execute(
      `UPDATE orders SET discount_type = ?, discount_value = ?, discount_amount = ? WHERE id = ?`,
      [type, numeric, discountAmount, orderId]
    )
    recalculateTotalsWithinTransaction(orderId)
  })

  createAuditLog(userId || null, null, 'apply_discount', 'order', orderId, `${type} ${numeric}`)
  return getOrder(orderId)
}

function assertEditable(order: any): void {
  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw new Error(`Order is ${order.status} and can no longer be edited`)
  }
}

export function updateOrder(id: string, data: any) {
  const order = requireOrder(id)
  assertEditable(order)

  runTransaction(() => {
    execute(
      `UPDATE orders
       SET customer_id = COALESCE(?, customer_id),
           customer_name = COALESCE(?, customer_name),
           customer_phone = COALESCE(?, customer_phone),
           customer_address = COALESCE(?, customer_address),
           delivery_fee = COALESCE(?, delivery_fee),
           delivery_notes = COALESCE(?, delivery_notes),
           notes = COALESCE(?, notes),
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        data.customer_id ?? null,
        data.customer_name ?? null,
        data.customer_phone ?? null,
        data.customer_address ?? null,
        data.delivery_fee !== undefined ? r2(Number(data.delivery_fee)) : null,
        data.delivery_notes ?? null,
        data.notes ?? null,
        id
      ]
    )
    recalculateTotalsWithinTransaction(id)
  })

  return getOrder(id)
}

export function updateOrderStatus(id: string, status: string, userId?: string, userName?: string) {
  const allowed = ['draft', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'refunded']
  if (!allowed.includes(status)) throw new Error(`Unsupported status: ${status}`)

  const order = requireOrder(id)
  runTransaction(() => {
    execute(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id])
    if (status === 'completed' || status === 'cancelled') {
      execute(`UPDATE orders SET completed_at = datetime('now') WHERE id = ?`, [id])
      releaseTable(order, id)
    }
  })

  createAuditLog(userId || null, userName || null, 'update_order_status', 'order', id, `${order.order_number} -> ${status}`)
  return getOrder(id)
}

function releaseTable(order: any, orderId: string): void {
  if (!order.table_id) return
  execute(
    `UPDATE tables SET status = 'cleaning', current_order_id = NULL, updated_at = datetime('now')
     WHERE id = ? AND current_order_id = ?`,
    [order.table_id, orderId]
  )
}

export function holdOrder(orderId: string) {
  const order = requireOrder(orderId)
  assertEditable(order)
  execute(`UPDATE orders SET is_held = 1, updated_at = datetime('now') WHERE id = ?`, [orderId])
  return getOrder(orderId)
}

export function recallOrder(orderId: string) {
  requireOrder(orderId)
  execute(`UPDATE orders SET is_held = 0, updated_at = datetime('now') WHERE id = ?`, [orderId])
  return getOrder(orderId)
}

export function getHeldOrders() {
  const orders = queryAll<any>(`SELECT * FROM orders WHERE is_held = 1 ORDER BY updated_at DESC`, [])
  for (const order of orders) {
    order.items = queryAll<any>('SELECT * FROM order_items WHERE order_id = ?', [order.id])
  }
  return orders
}

export function sendToKitchen(orderId: string, userId?: string) {
  const order = requireOrder(orderId)
  assertEditable(order)

  runTransaction(() => {
    execute(
      `UPDATE order_items SET sent_to_kitchen = 1, status = 'pending'
       WHERE order_id = ? AND sent_to_kitchen = 0`,
      [orderId]
    )
    const queued = queryOne<{ c: number }>(
      'SELECT COUNT(*) AS c FROM order_items WHERE order_id = ? AND sent_to_kitchen = 1',
      [orderId]
    )
    if (!Number(queued?.c ?? 0)) throw new Error('Add at least one item before sending to the kitchen')

    execute(`UPDATE orders SET status = 'confirmed', updated_at = datetime('now') WHERE id = ?`, [orderId])
  })

  createAuditLog(userId || null, null, 'send_to_kitchen', 'order', orderId, order.order_number)
  return getOrder(orderId)
}

export function deleteOrder(orderId: string, userId?: string) {
  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [orderId])
  if (!order) return false
  if (!EDITABLE_STATUSES.includes(order.status)) {
    throw new Error('Only draft or held orders can be deleted')
  }

  runTransaction(() => {
    execute(
      'DELETE FROM order_item_modifiers WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?)',
      [orderId]
    )
    execute('DELETE FROM order_items WHERE order_id = ?', [orderId])
    execute('DELETE FROM orders WHERE id = ?', [orderId])
    if (order.table_id) {
      execute(
        `UPDATE tables SET status = 'available', current_order_id = NULL, updated_at = datetime('now')
         WHERE id = ? AND current_order_id = ?`,
        [order.table_id, orderId]
      )
    }
  })

  createAuditLog(userId || null, null, 'delete_order', 'order', orderId, order.order_number)
  return true
}
