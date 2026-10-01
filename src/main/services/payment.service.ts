import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { deductByRecipe } from './inventory.service'
import { addSaleMovement, addRefundMovement } from './cash.service'
import { v4 as uuid } from 'uuid'

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other']

function r2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

function paidSoFar(orderId: string): number {
  const row = queryOne<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM payments WHERE order_id = ?',
    [orderId]
  )
  return r2(Number(row?.total ?? 0))
}

function openRegisterId(): string | null {
  return queryOne<{ id: string }>(`SELECT id FROM cash_registers WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`)?.id ?? null
}

export function processPayment(data: any, userId?: string, userName?: string) {
  const orderId = data?.orderId
  const tenders: any[] = data?.payments ?? []
  if (!orderId) throw new Error('An order id is required')
  if (!tenders.length) throw new Error('At least one payment is required')

  let result: { orderId: string; total: number; change: number } | null = null

  runTransaction(() => {
    const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) throw new Error('Order not found')
    if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
      throw new Error(`Order is ${order.status} and cannot be paid`)
    }

    let incoming = 0
    for (const tender of tenders) {
      const method = String(tender.method || 'cash')
      if (!PAYMENT_METHODS.includes(method)) throw new Error(`Unsupported payment method: ${method}`)
      const amount = r2(Number(tender.amount))
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Each payment must be a positive amount')
      incoming += amount
    }
    incoming = r2(incoming)

    const outstanding = r2(Number(order.total) - paidSoFar(orderId))
    if (incoming + 0.001 < outstanding) {
      throw new Error(`Payment of ${incoming} is short of the ${outstanding} outstanding`)
    }

    // Only cash over-tenders, and the change belongs to the last cash tender.
    const cashTotal = r2(
      tenders
        .filter((t) => String(t.method || 'cash') === 'cash')
        .reduce((sum, t) => sum + r2(Number(t.amount)), 0)
    )
    const change = r2(Math.max(0, Math.min(cashTotal, incoming) - Math.max(0, outstanding)))

    for (const tender of tenders) {
      const amount = r2(Number(tender.amount))
      execute(
        `INSERT INTO payments (id, order_id, method, amount, reference, received_amount, change_amount, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          orderId,
          String(tender.method || 'cash'),
          amount,
          tender.reference ?? tender.reference_number ?? null,
          r2(Number(tender.received_amount ?? amount)),
          0,
          userId || null
        ]
      )
    }
    if (change > 0) {
      execute(
        `UPDATE payments SET change_amount = ? WHERE id = (
           SELECT id FROM payments WHERE order_id = ? AND method = 'cash' ORDER BY created_at DESC LIMIT 1
         )`,
        [change, orderId]
      )
    }

    execute(
      `UPDATE orders SET status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [orderId]
    )

    // Recipe-driven stock depletion happens exactly once, when the money is taken.
    const items = queryAll<any>('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId])
    for (const item of items) {
      if (!item.product_id) continue
      deductByRecipe(item.product_id, Number(item.quantity), orderId, userId, userName)
    }

    const registerId = openRegisterId()
    if (registerId) {
      addSaleMovement(registerId, r2(incoming - change), orderId, userId || null)
    }

    if (order.table_id) {
      execute(
        `UPDATE tables SET status = 'cleaning', current_order_id = NULL, updated_at = datetime('now')
         WHERE id = ? AND current_order_id = ?`,
        [order.table_id, orderId]
      )
    }

    createAuditLog(userId || null, userName || null, 'process_payment', 'order', orderId, `Order ${order.order_number} paid ${incoming}, change ${change}`)
    result = { orderId, total: Number(order.total), change }
  })

  return result
}

export function refund(orderId: string, amount: number, reason: string, userId?: string, approvedBy?: string, userName?: string) {
  if (!reason) throw new Error('A refund reason is required')
  const numeric = r2(Number(amount))
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Refund amount must be positive')

  runTransaction(() => {
    const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) throw new Error('Order not found')

    const alreadyRefunded = r2(
      Number((queryOne<{ total: number | null }>('SELECT SUM(amount) AS total FROM refunds WHERE order_id = ?', [orderId]))?.total ?? 0)
    )
    const refundable = r2(Number(order.total) - alreadyRefunded)
    if (numeric > refundable + 0.001) {
      throw new Error(`Refund of ${numeric} exceeds the ${refundable} still refundable on this order`)
    }

    execute(
      `INSERT INTO refunds (id, order_id, amount, reason, user_id, approved_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), orderId, numeric, reason, userId || null, approvedBy || null]
    )

    execute(
      `UPDATE orders SET status = 'refunded', updated_at = datetime('now') WHERE id = ?`,
      [orderId]
    )

    const registerId = openRegisterId()
    if (registerId) {
      addRefundMovement(registerId, numeric, orderId, userId || null)
    }

    createAuditLog(userId || null, userName || null, 'refund', 'order', orderId, `Refunded ${numeric} (${reason})`)
  })

  return true
}

export function getPaymentsByOrder(orderId: string) {
  return queryAll('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at ASC', [orderId])
}
