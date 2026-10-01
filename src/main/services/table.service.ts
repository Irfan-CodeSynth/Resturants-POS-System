import { queryAll, queryOne, execute, runTransaction } from '../database/connection'
import { v4 as uuid } from 'uuid'

const TABLE_STATUSES = ['available', 'occupied', 'reserved', 'cleaning']

function assertStatus(status: string): void {
  if (!TABLE_STATUSES.includes(status)) throw new Error(`Unsupported table status: ${status}`)
}

export function listTables() {
  return queryAll<any>(
    `SELECT t.*, o.order_number AS current_order_number, o.total AS current_order_total
     FROM tables t
     LEFT JOIN orders o ON o.id = t.current_order_id
     ORDER BY t.number ASC`,
    []
  )
}

export function getTable(id: string) {
  return queryOne<any>('SELECT * FROM tables WHERE id = ?', [id])
}

export function createTable(data: any) {
  const number = Number(data?.number ?? data?.table_number)
  if (!Number.isInteger(number) || number <= 0) throw new Error('A positive whole table number is required')

  const existing = queryOne<{ id: string }>('SELECT id FROM tables WHERE number = ?', [number])
  if (existing) throw new Error(`Table ${number} already exists`)

  const id = uuid()
  execute(
    `INSERT INTO tables (id, number, name, capacity, position_x, position_y, floor, shape, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
    [
      id,
      number,
      data.name || `Table ${number}`,
      Number(data.capacity) || 4,
      Number(data.position_x) || 0,
      Number(data.position_y) || 0,
      data.floor || data.area || 'Main',
      data.shape || 'square'
    ]
  )
  return getTable(id)
}

export function updateTable(id: string, data: any) {
  const table = getTable(id)
  if (!table) throw new Error('Table not found')

  const number = data.number ?? data.table_number
  if (number !== undefined) {
    const clash = queryOne<{ id: string }>('SELECT id FROM tables WHERE number = ? AND id <> ?', [Number(number), id])
    if (clash) throw new Error(`Table ${number} already exists`)
  }

  execute(
    `UPDATE tables SET
       number = COALESCE(?, number),
       name = COALESCE(?, name),
       capacity = COALESCE(?, capacity),
       position_x = COALESCE(?, position_x),
       position_y = COALESCE(?, position_y),
       floor = COALESCE(?, floor),
       shape = COALESCE(?, shape),
       updated_at = datetime('now')
     WHERE id = ?`,
    [
      number !== undefined ? Number(number) : null,
      data.name ?? null,
      data.capacity !== undefined ? Number(data.capacity) : null,
      data.position_x !== undefined ? Number(data.position_x) : null,
      data.position_y !== undefined ? Number(data.position_y) : null,
      data.floor ?? data.area ?? null,
      data.shape ?? null,
      id
    ]
  )
  return getTable(id)
}

export function deleteTable(id: string) {
  const table = getTable(id)
  if (!table) throw new Error('Table not found')
  if (table.current_order_id) throw new Error('Cannot delete a table with an open order')
  if (table.status === 'occupied') throw new Error('Cannot delete a table that is currently in use')

  execute('DELETE FROM tables WHERE id = ?', [id])
  return true
}

export function updateStatus(id: string, status: string) {
  assertStatus(status)
  const table = getTable(id)
  if (!table) throw new Error('Table not found')

  execute(`UPDATE tables SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, id])
  if (status === 'available') {
    execute('UPDATE tables SET current_order_id = NULL WHERE id = ?', [id])
  }
  return getTable(id)
}

export function transferTable(fromId: string, toId: string) {
  if (fromId === toId) throw new Error('Choose two different tables')

  runTransaction(() => {
    const from = getTable(fromId)
    if (!from) throw new Error('Source table not found')
    const to = getTable(toId)
    if (!to) throw new Error('Destination table not found')
    if (to.current_order_id) throw new Error('Destination table is already occupied')

    const orderId = from.current_order_id
    if (!orderId) throw new Error('The source table has no order to move')

    execute(`UPDATE tables SET status = 'cleaning', current_order_id = NULL, updated_at = datetime('now') WHERE id = ?`, [fromId])
    execute(`UPDATE tables SET status = 'occupied', current_order_id = ?, updated_at = datetime('now') WHERE id = ?`, [orderId, toId])
    execute(`UPDATE orders SET table_id = ?, updated_at = datetime('now') WHERE id = ?`, [toId, orderId])
  })

  return true
}
