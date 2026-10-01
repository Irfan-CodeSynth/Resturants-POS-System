import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as kitchenService from '../services/kitchen.service'

export function registerKitchenIPC(): void {
  ipcMain.handle(IPC.KITCHEN_GET_ORDERS, async () => {
    try {
      const data = kitchenService.getKitchenOrders()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.KITCHEN_UPDATE_ITEM_STATUS, async (_event, itemId, status) => {
    try {
      const data = kitchenService.updateItemStatus(itemId, status)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.KITCHEN_UPDATE_ORDER_STATUS, async (_event, orderId, status) => {
    try {
      const data = kitchenService.updateOrderKitchenStatus(orderId, status)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.KITCHEN_COMPLETE_ORDER, async (_event, orderId) => {
    try {
      const data = kitchenService.completeOrder(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
