import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { Supplier, PaginatedResponse, PaginatedRequest } from '../../shared/types'

export function listSuppliers(filters?: PaginatedRequest): PaginatedResponse<Supplier> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  const search = filters?.search ? `%${filters.search}%` : null

  let query = `
    SELECT s.*,
           (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id) as purchase_count,
           (SELECT SUM(total) FROM purchases p WHERE p.supplier_id = s.id) as total_purchases
    FROM suppliers s
    WHERE s.is_active = 1
  `
  const params: any[] = []

  if (search) {
    query += ` AND (s.name LIKE ? OR s.company LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`
    params.push(search, search, search, search)
  }

  query += ` ORDER BY s.name ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<Supplier>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM suppliers s WHERE s.is_active = 1'
  const countParams: any[] = []
  
  if (search) {
    countQuery += ` AND (s.name LIKE ? OR s.company LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`
    countParams.push(search, search, search, search)
  }

  const countResult = queryOne<{count: number}>(countQuery, countParams)
  const total = countResult?.count || 0

  return {
    data,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  }
}

export function getSupplier(id: string): Supplier | null {
  return queryOne<Supplier>(
    `SELECT s.*,
           (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id) as purchase_count,
           (SELECT SUM(total) FROM purchases p WHERE p.supplier_id = s.id) as total_purchases
    FROM suppliers s WHERE id = ? AND is_active = 1`,
    [id]
  )
}

export function createSupplier(data: Partial<Supplier>, userId?: string, userName?: string): Supplier {
  const id = uuid()
  const now = new Date().toISOString()
  
  execute(
    `INSERT INTO suppliers (id, name, company, phone, email, address, tax_id, notes, is_active, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.name,
      data.company || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.tax_id || null,
      data.notes || null,
      now,
      now
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'SUPPLIER', id, `Created supplier ${data.name}`)
  
  return getSupplier(id)!
}

export function updateSupplier(id: string, data: Partial<Supplier>, userId?: string, userName?: string): Supplier | null {
  const now = new Date().toISOString()
  const existing = getSupplier(id)
  
  if (!existing) return null

  execute(
    `UPDATE suppliers 
     SET name = COALESCE(?, name),
         company = COALESCE(?, company),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         tax_id = COALESCE(?, tax_id),
         notes = COALESCE(?, notes),
         updated_at = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.company ?? existing.company,
      data.phone ?? existing.phone,
      data.email ?? existing.email,
      data.address ?? existing.address,
      data.tax_id ?? existing.tax_id,
      data.notes ?? existing.notes,
      now,
      id
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'SUPPLIER', id, `Updated supplier ${existing.name}`)
  
  return getSupplier(id)
}

export function deleteSupplier(id: string, userId?: string, userName?: string): boolean {
  const supplier = getSupplier(id)
  if (!supplier) return false

  execute('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id])
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'SUPPLIER', id, `Deleted supplier ${supplier.name}`)
  
  return true
}
