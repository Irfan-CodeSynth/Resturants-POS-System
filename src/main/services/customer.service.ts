import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

const WRITABLE_FIELDS = ['name', 'phone', 'email', 'address', 'notes'] as const

// Nothing in the app writes customers.total_spending / order_count / last_order_at, so reading
// the stored columns would show every customer as brand new forever.
const CUSTOMER_SELECT = `
  SELECT c.id, c.name, c.phone, c.email, c.address, c.notes, c.created_at, c.updated_at,
         (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.status = 'completed') AS order_count,
         (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.customer_id = c.id AND o.status = 'completed') AS total_spending,
         (SELECT MAX(o.created_at) FROM orders o WHERE o.customer_id = c.id AND o.status = 'completed') AS last_order_at
  FROM customers c
`

export function listCustomers(filters: any = {}) {
  const where: string[] = ['1=1']
  const params: any[] = []

  if (filters?.search) {
    where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)')
    const like = `%${filters.search}%`
    params.push(like, like, like)
  }

  const whereSql = where.join(' AND ')
  const total = Number(
    (queryOne<{ c: number }>(`SELECT COUNT(*) AS c FROM customers WHERE ${whereSql}`, params))?.c ?? 0
  )

  let query = `${CUSTOMER_SELECT} WHERE ${whereSql} ORDER BY c.created_at DESC, c.rowid DESC`
  const pageParams = [...params]
  if (filters?.limit) {
    query += ' LIMIT ? OFFSET ?'
    pageParams.push(Number(filters.limit), Number(filters.offset ?? 0))
  }

  return { customers: queryAll(query, pageParams), total }
}

export function getCustomer(id: string) {
  const customer = queryOne(`${CUSTOMER_SELECT} WHERE c.id = ?`, [id])
  if (!customer) throw new Error('Customer not found')
  return customer
}

export function createCustomer(data: any, adminId?: string, adminName?: string) {
  if (!data?.name) throw new Error('Customer name is required')

  const id = uuid()
  execute(
    `INSERT INTO customers (id, name, phone, email, address, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.phone || null, data.email || null, data.address || null, data.notes || null]
  )

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'create_customer', 'customers', id, JSON.stringify({ name: data.name }))
  }
  return getCustomer(id)
}

export function updateCustomer(id: string, data: any, adminId?: string, adminName?: string) {
  if (!queryOne<{ id: string }>('SELECT id FROM customers WHERE id = ?', [id])) throw new Error('Customer not found')

  const updates: string[] = []
  const values: any[] = []

  for (const field of WRITABLE_FIELDS) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(data[field])
    }
  }

  if (updates.length === 0) return getCustomer(id)

  execute(
    `UPDATE customers SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    [...values, id]
  )

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'update_customer', 'customers', id, JSON.stringify({ fields: updates }))
  }
  return getCustomer(id)
}

export function deleteCustomer(id: string, adminId?: string, adminName?: string) {
  if (!queryOne<{ id: string }>('SELECT id FROM customers WHERE id = ?', [id])) throw new Error('Customer not found')

  execute('DELETE FROM customers WHERE id = ?', [id])

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'delete_customer', 'customers', id, JSON.stringify({}))
  }
  return { success: true }
}

export function searchCustomers(query: string) {
  const like = `%${query}%`
  return queryAll(
    `SELECT id, name, phone, email FROM customers
     WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 20`,
    [like, like]
  )
}

export function getCustomerOrders(customerId: string) {
  return queryAll(
    `SELECT id, order_number, order_type, status, total, created_at
     FROM orders WHERE customer_id = ? ORDER BY created_at DESC, rowid DESC`,
    [customerId]
  )
}
