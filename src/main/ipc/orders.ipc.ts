import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as orderService from '../services/order.service'

export function registerOrdersIPC(): void {
  ipcMain.handle(IPC.ORDERS_CREATE, async (_event, data) => {
    try {
      const result = orderService.createOrder(data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_GET, async (_event, id) => {
    try {
      const data = orderService.getOrder(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_LIST, async (_event, filters) => {
    try {
      const data = orderService.listOrders(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_UPDATE, async (_event, id, data) => {
    try {
      const result = orderService.updateOrder(id, data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_UPDATE_STATUS, async (_event, id, status, userId) => {
    try {
      const data = orderService.updateOrderStatus(id, status, userId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_ADD_ITEM, async (_event, orderId, item) => {
    try {
      const data = orderService.addItem(orderId, item)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_UPDATE_ITEM, async (_event, itemId, data) => {
    try {
      const result = orderService.updateItem(itemId, data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_REMOVE_ITEM, async (_event, itemId) => {
    try {
      orderService.removeItem(itemId)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_APPLY_DISCOUNT, async (_event, orderId, type, value) => {
    try {
      const data = orderService.applyDiscount(orderId, type, value)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_HOLD, async (_event, orderId) => {
    try {
      const data = orderService.holdOrder(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_RECALL, async (_event, orderId) => {
    try {
      const data = orderService.recallOrder(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_GET_HELD, async () => {
    try {
      const data = orderService.getHeldOrders()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_SEND_TO_KITCHEN, async (_event, orderId) => {
    try {
      const data = orderService.sendToKitchen(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_DELETE, async (_event, orderId) => {
    try {
      const data = orderService.deleteOrder(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_GET_NEXT_NUMBER, async () => {
    try {
      const data = orderService.generateOrderNumber()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.ORDERS_RECALCULATE, async (_event, orderId) => {
    try {
      const data = orderService.recalculateTotals(orderId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
