import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as setupService from '../services/setup.service'

export function registerSetupIPC(): void {
  ipcMain.handle(IPC.SETUP_CHECK, async () => {
    try {
      const data = setupService.checkSetup()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SETUP_COMPLETE, async (_event, data) => {
    try {
      const result = setupService.completeSetup(data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
