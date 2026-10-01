import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

const EXPENSE_SELECT = `
  SELECT e.*, c.name AS category_name, u.name AS user_name
  FROM expenses e
  LEFT JOIN expense_categories c ON c.id = e.category_id
  LEFT JOIN users u ON u.id = e.user_id
`

function readDate(filters: any): string | undefined {
  return filters?.startDate ?? filters?.start_date ?? filters?.from
}

function readEndDate(filters: any): string | undefined {
  return filters?.endDate ?? filters?.end_date ?? filters?.to
}

export function listExpenses(filters: any = {}) {
  let query = `${EXPENSE_SELECT} WHERE 1=1`
  const params: any[] = []

  if (filters?.categoryId) {
    query += ' AND e.category_id = ?'
    params.push(filters.categoryId)
  }

  const startDate = readDate(filters)
  const endDate = readEndDate(filters)
  if (startDate && endDate) {
    query += ' AND date(e.date) BETWEEN date(?) AND date(?)'
    params.push(startDate, endDate)
  }

  // e.date is user input, so rowid keeps same-day ordering stable.
  query += ' ORDER BY e.date DESC, e.rowid DESC'
  return queryAll(query, params)
}

function getExpense(id: string) {
  return queryOne(`${EXPENSE_SELECT} WHERE e.id = ?`, [id])
}

export function createExpense(data: any, adminId?: string, adminName?: string) {
  if (!data?.date && !data?.expense_date) throw new Error('An expense date is required')

  const id = uuid()
  execute(
    `INSERT INTO expenses (id, category_id, amount, date, description, payment_method, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.category_id || null,
      data.amount ?? 0,
      data.date ?? data.expense_date,
      data.description || null,
      data.payment_method || 'cash',
      // expenses.user_id is a foreign key, so only a real user id may be stored.
      data.user_id ?? adminId ?? null
    ]
  )

  createAuditLog(adminId || 'system', adminName || 'System', 'create_expense', 'expenses', id, JSON.stringify({ ...data, receipt_image: undefined }))
  return getExpense(id)
}

export function updateExpense(id: string, data: any, adminId?: string, adminName?: string) {
  const existing = queryOne<any>('SELECT * FROM expenses WHERE id = ?', [id])
  if (!existing) throw new Error('Expense not found')

  const updates: string[] = []
  const values: any[] = []

  if (data.category_id !== undefined) { updates.push('category_id = ?'); values.push(data.category_id || null) }
  if (data.amount !== undefined) { updates.push('amount = ?'); values.push(data.amount) }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
  if (data.payment_method !== undefined) { updates.push('payment_method = ?'); values.push(data.payment_method) }
  const newDate = data.date ?? data.expense_date
  if (newDate !== undefined) { updates.push('date = ?'); values.push(newDate) }

  if (updates.length > 0) {
    values.push(id)
    execute(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, values)
    createAuditLog(adminId || 'system', adminName || 'System', 'update_expense', 'expenses', id, JSON.stringify(data))
  }

  return getExpense(id)
}

export function deleteExpense(id: string, adminId?: string, adminName?: string) {
  const existing = queryOne('SELECT id FROM expenses WHERE id = ?', [id])
  if (!existing) throw new Error('Expense not found')

  execute('DELETE FROM expenses WHERE id = ?', [id])
  createAuditLog(adminId || 'system', adminName || 'System', 'delete_expense', 'expenses', id, JSON.stringify({ id }))
  return { success: true }
}

export function listCategories() {
  return queryAll('SELECT * FROM expense_categories ORDER BY name ASC', [])
}

export function createCategory(name: string, description: string) {
  if (!name) throw new Error('A category name is required')
  const existing = queryOne<{ id: string }>('SELECT id FROM expense_categories WHERE name = ?', [name])
  if (existing) throw new Error('An expense category with that name already exists')

  const id = uuid()
  execute('INSERT INTO expense_categories (id, name, description) VALUES (?, ?, ?)', [id, name, description || null])
  return { id }
}

export function updateCategory(id: string, name: string, description: string) {
  const existing = queryOne<any>('SELECT * FROM expense_categories WHERE id = ?', [id])
  if (!existing) throw new Error('Expense category not found')

  execute('UPDATE expense_categories SET name = ?, description = ? WHERE id = ?', [
    name ?? existing.name,
    description ?? existing.description,
    id
  ])
  return { success: true }
}

export function deleteCategory(id: string) {
  const count = queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM expenses WHERE category_id = ?', [id])
  if (Number(count?.count ?? 0) > 0) throw new Error('Cannot delete category with associated expenses')

  execute('DELETE FROM expense_categories WHERE id = ?', [id])
  return { success: true }
}
