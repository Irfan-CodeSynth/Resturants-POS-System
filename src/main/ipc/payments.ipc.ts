import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as paymentService from '../services/payment.service'

export function registerPaymentsIPC(): void {
  ipcMain.handle(IPC.PAYMENT_PROCESS, async (_event, data, userId) => {
    try {
      const result = paymentService.processPayment(data, userId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PAYMENT_REFUND, async (_event, orderId, amount, reason, userId, approvedBy) => {
    try {
      const result = paymentService.refund(orderId, amount, reason, userId, approvedBy)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PAYMENT_GET_BY_ORDER, async (_event, orderId) => {
    try {
      const data = paymentService.getPaymentsByOrder(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
