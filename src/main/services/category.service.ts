import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { Category } from '../../shared/types'

export function listCategories(): Category[] {
  return queryAll<Category>(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
     FROM categories c 
     WHERE c.is_active = 1 
     ORDER BY c.sort_order ASC`,
    []
  )
}

export function getCategory(id: string): Category | null {
  return queryOne<Category>('SELECT * FROM categories WHERE id = ?', [id])
}

export function createCategory(data: Partial<Category>, userId?: string, userName?: string): Category {
  const id = uuid()
  const now = new Date().toISOString()
  
  execute(
    `INSERT INTO categories (id, name, description, icon, image, sort_order, is_active, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.name,
      data.description || null,
      data.icon || null,
      data.image || null,
      data.sort_order || 0,
      now,
      now
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'CATEGORY', id, `Created category ${data.name}`)
  
  return getCategory(id)!
}

export function updateCategory(id: string, data: Partial<Category>, userId?: string, userName?: string): Category | null {
  const now = new Date().toISOString()
  const existing = getCategory(id)
  
  if (!existing) return null

  execute(
    `UPDATE categories 
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         icon = COALESCE(?, icon),
         image = COALESCE(?, image),
         sort_order = COALESCE(?, sort_order),
         is_active = COALESCE(?, is_active),
         updated_at = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.description ?? existing.description,
      data.icon ?? existing.icon,
      data.image ?? existing.image,
      data.sort_order ?? existing.sort_order,
      data.is_active === undefined ? null : (data.is_active ? 1 : 0),
      now,
      id
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'CATEGORY', id, `Updated category ${existing.name}`)
  
  return getCategory(id)
}

export function deleteCategory(id: string, userId?: string, userName?: string): boolean {
  const category = getCategory(id)
  if (!category) return false

  const productsCount = queryOne<{count: number}>('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1', [id])
  if (productsCount && productsCount.count > 0) {
    throw new Error('Cannot delete category with active products')
  }

  execute('UPDATE categories SET is_active = 0 WHERE id = ?', [id])
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'CATEGORY', id, `Deleted category ${category.name}`)
  
  return true
}

export function reorderCategories(orderedIds: string[], userId?: string, userName?: string): void {
  for (let i = 0; i < orderedIds.length; i++) {
    execute('UPDATE categories SET sort_order = ? WHERE id = ?', [i, orderedIds[i]])
  }
  
  createAuditLog(userId || 'system', userName || 'System', 'REORDER', 'CATEGORY', undefined, 'Reordered categories')
}
