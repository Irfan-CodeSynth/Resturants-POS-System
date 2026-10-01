import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/cash.service'

export function registerCashIPC(): void {
  ipcMain.handle(IPC.CASH_OPEN, async (_event, userId: string, openingAmount: number, userName: string) => {
    try {
      const result = service.openRegister(userId, openingAmount, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_CLOSE, async (_event, registerId: string, actualAmount: number, notes: string, userId: string, userName: string) => {
    try {
      const result = service.closeRegister(registerId, actualAmount, notes, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_ACTIVE, async (_event, userId?: string) => {
    try {
      const result = service.getActiveRegister(userId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_IN, async (_event, registerId: string, amount: number, reason: string, userId: string) => {
    try {
      const result = service.cashIn(registerId, amount, reason, userId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_OUT, async (_event, registerId: string, amount: number, reason: string, userId: string) => {
    try {
      const result = service.cashOut(registerId, amount, reason, userId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_HISTORY, async (_event, filters: any) => {
    try {
      const result = service.getHistory(filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CASH_MOVEMENTS, async (_event, registerId: string) => {
    try {
      const result = service.getMovements(registerId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
