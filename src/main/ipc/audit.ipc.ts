import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/audit.service'

export function registerAuditIPC(): void {
  ipcMain.handle(IPC.AUDIT_LIST, async (_event, filters: any) => {
    try {
      const result = service.listLogs(filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.AUDIT_EXPORT, async (_event, filters: any) => {
    try {
      const result = service.exportLogs(filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
