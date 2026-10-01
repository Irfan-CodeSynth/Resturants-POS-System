import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

const STAFF_SELECT = `
  SELECT u.id, u.name, u.username, u.role_id, u.is_active, u.last_login, u.created_at, u.updated_at,
         r.name as role_name
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
`

export function listStaff() {
  return queryAll(`${STAFF_SELECT} ORDER BY u.created_at DESC, u.rowid DESC`, [])
}

export function getStaff(id: string) {
  const user = queryOne(`${STAFF_SELECT} WHERE u.id = ?`, [id]) as any
  if (!user) throw new Error('Staff member not found')

  // role_permissions stores permission ids; the UI reads keys.
  const permissions = queryAll<{ key: string }>(
    `SELECT p.key
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [user.role_id]
  ).map((row) => row.key)

  return { ...user, permissions }
}

export function createStaff(data: any, adminId?: string, adminName?: string) {
  if (!data?.username) throw new Error('A username is required')
  if (!data?.password) throw new Error('A password is required')
  if (!data?.role_id) throw new Error('A role is required')

  const role = queryOne<{ id: string }>('SELECT id FROM roles WHERE id = ?', [data.role_id])
  if (!role) throw new Error('Role not found')

  const duplicate = queryOne<{ id: string }>('SELECT id FROM users WHERE username = ?', [data.username])
  if (duplicate) throw new Error('That username is already taken')

  const id = uuid()
  execute(
    `INSERT INTO users (id, name, username, password_hash, pin_hash, role_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name || data.username,
      data.username,
      bcrypt.hashSync(data.password, BCRYPT_ROUNDS),
      data.pin ? bcrypt.hashSync(data.pin, BCRYPT_ROUNDS) : null,
      data.role_id,
      data.is_active !== undefined ? data.is_active : 1
    ]
  )

  createAuditLog(adminId || 'system', adminName || 'System', 'create_staff', 'users', id, JSON.stringify({ username: data.username, role_id: data.role_id }))

  return getStaff(id)
}

export function updateStaff(id: string, data: any, adminId?: string, adminName?: string) {
  const existing = queryOne<any>('SELECT * FROM users WHERE id = ?', [id])
  if (!existing) throw new Error('Staff member not found')

  const updates: string[] = []
  const values: any[] = []

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
  if (data.username !== undefined && data.username !== existing.username) {
    const duplicate = queryOne<{ id: string }>('SELECT id FROM users WHERE username = ? AND id != ?', [data.username, id])
    if (duplicate) throw new Error('That username is already taken')
    updates.push('username = ?')
    values.push(data.username)
  }
  if (data.role_id !== undefined) {
    const role = queryOne<{ id: string }>('SELECT id FROM roles WHERE id = ?', [data.role_id])
    if (!role) throw new Error('Role not found')
    updates.push('role_id = ?')
    values.push(data.role_id)
  }
  if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active) }
  if (data.password) {
    updates.push('password_hash = ?')
    values.push(bcrypt.hashSync(data.password, BCRYPT_ROUNDS))
  }
  if (data.pin !== undefined) {
    updates.push('pin_hash = ?')
    values.push(data.pin ? bcrypt.hashSync(data.pin, BCRYPT_ROUNDS) : null)
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')")
    values.push(id)
    execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values)
    createAuditLog(adminId || 'system', adminName || 'System', 'update_staff', 'users', id, JSON.stringify({ ...data, password: undefined, pin: undefined }))
  }

  return getStaff(id)
}

export function deleteStaff(id: string, adminId?: string, adminName?: string) {
  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [id])
  if (!user) throw new Error('Staff member not found')

  // Deactivating must never leave a role with nobody able to sign in.
  const remaining = queryOne<{ c: number }>(
    'SELECT COUNT(*) AS c FROM users WHERE role_id = ? AND is_active = 1 AND id != ?',
    [user.role_id, id]
  )
  if (!remaining?.c) throw new Error('Cannot deactivate the last active account with this role')

  execute('UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?', [id])
  createAuditLog(adminId || 'system', adminName || 'System', 'delete_staff', 'users', id, JSON.stringify({ is_active: 0 }))

  return { success: true }
}
