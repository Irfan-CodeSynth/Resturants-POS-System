import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/print.service'

export function registerPrintIPC(): void {
  ipcMain.handle(IPC.PRINT_PRINTERS, async () => {
    try {
      const result = await service.getSystemPrinters()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_CONFIGS, async () => {
    try {
      const result = service.getConfigs()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_SAVE_CONFIG, async (_event, data: any) => {
    try {
      const result = service.saveConfig(data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_DELETE_CONFIG, async (_event, id: string) => {
    try {
      const result = service.deleteConfig(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_RECEIPT, async (_event, orderId: string) => {
    try {
      const result = await service.printReceipt(orderId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_KITCHEN, async (_event, orderId: string, newItemsOnly?: boolean) => {
    try {
      const result = await service.printKitchenTicket(orderId, newItemsOnly)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRINT_TEST, async (_event, configId: string) => {
    try {
      const result = await service.testPrint(configId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
