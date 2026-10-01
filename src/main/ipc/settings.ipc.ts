import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/settings.service'

export function registerSettingsIPC(): void {
  ipcMain.handle(IPC.SETTINGS_LIST, async () => {
    try {
      const result = service.listSettings()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETTINGS_GET, async (_event, key: string) => {
    try {
      const result = service.getSetting(key)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETTINGS_SET, async (_event, key: string, value: string, group?: string, adminId?: string, adminName?: string) => {
    try {
      const result = service.setSetting(key, value, group, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETTINGS_BULK, async (_event, settings: any[], adminId?: string, adminName?: string) => {
    try {
      const result = service.bulkSet(settings, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETTINGS_RESTAURANT_GET, async () => {
    try {
      const result = service.getRestaurant()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETTINGS_RESTAURANT_UPDATE, async (_event, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.updateRestaurant(data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
