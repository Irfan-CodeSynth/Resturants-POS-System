import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as authService from '../services/auth.service'

export function registerAuthIPC(): void {
  ipcMain.handle(IPC.AUTH_LOGIN, async (_event, username, password) => {
    try {
      const data = authService.login(username, password)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.AUTH_LOGIN_PIN, async (_event, pin) => {
    try {
      const data = authService.loginPin(pin)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.AUTH_VERIFY_MANAGER, async (_event, username, password) => {
    try {
      const data = authService.verifyManager(username, password)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.AUTH_CHANGE_PASSWORD, async (_event, userId, oldPassword, newPassword) => {
    try {
      const data = authService.changePassword(userId, oldPassword, newPassword)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.AUTH_LOGOUT, async () => {
    return { success: true }
  })
}
