import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/backup.service'

export function registerBackupIPC(): void {
  ipcMain.handle(IPC.BACKUP_SETTINGS_GET, async () => {
    try {
      const result = service.getBackupSettings()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_SETTINGS_UPDATE, async (_event, settings: any) => {
    try {
      const result = service.updateBackupSettings(settings)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_CREATE, async (_event, userId?: string, userName?: string, type?: string) => {
    try {
      const result = await service.createBackup(userId, userName, type)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_RESTORE, async (_event, backupId: string, userId?: string, userName?: string) => {
    try {
      const result = await service.restoreBackup(backupId, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_LIST, async () => {
    try {
      const result = service.listBackups()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_DELETE, async (_event, backupId: string, userId?: string, userName?: string) => {
    try {
      const result = service.deleteBackup(backupId, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_SELECT_FOLDER, async () => {
    try {
      const result = await service.selectFolder()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.DATA_EXPORT, async (_event, type: string, filters: any) => {
    try {
      const result = service.exportData(type, filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
