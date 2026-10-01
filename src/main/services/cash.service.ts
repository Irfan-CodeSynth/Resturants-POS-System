import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

export function openRegister(userId: string, openingAmount: number, userName: string) {
  const existing = queryOne<any>(`SELECT * FROM cash_registers WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1`)
  if (existing) throw new Error('A cash register is already open')

  const amount = Number(openingAmount)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('The opening amount must be zero or more')

  const id = uuid()
  execute(
    `INSERT INTO cash_registers (id, user_id, opening_amount, status, opened_at)
     VALUES (?, ?, ?, 'open', datetime('now'))`,
    [id, userId || null, amount]
  )

  createAuditLog(userId || null, userName || null, 'open_register', 'cash_register', id, JSON.stringify({ openingAmount: amount }))
  return getRegister(id)
}

export function closeRegister(registerId: string, actualAmount: number, notes: string, userId: string, userName: string) {
  const register = queryOne<any>(`SELECT * FROM cash_registers WHERE id = ? AND status = 'open'`, [registerId])
  if (!register) throw new Error('No open register found')

  const actual = Number(actualAmount)
  if (!Number.isFinite(actual) || actual < 0) throw new Error('The counted amount must be zero or more')

  const moved = Number(
    (queryOne<{ total: number | null }>('SELECT SUM(amount) AS total FROM cash_movements WHERE register_id = ?', [registerId]))?.total ?? 0
  )
  const expectedAmount = Math.round((Number(register.opening_amount) + moved) * 100) / 100
  const difference = Math.round((actual - expectedAmount) * 100) / 100

  execute(
    `UPDATE cash_registers
     SET status = 'closed', closed_at = datetime('now'),
         expected_amount = ?, closing_amount = ?, difference = ?, notes = ?
     WHERE id = ?`,
    [expectedAmount, actual, difference, notes || null, registerId]
  )

  createAuditLog(userId || null, userName || null, 'close_register', 'cash_register', registerId, JSON.stringify({ expectedAmount, actual, difference }))
  return getRegister(registerId)
}

function getRegister(id: string) {
  return queryOne<any>(
    `SELECT r.*, u.name AS user_name
     FROM cash_registers r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [id]
  )
}

export function getActiveRegister(userId?: string) {
  return queryOne<any>(
    `SELECT r.*, u.name AS user_name
     FROM cash_registers r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.status = 'open'
       AND (? IS NULL OR r.user_id = ?)
     ORDER BY r.opened_at DESC LIMIT 1`,
    [userId ?? null, userId ?? null]
  )
}

export function addMovement(
  registerId: string,
  type: string,
  amount: number,
  reason: string,
  userId: string | null,
  reference?: { type: string; id: string }
) {
  const register = queryOne<any>(`SELECT id FROM cash_registers WHERE id = ?`, [registerId])
  if (!register) throw new Error('Cash register not found')

  const id = uuid()
  execute(
    `INSERT INTO cash_movements (id, register_id, type, amount, reason, reference_type, reference_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, registerId, type, amount, reason || null, reference?.type ?? null, reference?.id ?? null, userId || null]
  )
  return getMovement(id)
}

function getMovement(id: string) {
  return queryOne<any>(
    `SELECT m.*, u.name AS user_name
     FROM cash_movements m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.id = ?`,
    [id]
  )
}

export function cashIn(registerId: string, amount: number, reason: string, userId: string) {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Cash-in amount must be positive')
  return addMovement(registerId, 'cash_in', numeric, reason, userId, { type: 'manual', id: registerId })
}

export function cashOut(registerId: string, amount: number, reason: string, userId: string) {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('Cash-out amount must be positive')
  if (!reason) throw new Error('A reason is required for cash out')
  return addMovement(registerId, 'cash_out', -numeric, reason, userId, { type: 'manual', id: registerId })
}

export function getHistory(filters: any = {}) {
  const where: string[] = ['1=1']
  const params: any[] = []

  if (filters?.status) {
    where.push('r.status = ?')
    params.push(filters.status)
  }
  if (filters?.user_id) {
    where.push('r.user_id = ?')
    params.push(filters.user_id)
  }
  if (filters?.start_date && filters?.end_date) {
    where.push(`date(r.opened_at) BETWEEN date(?) AND date(?)`)
    params.push(filters.start_date, filters.end_date)
  }

  return queryAll(
    `SELECT r.*, u.name AS user_name
     FROM cash_registers r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY r.opened_at DESC`,
    params
  )
}

export function getMovements(registerId: string) {
  // created_at only has second resolution, so rowid breaks ties within the same second.
  return queryAll(
    `SELECT m.*, u.name AS user_name
     FROM cash_movements m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.register_id = ?
     ORDER BY m.created_at DESC, m.rowid DESC`,
    [registerId]
  )
}

export function addSaleMovement(registerId: string, amount: number, orderId: string, userId: string | null) {
  return addMovement(registerId, 'sale', amount, 'Order payment', userId, { type: 'order', id: orderId })
}

export function addRefundMovement(registerId: string, amount: number, orderId: string, userId: string | null) {
  return addMovement(registerId, 'refund', -amount, 'Order refund', userId, { type: 'order', id: orderId })
}
