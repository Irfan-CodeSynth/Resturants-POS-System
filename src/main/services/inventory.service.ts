import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { InventoryItem, InventoryMovement, PaginatedResponse, PaginatedRequest, InventoryMovementType } from '../../shared/types'
import { getProduct } from './product.service'
import { getByProduct } from './recipe.service'

interface InventoryFilters extends PaginatedRequest {
  supplier_id?: string
}

export function listItems(filters?: InventoryFilters): PaginatedResponse<InventoryItem> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  const search = filters?.search ? `%${filters.search}%` : null
  const supplierId = filters?.supplier_id

  let query = `
    SELECT i.*, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.is_active = 1
  `
  const params: any[] = []

  if (search) {
    query += ` AND (i.name LIKE ? OR i.sku LIKE ?)`
    params.push(search, search)
  }

  if (supplierId) {
    query += ` AND i.supplier_id = ?`
    params.push(supplierId)
  }

  query += ` ORDER BY i.name ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<InventoryItem>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM inventory_items i WHERE i.is_active = 1'
  const countParams: any[] = []
  
  if (search) {
    countQuery += ` AND (i.name LIKE ? OR i.sku LIKE ?)`
    countParams.push(search, search)
  }

  if (supplierId) {
    countQuery += ` AND i.supplier_id = ?`
    countParams.push(supplierId)
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

export function getItem(id: string): InventoryItem | null {
  return queryOne<InventoryItem>(
    `SELECT i.*, s.name as supplier_name
     FROM inventory_items i
     LEFT JOIN suppliers s ON i.supplier_id = s.id
     WHERE i.id = ? AND i.is_active = 1`,
    [id]
  )
}

export function createItem(data: Partial<InventoryItem>, userId?: string, userName?: string): InventoryItem {
  const id = uuid()
  const now = new Date().toISOString()
  
  execute(
    `INSERT INTO inventory_items (
      id, name, sku, unit, current_stock, minimum_stock, cost_per_unit, supplier_id, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.name,
      data.sku || null,
      data.unit || 'PCS',
      data.current_stock || 0,
      data.minimum_stock || 0,
      data.cost_per_unit || 0,
      data.supplier_id || null,
      now,
      now
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'INVENTORY_ITEM', id, `Created inventory item ${data.name}`)
  
  return getItem(id)!
}

export function updateItem(id: string, data: Partial<InventoryItem>, userId?: string, userName?: string): InventoryItem | null {
  const now = new Date().toISOString()
  const existing = getItem(id)
  
  if (!existing) return null

  execute(
    `UPDATE inventory_items 
     SET name = COALESCE(?, name),
         sku = COALESCE(?, sku),
         unit = COALESCE(?, unit),
         minimum_stock = COALESCE(?, minimum_stock),
         cost_per_unit = COALESCE(?, cost_per_unit),
         supplier_id = COALESCE(?, supplier_id),
         updated_at = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.sku ?? existing.sku,
      data.unit ?? existing.unit,
      data.minimum_stock ?? existing.minimum_stock,
      data.cost_per_unit ?? existing.cost_per_unit,
      data.supplier_id !== undefined ? data.supplier_id : existing.supplier_id,
      now,
      id
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'INVENTORY_ITEM', id, `Updated inventory item ${existing.name}`)
  
  return getItem(id)
}

export function deleteItem(id: string, userId?: string, userName?: string): boolean {
  const item = getItem(id)
  if (!item) return false

  execute('UPDATE inventory_items SET is_active = 0 WHERE id = ?', [id])
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'INVENTORY_ITEM', id, `Deleted inventory item ${item.name}`)
  
  return true
}

export function adjustStock(itemId: string, quantity: number, type: InventoryMovementType, reason?: string, referenceType?: string, referenceId?: string, userId?: string, userName?: string): void {
  const item = getItem(itemId)
  if (!item) throw new Error('Item not found')

  const now = new Date().toISOString()

  runTransaction(() => {
    let diff = quantity
    
    if (type === 'adjustment') {
        diff = quantity - item.current_stock
    } else if (type === 'sale' || type === 'waste' || type === 'return') {
        diff = -quantity
    }
    
    const newStock = item.current_stock + diff

    execute('UPDATE inventory_items SET current_stock = ?, updated_at = ? WHERE id = ?', [newStock, now, itemId])

    execute(
      `INSERT INTO inventory_movements (
        id, item_id, type, quantity, unit_cost, reference_type, reference_id, reason, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        itemId,
        type,
        diff,
        item.cost_per_unit,
        referenceType || null,
        referenceId || null,
        reason || null,
        // user_id is a foreign key on inventory_movements, so a placeholder like 'system' is rejected.
        userId || null,
        now
      ]
    )
    createAuditLog(
      userId || 'system',
      userName || 'System',
      'stock_movement',
      'inventory_item',
      itemId,
      `${type} ${diff} ${item.unit} of ${item.name}`
    )
  })
}

export function getLowStock(): InventoryItem[] {
  return queryAll<InventoryItem>(
    `SELECT i.*, s.name as supplier_name
     FROM inventory_items i
     LEFT JOIN suppliers s ON i.supplier_id = s.id
     WHERE i.is_active = 1 AND i.current_stock <= i.minimum_stock
     ORDER BY i.name ASC`,
    []
  )
}

interface MovementFilters extends PaginatedRequest {
  type?: string
  start_date?: string
  end_date?: string
}

export function getMovements(itemId?: string, filters?: MovementFilters): PaginatedResponse<InventoryMovement> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit

  let query = `
    SELECT m.*, i.name as item_name
    FROM inventory_movements m
    LEFT JOIN inventory_items i ON m.item_id = i.id
    WHERE 1=1
  `
  const params: any[] = []

  if (itemId) {
    query += ` AND m.item_id = ?`
    params.push(itemId)
  }

  if (filters?.type) {
    query += ` AND m.type = ?`
    params.push(filters.type)
  }

  if (filters?.start_date && filters?.end_date) {
    query += ` AND m.created_at >= ? AND m.created_at <= ?`
    params.push(filters.start_date, filters.end_date)
  }

  // created_at only has second resolution, so rowid breaks ties within the same second.
  query += ` ORDER BY m.created_at DESC, m.rowid DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<InventoryMovement>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM inventory_movements m WHERE 1=1'
  const countParams: any[] = []

  if (itemId) {
    countQuery += ` AND m.item_id = ?`
    countParams.push(itemId)
  }

  if (filters?.type) {
    countQuery += ` AND m.type = ?`
    countParams.push(filters.type)
  }

  if (filters?.start_date && filters?.end_date) {
    countQuery += ` AND m.created_at >= ? AND m.created_at <= ?`
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

export function deductByRecipe(productId: string, orderQuantity: number, orderId: string, userId?: string, userName?: string): void {
  const product = getProduct(productId)
  if (!product) return

  // Stock only exists on inventory_items, so a product without a recipe has nothing to
  // deduct - its availability is untracked rather than unlimited.
  const recipe = getByProduct(productId)
  if (!recipe || recipe.items.length === 0) return

  for (const item of recipe.items) {
    adjustStock(
      item.inventory_item_id,
      item.quantity * orderQuantity,
      'sale',
      `Sold via ${product.name}`,
      'order',
      orderId,
      userId,
      userName
    )
  }
}
