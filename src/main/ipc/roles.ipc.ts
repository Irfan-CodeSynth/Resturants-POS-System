import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/role.service'

export function registerRolesIPC(): void {
  ipcMain.handle(IPC.ROLES_LIST, async () => {
    try {
      const result = service.listRoles()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ROLES_GET, async (_event, id: string) => {
    try {
      const result = service.getRole(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ROLES_CREATE, async (_event, name: string, description: string, permissions: string[], adminId?: string, adminName?: string) => {
    try {
      const result = service.createRole(name, description, permissions, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ROLES_UPDATE, async (_event, id: string, name: string, description: string, permissions: string[], adminId?: string, adminName?: string) => {
    try {
      const result = service.updateRole(id, name, description, permissions, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ROLES_DELETE, async (_event, id: string, adminId?: string, adminName?: string) => {
    try {
      const result = service.deleteRole(id, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PERMISSIONS_LIST, async () => {
    try {
      const result = service.listPermissions()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
