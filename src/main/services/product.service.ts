import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { Product, PaginatedResponse, PaginatedRequest } from '../../shared/types'
import { getByProduct } from './modifier.service'

interface ProductFilters extends PaginatedRequest {
  category_id?: string
}

// products has no stock column: a made-to-order product's availability is whatever its
// recipe can currently be assembled from, expressed in saleable units. NULL when there is no recipe.
const DERIVED_STOCK_SQL = `(
  SELECT CAST(MIN(i.current_stock / ri.quantity) AS INTEGER)
  FROM recipes r
  JOIN recipe_items ri ON ri.recipe_id = r.id
  JOIN inventory_items i ON i.id = ri.inventory_item_id
  WHERE r.product_id = p.id AND ri.quantity > 0 AND i.is_active = 1
) AS current_stock`

const PRODUCT_SELECT = `p.*, c.name as category_name, ${DERIVED_STOCK_SQL}`

export function listProducts(filters?: ProductFilters): PaginatedResponse<Product> {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  const search = filters?.search ? `%${filters.search}%` : null
  const categoryId = filters?.category_id

  let query = `
    SELECT ${PRODUCT_SELECT}
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `
  const params: any[] = []

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`
    params.push(search, search, search)
  }

  if (categoryId) {
    query += ` AND p.category_id = ?`
    params.push(categoryId)
  }

  query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const data = queryAll<Product>(query, params)

  let countQuery = 'SELECT COUNT(*) as count FROM products p WHERE p.is_active = 1'
  const countParams: any[] = []
  
  if (search) {
    countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`
    countParams.push(search, search, search)
  }

  if (categoryId) {
    countQuery += ` AND p.category_id = ?`
    countParams.push(categoryId)
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

export function getProduct(id: string): Product | null {
  const product = queryOne<Product>(
    `SELECT ${PRODUCT_SELECT}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.is_active = 1`,
    [id]
  )
  
  if (product) {
    product.modifier_groups = getByProduct(id)
  }
  
  return product
}

export function getProductByBarcode(barcode: string): Product | null {
  const product = queryOne<Product>(
    `SELECT ${PRODUCT_SELECT}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.barcode = ? AND p.is_active = 1`,
    [barcode]
  )
  
  if (product) {
    product.modifier_groups = getByProduct(product.id)
  }
  
  return product
}

export function createProduct(data: Partial<Product>, userId?: string, userName?: string): Product {
  const id = uuid()
  const now = new Date().toISOString()
  
  execute(
    `INSERT INTO products (
      id, name, sku, barcode, category_id, description, image, 
      selling_price, cost_price, tax_rate, is_active, track_stock, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [
      id,
      data.name,
      data.sku || null,
      data.barcode || null,
      data.category_id || null,
      data.description || null,
      data.image || null,
      data.selling_price || 0,
      data.cost_price || 0,
      data.tax_rate || 0,
      data.track_stock ? 1 : 0,
      now,
      now
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'PRODUCT', id, `Created product ${data.name}`)
  
  return getProduct(id)!
}

export function updateProduct(id: string, data: Partial<Product>, userId?: string, userName?: string): Product | null {
  const now = new Date().toISOString()
  const existing = getProduct(id)
  
  if (!existing) return null

  execute(
    `UPDATE products 
     SET name = COALESCE(?, name),
         sku = COALESCE(?, sku),
         barcode = COALESCE(?, barcode),
         category_id = COALESCE(?, category_id),
         description = COALESCE(?, description),
         image = COALESCE(?, image),
         selling_price = COALESCE(?, selling_price),
         cost_price = COALESCE(?, cost_price),
         tax_rate = COALESCE(?, tax_rate),
         track_stock = COALESCE(?, track_stock),
         updated_at = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.sku ?? existing.sku,
      data.barcode ?? existing.barcode,
      data.category_id ?? existing.category_id,
      data.description ?? existing.description,
      data.image ?? existing.image,
      data.selling_price ?? existing.selling_price,
      data.cost_price ?? existing.cost_price,
      data.tax_rate ?? existing.tax_rate,
      data.track_stock !== undefined ? (data.track_stock ? 1 : 0) : existing.track_stock,
      now,
      id
    ]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'PRODUCT', id, `Updated product ${existing.name}`)
  
  return getProduct(id)
}

export function deleteProduct(id: string, userId?: string, userName?: string): boolean {
  const product = getProduct(id)
  if (!product) return false

  execute('UPDATE products SET is_active = 0 WHERE id = ?', [id])
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'PRODUCT', id, `Deleted product ${product.name}`)
  
  return true
}

export function searchProducts(query: string): Product[] {
  const search = `%${query}%`
  return queryAll<Product>(
    `SELECT ${PRODUCT_SELECT}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = 1 AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
     ORDER BY p.name ASC LIMIT 20`,
    [search, search, search]
  )
}

export function getPOSProducts(categoryId?: string): Record<string, Product[]> {
  let query = `
    SELECT ${PRODUCT_SELECT}
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND c.is_active = 1
  `
  const params: any[] = []

  if (categoryId) {
    query += ` AND p.category_id = ?`
    params.push(categoryId)
  }

  query += ` ORDER BY c.sort_order ASC, p.name ASC`
  
  const products = queryAll<Product>(query, params)
  const grouped: Record<string, Product[]> = {}

  for (const product of products) {
    product.modifier_groups = getByProduct(product.id)
    
    const catId = product.category_id || 'uncategorized'
    if (!grouped[catId]) {
      grouped[catId] = []
    }
    grouped[catId].push(product)
  }

  return grouped
}
