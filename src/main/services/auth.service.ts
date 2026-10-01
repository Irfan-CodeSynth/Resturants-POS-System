import { queryAll, queryOne, execute, createAuditLog } from '../database/connection'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

const USER_WITH_ROLE = `
  SELECT u.*, r.name AS role_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
`

// Never disclose whether a username exists.
const INVALID_CREDENTIALS = 'Invalid credentials'

function assertActive(user: { is_active: number }): void {
  if (!Number(user.is_active)) throw new Error('User is inactive')
}

function toSafeUser<T extends Record<string, any>>(user: T): T {
  const { password_hash, pin_hash, ...safe } = user
  return safe as T
}

export function getPermissionsByRole(roleId: string): string[] {
  return queryAll<{ key: string }>(
    `SELECT p.key
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [roleId]
  ).map((row) => row.key)
}

function withPermissions<T extends Record<string, any>>(user: T): T {
  return { ...toSafeUser(user), permissions: getPermissionsByRole(user.role_id) }
}

export function login(username: string, password: string) {
  if (!username || !password) throw new Error(INVALID_CREDENTIALS)

  const user = queryOne<any>(`${USER_WITH_ROLE} WHERE u.username = ?`, [username])
  if (!user) throw new Error(INVALID_CREDENTIALS)
  assertActive(user)
  if (!bcrypt.compareSync(password, user.password_hash)) throw new Error(INVALID_CREDENTIALS)

  execute(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id])
  createAuditLog(user.id, user.username, 'user_login', 'user', user.id, 'User logged in')
  return withPermissions(user)
}

export function loginPin(pin: string) {
  if (!pin) throw new Error(INVALID_CREDENTIALS)

  // PINs are stored hashed, so they cannot be looked up by equality.
  const candidates = queryAll<any>(
    `${USER_WITH_ROLE} WHERE u.pin_hash IS NOT NULL AND u.is_active = 1`
  )
  const user = candidates.find((candidate) => bcrypt.compareSync(pin, candidate.pin_hash))
  if (!user) throw new Error(INVALID_CREDENTIALS)

  execute(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id])
  createAuditLog(user.id, user.username, 'user_login_pin', 'user', user.id, 'User logged in with PIN')
  return withPermissions(user)
}

export function verifyManager(username: string, password: string): true {
  if (!username || !password) throw new Error(INVALID_CREDENTIALS)

  const user = queryOne<any>(`${USER_WITH_ROLE} WHERE u.username = ?`, [username])
  if (!user) throw new Error(INVALID_CREDENTIALS)
  assertActive(user)
  if (!bcrypt.compareSync(password, user.password_hash)) throw new Error(INVALID_CREDENTIALS)

  const role = String(user.role_name || '').toLowerCase()
  if (role !== 'admin' && role !== 'manager') {
    throw new Error('A manager or admin approval is required')
  }

  createAuditLog(user.id, user.username, 'manager_override', 'user', user.id, 'Approved a protected action')
  return true
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): true {
  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId])
  if (!user) throw new Error('User not found')
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters')
  if (!bcrypt.compareSync(oldPassword || '', user.password_hash)) {
    throw new Error('Incorrect current password')
  }

  execute(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`, [
    bcrypt.hashSync(newPassword, BCRYPT_ROUNDS),
    userId
  ])
  createAuditLog(userId, user.username, 'password_change', 'user', userId, 'User changed password')
  return true
}
