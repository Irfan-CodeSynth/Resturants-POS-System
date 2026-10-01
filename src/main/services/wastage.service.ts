import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { Wastage, PaginatedResponse, PaginatedRequest } from '../../shared/types'
import { adjustStock } from './inventory.service'

interface WastageFilters extends PaginatedRequest {
  start_date?: string
  end_date?: string
}

export function listWastage(filters?: WastageFilters): PaginatedResponse<Wastage> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  const search = filters?.search ? `%${filters.search}%` : null

  let query = `
    SELECT w.*, i.name as inventory_item_name, i.unit as unit
    FROM wastage w
    LEFT JOIN inventory_items i ON w.inventory_item_id = i.id
    WHERE 1=1
  `
  const params: any[] = []

  if (search) {
    query += ` AND i.name LIKE ?`
    params.push(search)
  }

  if (filters?.start_date && filters?.end_date) {
    query += ` AND w.created_at >= ? AND w.created_at <= ?`
    params.push(filters.start_date, filters.end_date)
  }

  query += ` ORDER BY w.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<Wastage>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM wastage w LEFT JOIN inventory_items i ON w.inventory_item_id = i.id WHERE 1=1'
  const countParams: any[] = []

  if (search) {
    countQuery += ` AND i.name LIKE ?`
    countParams.push(search)
  }

  if (filters?.start_date && filters?.end_date) {
    countQuery += ` AND w.created_at >= ? AND w.created_at <= ?`
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

export function createWastage(data: Partial<Wastage>, userId?: string, userName?: string): Wastage {
  const id = uuid()
  const now = new Date().toISOString()
  
  runTransaction(() => {
    execute(
      `INSERT INTO wastage (
        id, inventory_item_id, quantity, reason, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.inventory_item_id,
        data.quantity,
        data.reason,
        // wastage.user_id is a foreign key, so a placeholder would be rejected.
        userId || null,
        now
      ]
    )

    // Adjust stock
    adjustStock(
      data.inventory_item_id!, 
      data.quantity!, 
      'waste', 
      `Wastage: ${data.reason}`, 
      'wastage', 
      id, 
      userId, 
      userName
    )
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'WASTAGE', id, `Recorded wastage`)
  
  const wastage = queryOne<Wastage>(
    `SELECT w.*, i.name as inventory_item_name, i.unit as unit
     FROM wastage w
     LEFT JOIN inventory_items i ON w.inventory_item_id = i.id
     WHERE w.id = ?`,
    [id]
  )
  
  return wastage!
}
