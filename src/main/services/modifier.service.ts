import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { ModifierGroup, Modifier } from '../../shared/types'

export function listGroups(): ModifierGroup[] {
  const groups = queryAll<ModifierGroup>('SELECT * FROM modifier_groups ORDER BY sort_order ASC', [])
  
  for (const group of groups) {
    group.modifiers = queryAll<Modifier>(
      'SELECT * FROM modifiers WHERE group_id = ? ORDER BY sort_order ASC',
      [group.id]
    )
  }
  
  return groups
}

export function getGroup(id: string): ModifierGroup | null {
  const group = queryOne<ModifierGroup>('SELECT * FROM modifier_groups WHERE id = ?', [id])
  if (!group) return null

  group.modifiers = queryAll<Modifier>(
    'SELECT * FROM modifiers WHERE group_id = ? ORDER BY sort_order ASC',
    [group.id]
  )
  
  return group
}

export function createGroup(data: Partial<ModifierGroup>, userId?: string, userName?: string): ModifierGroup {
  const id = uuid()
  const now = new Date().toISOString()
  
  runTransaction(() => {
    execute(
      `INSERT INTO modifier_groups (id, name, is_required, min_selections, max_selections, sort_order, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.is_required ? 1 : 0,
        data.min_selections || 0,
        data.max_selections || 1,
        data.sort_order || 0,
        now
      ]
    )

    if (data.modifiers && data.modifiers.length > 0) {
      for (const mod of data.modifiers) {
        execute(
          `INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_order, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuid(),
            id,
            mod.name,
            mod.price_adjustment || 0,
            mod.is_default ? 1 : 0,
            mod.sort_order || 0,
            now
          ]
        )
      }
    }
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'CREATE', 'MODIFIER_GROUP', id, `Created modifier group ${data.name}`)
  
  return getGroup(id)!
}

export function updateGroup(id: string, data: Partial<ModifierGroup>, userId?: string, userName?: string): ModifierGroup | null {
  const existing = getGroup(id)
  if (!existing) return null

  const now = new Date().toISOString()
  
  runTransaction(() => {
    execute(
      `UPDATE modifier_groups 
       SET name = COALESCE(?, name),
           is_required = COALESCE(?, is_required),
           min_selections = COALESCE(?, min_selections),
           max_selections = COALESCE(?, max_selections),
           sort_order = COALESCE(?, sort_order)
       WHERE id = ?`,
      [
        data.name ?? existing.name,
        data.is_required !== undefined ? (data.is_required ? 1 : 0) : existing.is_required,
        data.min_selections ?? existing.min_selections,
        data.max_selections ?? existing.max_selections,
        data.sort_order ?? existing.sort_order,
        id
      ]
    )

    if (data.modifiers) {
      execute('DELETE FROM modifiers WHERE group_id = ?', [id])
      for (const mod of data.modifiers) {
        execute(
          `INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_order, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuid(),
            id,
            mod.name,
            mod.price_adjustment || 0,
            mod.is_default ? 1 : 0,
            mod.sort_order || 0,
            now
          ]
        )
      }
    }
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'MODIFIER_GROUP', id, `Updated modifier group ${existing.name}`)
  
  return getGroup(id)
}

export function deleteGroup(id: string, userId?: string, userName?: string): boolean {
  const group = getGroup(id)
  if (!group) return false

  runTransaction(() => {
    execute('DELETE FROM product_modifier_groups WHERE modifier_group_id = ?', [id])
    execute('DELETE FROM modifiers WHERE group_id = ?', [id])
    execute('DELETE FROM modifier_groups WHERE id = ?', [id])
  })
  
  createAuditLog(userId || 'system', userName || 'System', 'DELETE', 'MODIFIER_GROUP', id, `Deleted modifier group ${group.name}`)
  
  return true
}

export function getByProduct(productId: string): ModifierGroup[] {
  // The link table is only (product_id, modifier_group_id); ordering lives on the group itself.
  const groupIds = queryAll<{ modifier_group_id: string }>(
    `SELECT mg.id AS modifier_group_id
     FROM product_modifier_groups pmg
     JOIN modifier_groups mg ON mg.id = pmg.modifier_group_id
     WHERE pmg.product_id = ?
     ORDER BY mg.sort_order ASC, mg.name ASC`,
    [productId]
  )

  const groups: ModifierGroup[] = []
  for (const { modifier_group_id } of groupIds) {
    const group = getGroup(modifier_group_id)
    if (group) groups.push(group)
  }
  return groups
}

export function linkProduct(productId: string, groupId: string, userId?: string, userName?: string): void {
  const exists = queryOne('SELECT 1 FROM product_modifier_groups WHERE product_id = ? AND modifier_group_id = ?', [productId, groupId])

  if (!exists) {
    execute(
      'INSERT INTO product_modifier_groups (product_id, modifier_group_id) VALUES (?, ?)',
      [productId, groupId]
    )

    createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'PRODUCT', productId, `Linked modifier group ${groupId} to product`)
  }
}

export function unlinkProduct(productId: string, groupId: string, userId?: string, userName?: string): void {
  execute(
    'DELETE FROM product_modifier_groups WHERE product_id = ? AND modifier_group_id = ?',
    [productId, groupId]
  )
  
  createAuditLog(userId || 'system', userName || 'System', 'UPDATE', 'PRODUCT', productId, `Unlinked modifier group ${groupId} from product`)
}
