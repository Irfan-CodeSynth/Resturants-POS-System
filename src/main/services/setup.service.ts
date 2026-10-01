import { queryOne, execute, runTransaction, saveDatabase } from '../database/connection'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

function toRate(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function checkSetup(): { setup_completed: number } {
  const row = queryOne<{ setup_completed: number | null }>(
    `SELECT setup_completed FROM restaurant WHERE id = '1'`
  )
  return { setup_completed: Number(row?.setup_completed ?? 0) === 1 ? 1 : 0 }
}

export function completeSetup(data: any) {
  const restaurant = data?.restaurant ?? {}
  const admin = data?.admin ?? {}
  const initialSettings = data?.settings ?? {}

  if (checkSetup().setup_completed === 1) {
    throw new Error('Setup has already been completed')
  }
  if (!admin.username) throw new Error('An admin username is required')
  if (!admin.password || admin.password.length < 6) {
    throw new Error('The admin password must be at least 6 characters')
  }

  const adminId = uuid()
  const adminRoleId = uuid()

  runTransaction(() => {
    // initializeSchema() seeds the singleton row; setup fills it in rather than replacing it.
    execute(
      `UPDATE restaurant
       SET name = ?, phone = ?, address = ?, currency = ?, tax_rate = ?,
           timezone = ?, default_order_type = ?, receipt_footer = ?,
           setup_completed = 1, updated_at = datetime('now')
       WHERE id = '1'`,
      [
        restaurant.name || 'My Restaurant',
        restaurant.phone || null,
        restaurant.address || null,
        restaurant.currency || 'Rs.',
        toRate(restaurant.taxRate),
        initialSettings.timezone || 'Asia/Karachi',
        initialSettings.orderType || 'dine_in',
        restaurant.receiptFooter || 'Thank you for dining with us!'
      ]
    )

    execute(
      `INSERT INTO roles (id, name, description, is_system) VALUES (?, 'Admin', 'System Administrator', 1)`,
      [adminRoleId]
    )

    // role_permissions holds permission ids; the permissions table is already seeded.
    execute(
      `INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
       SELECT ?, id FROM permissions`,
      [adminRoleId]
    )

    execute(
      `INSERT INTO users (id, name, username, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        adminId,
        admin.name || admin.username,
        admin.username,
        bcrypt.hashSync(admin.password, BCRYPT_ROUNDS),
        adminRoleId
      ]
    )

    execute(
      `INSERT INTO categories (id, name, description, sort_order, is_active)
       VALUES (?, 'General', 'Default category created during setup', 0, 1)`,
      [uuid()]
    )

    const existingTable = queryOne<{ c: number }>('SELECT COUNT(*) AS c FROM tables')
    if (Number(existingTable?.c ?? 0) === 0) {
      execute(
        `INSERT INTO tables (id, number, name, capacity, status, floor)
         VALUES (?, 1, 'T1', 4, 'available', 'Main')`,
        [uuid()]
      )
    }

    if (initialSettings.printerName) {
      execute(
        `INSERT INTO printer_configs (id, name, type, printer_name, paper_width, copies, auto_print, is_default)
         VALUES (?, ?, 'receipt', ?, 80, 1, 1, 1)`,
        [uuid(), initialSettings.printerName, initialSettings.printerName]
      )
    }
  })

  saveDatabase()
  return checkSetup()
}
