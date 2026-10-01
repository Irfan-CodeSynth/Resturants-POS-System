import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/staff.service'

export function registerStaffIPC(): void {
  ipcMain.handle(IPC.STAFF_LIST, async () => {
    try {
      const result = service.listStaff()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.STAFF_GET, async (_event, id: string) => {
    try {
      const result = service.getStaff(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.STAFF_CREATE, async (_event, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.createStaff(data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.STAFF_UPDATE, async (_event, id: string, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.updateStaff(id, data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.STAFF_DELETE, async (_event, id: string, adminId?: string, adminName?: string) => {
    try {
      const result = service.deleteStaff(id, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
