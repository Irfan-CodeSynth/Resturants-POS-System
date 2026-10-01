import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { Recipe, RecipeItem } from '../../shared/types'

export function getByProduct(productId: string): Recipe | null {
  const recipe = queryOne<Recipe>('SELECT * FROM recipes WHERE product_id = ?', [productId])
  if (!recipe) return null

  recipe.items = queryAll<RecipeItem>(
    `SELECT ri.*, i.name as inventory_item_name, i.current_stock as available_stock
     FROM recipe_items ri
     JOIN inventory_items i ON ri.inventory_item_id = i.id
     WHERE ri.recipe_id = ?`,
    [recipe.id]
  )
  
  return recipe
}

export function save(productId: string, items: Partial<RecipeItem>[], notes?: string, userId?: string, userName?: string): Recipe {
  let recipe = queryOne<Recipe>('SELECT * FROM recipes WHERE product_id = ?', [productId])
  const now = new Date().toISOString()
  
  runTransaction(() => {
    if (!recipe) {
      recipe = { id: uuid(), product_id: productId, notes, created_at: now, updated_at: now } as Recipe
      execute(
        'INSERT INTO recipes (id, product_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [recipe.id, productId, notes || null, now, now]
      )
    } else {
      execute(
        'UPDATE recipes SET notes = ?, updated_at = ? WHERE id = ?',
        [notes || null, now, recipe.id]
      )
      execute('DELETE FROM recipe_items WHERE recipe_id = ?', [recipe.id])
    }

    for (const item of items) {
      // recipe_items.unit is NOT NULL, so an omitted unit is filled from the stock item.
      const unit =
        item.unit ||
        queryOne<{ unit: string }>('SELECT unit FROM inventory_items WHERE id = ?', [item.inventory_item_id])?.unit ||
        'PCS'
      execute(
        'INSERT INTO recipe_items (id, recipe_id, inventory_item_id, quantity, unit) VALUES (?, ?, ?, ?, ?)',
        [uuid(), recipe.id, item.inventory_item_id, item.quantity, unit]
      )
    }
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'RECIPE', productId, 'Updated product recipe')
  
  return getByProduct(productId)!
}

export function deleteRecipe(productId: string, userId?: string, userName?: string): boolean {
  const recipe = getByProduct(productId)
  if (!recipe) return false

  runTransaction(() => {
    execute('DELETE FROM recipe_items WHERE recipe_id = ?', [recipe.id])
    execute('DELETE FROM recipes WHERE id = ?', [recipe.id])
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'RECIPE', productId, 'Deleted product recipe')
  
  return true
}
