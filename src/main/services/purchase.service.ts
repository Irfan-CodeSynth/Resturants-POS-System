import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { Purchase, PurchaseItem, PaginatedResponse, PaginatedRequest } from '../../shared/types'
import { adjustStock } from './inventory.service'

interface PurchaseFilters extends PaginatedRequest {
  supplier_id?: string
  payment_status?: string
  start_date?: string
  end_date?: string
}

export function listPurchases(filters?: PurchaseFilters): PaginatedResponse<Purchase> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  const supplierId = filters?.supplier_id
  const paymentStatus = filters?.payment_status

  let query = `
    SELECT p.*, s.name as supplier_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
  `
  const params: any[] = []

  if (supplierId) {
    query += ` AND p.supplier_id = ?`
    params.push(supplierId)
  }

  if (paymentStatus) {
    query += ` AND p.payment_status = ?`
    params.push(paymentStatus)
  }

  if (filters?.start_date && filters?.end_date) {
    query += ` AND p.date >= ? AND p.date <= ?`
    params.push(filters.start_date, filters.end_date)
  }

  query += ` ORDER BY p.date DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<Purchase>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM purchases p WHERE 1=1'
  const countParams: any[] = []

  if (supplierId) {
    countQuery += ` AND p.supplier_id = ?`
    countParams.push(supplierId)
  }
  
  if (paymentStatus) {
    countQuery += ` AND p.payment_status = ?`
    countParams.push(paymentStatus)
  }

  if (filters?.start_date && filters?.end_date) {
    countQuery += ` AND p.date >= ? AND p.date <= ?`
    countParams.push(filters.start_date, filters.end_date)
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

export function getPurchase(id: string): Purchase | null {
  const purchase = queryOne<Purchase>(
    `SELECT p.*, s.name as supplier_name
     FROM purchases p
     LEFT JOIN suppliers s ON p.supplier_id = s.id
     WHERE p.id = ?`,
    [id]
  )
  
  if (purchase) {
    purchase.items = queryAll<PurchaseItem>(
      `SELECT pi.*, i.name as inventory_item_name
       FROM purchase_items pi
       JOIN inventory_items i ON pi.inventory_item_id = i.id
       WHERE pi.purchase_id = ?`,
      [purchase.id]
    )
  }
  
  return purchase
}

export function createPurchase(data: Partial<Purchase>, userId?: string, userName?: string): Purchase {
  const id = uuid()
  const now = new Date().toISOString()
  const items = data.items ?? []
  // The line and header totals are derived here so a report reads the ledger, not a client's arithmetic.
  const lines = items.map((item) => ({
    ...item,
    quantity: item.quantity ?? 0,
    unit_cost: item.unit_cost ?? 0,
    total: item.total ?? (item.quantity ?? 0) * (item.unit_cost ?? 0)
  }))
  const total = lines.length > 0 ? lines.reduce((sum, line) => sum + line.total, 0) : data.total || 0

  runTransaction(() => {
    execute(
      `INSERT INTO purchases (
        id, supplier_id, invoice_number, date, total, payment_status, notes, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.supplier_id || null,
        data.invoice_number || null,
        data.date || now,
        total,
        data.payment_status || 'pending',
        data.notes || null,
        // purchases.user_id is a foreign key, so a placeholder would be rejected.
        userId || null,
        now
      ]
    )

    for (const item of lines) {
      const itemId = uuid()
      execute(
        `INSERT INTO purchase_items (
          id, purchase_id, inventory_item_id, quantity, unit_cost, total
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
          item.inventory_item_id,
          item.quantity,
          item.unit_cost,
          item.total
        ]
      )

      // Adjust stock
      adjustStock(
        item.inventory_item_id!, 
        item.quantity, 
        'purchase', 
        `Purchase invoice ${data.invoice_number || 'N/A'}`, 
        'purchase', 
        id, 
        userId, 
        userName
      )
    }
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'PURCHASE', id, `Created purchase`)
  
  return getPurchase(id)!
}

export function updatePurchase(id: string, data: Partial<Purchase>, userId?: string, userName?: string): Purchase | null {
  const existing = getPurchase(id)
  
  if (!existing) return null

  execute(
    `UPDATE purchases 
     SET supplier_id = COALESCE(?, supplier_id),
         invoice_number = COALESCE(?, invoice_number),
         date = COALESCE(?, date),
         total = COALESCE(?, total),
         payment_status = COALESCE(?, payment_status),
         notes = COALESCE(?, notes)
     WHERE id = ?`,
    [
      data.supplier_id ?? existing.supplier_id,
      data.invoice_number ?? existing.invoice_number,
      data.date ?? existing.date,
      data.total ?? existing.total,
      data.payment_status ?? existing.payment_status,
      data.notes ?? existing.notes,
      id
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'PURCHASE', id, `Updated purchase`)
  
  return getPurchase(id)
}

export function deletePurchase(id: string, userId?: string, userName?: string): boolean {
  const purchase = getPurchase(id)
  if (!purchase) return false

  runTransaction(() => {
    // Reverse the delivery: the same quantity leaves the shelf again as a negative purchase.
    if (purchase.items) {
      for (const item of purchase.items) {
        adjustStock(
          item.inventory_item_id,
          -item.quantity,
          'purchase',
          `Purchase ${purchase.invoice_number || purchase.id} deleted`,
          'purchase',
          id,
          userId,
          userName
        )
      }
    }
    
    execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id])
    execute('DELETE FROM purchases WHERE id = ?', [id])
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'PURCHASE', id, `Deleted purchase`)
  
  return true
}
