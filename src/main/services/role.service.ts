import { queryAll, queryOne, execute, runTransaction, createAuditLog } from '../database/connection'
import { v4 as uuid } from 'uuid'

export function listRoles() {
  return queryAll(
    `SELECT r.*, COUNT(rp.permission_id) AS permission_count
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     GROUP BY r.id
     ORDER BY r.name`,
    []
  )
}

function getPermissionKeys(roleId: string): string[] {
  return queryAll<{ key: string }>(
    `SELECT p.key
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [roleId]
  ).map((row) => row.key)
}

export function getRole(id: string) {
  const role = queryOne<any>('SELECT * FROM roles WHERE id = ?', [id])
  if (!role) throw new Error('Role not found')
  return { ...role, permissions: getPermissionKeys(id) }
}

// The UI speaks permission keys; role_permissions stores permission ids.
function insertPermissions(roleId: string, permissionKeys: string[]): void {
  for (const key of permissionKeys ?? []) {
    const permission = queryOne<{ id: string }>('SELECT id FROM permissions WHERE key = ?', [key])
    if (!permission) throw new Error(`Unknown permission: ${key}`)
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
      roleId,
      permission.id
    ])
  }
}

export function createRole(name: string, description: string, permissionKeys: string[], adminId?: string, adminName?: string) {
  if (!name) throw new Error('Role name is required')
  const id = uuid()

  runTransaction(() => {
    execute('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [id, name, description || null])
    insertPermissions(id, permissionKeys)
  })

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'create_role', 'roles', id, JSON.stringify({ name, description, permissionKeys }))
  }
  return getRole(id)
}

export function updateRole(id: string, name: string, description: string, permissionKeys: string[], adminId?: string, adminName?: string) {
  const role = queryOne<any>('SELECT * FROM roles WHERE id = ?', [id])
  if (!role) throw new Error('Role not found')
  if (role.is_system && name && name !== role.name) {
    throw new Error('Cannot rename a system role')
  }

  runTransaction(() => {
    execute('UPDATE roles SET name = ?, description = ? WHERE id = ?', [
      name || role.name,
      description ?? role.description,
      id
    ])
    execute('DELETE FROM role_permissions WHERE role_id = ?', [id])
    insertPermissions(id, permissionKeys)
  })

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'update_role', 'roles', id, JSON.stringify({ name, description, permissionKeys }))
  }
  return getRole(id)
}

export function deleteRole(id: string, adminId?: string, adminName?: string) {
  const role = queryOne<any>('SELECT * FROM roles WHERE id = ?', [id])
  if (!role) throw new Error('Role not found')
  if (role.is_system) throw new Error('Cannot delete a system role')

  const userCount = Number(
    (queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM users WHERE role_id = ?', [id]))?.count ?? 0
  )
  if (userCount > 0) throw new Error('Cannot delete a role that still has users assigned')

  execute('DELETE FROM roles WHERE id = ?', [id])

  if (adminId && adminName) {
    createAuditLog(adminId, adminName, 'delete_role', 'roles', id, JSON.stringify({ name: role.name }))
  }
  return { success: true }
}

export function listPermissions() {
  return queryAll(`SELECT id, key, name, "group", description FROM permissions ORDER BY "group" ASC, name ASC`, [])
}
