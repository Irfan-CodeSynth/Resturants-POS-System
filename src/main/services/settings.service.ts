import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

// updateRestaurant builds its SET clause from these names, so anything not listed here
// cannot reach the SQL string.
const RESTAURANT_FIELDS = [
  'name', 'logo', 'phone', 'address', 'currency', 'currency_code', 'timezone',
  'date_format', 'time_format', 'tax_rate', 'service_charge_rate', 'receipt_footer',
  'default_order_type'
] as const

export function listSettings() {
  return queryAll(`SELECT * FROM settings ORDER BY "group" ASC, key ASC`, [])
}

export function getSetting(key: string) {
  if (!key) return null
  const setting = queryOne<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key])
  return setting ? setting.value : null
}

export function setSetting(
  key: string,
  value: string,
  group: string = 'general',
  adminId?: string,
  adminName?: string
) {
  if (!key) throw new Error('A setting key is required')

  execute(
    `INSERT INTO settings (id, key, value, "group") VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, "group" = excluded."group", updated_at = datetime('now')`,
    [uuid(), key, value, group]
  )

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'update_setting', 'settings', key, JSON.stringify({ value }))
  }
  return { success: true }
}

export function bulkSet(
  settings: { key: string; value: string; group?: string }[],
  adminId?: string,
  adminName?: string
) {
  runTransaction(() => {
    for (const s of settings ?? []) {
      if (!s?.key) continue
      execute(
        `INSERT INTO settings (id, key, value, "group") VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, "group" = excluded."group", updated_at = datetime('now')`,
        [uuid(), s.key, s.value, s.group || 'general']
      )
    }
  })

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'bulk_update_settings', 'settings', 'bulk', JSON.stringify({ count: settings.length }))
  }
  return { success: true }
}

export function getRestaurant() {
  let restaurant = queryOne<any>(`SELECT * FROM restaurant WHERE id = '1'`, [])
  if (!restaurant) {
    execute(`INSERT INTO restaurant (id) VALUES ('1')`, [])
    restaurant = queryOne(`SELECT * FROM restaurant WHERE id = '1'`, [])
  }
  return restaurant
}

export function updateRestaurant(data: any, adminId?: string, adminName?: string) {
  const current = getRestaurant() as any
  if (!current) throw new Error('Restaurant record is missing')

  const updates: string[] = []
  const values: unknown[] = []

  for (const field of RESTAURANT_FIELDS) {
    if (data?.[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(data[field])
    }
  }

  if (updates.length === 0) return getRestaurant()

  execute(
    `UPDATE restaurant SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = '1'`,
    [...values]
  )

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'update_restaurant', 'restaurant', current.id, JSON.stringify(data))
  }

  return getRestaurant()
}
