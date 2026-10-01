import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/customer.service'

export function registerCustomersIPC(): void {
  ipcMain.handle(IPC.CUSTOMERS_LIST, async (_event, filters: any) => {
    try {
      const result = service.listCustomers(filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_GET, async (_event, id: string) => {
    try {
      const result = service.getCustomer(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_CREATE, async (_event, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.createCustomer(data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_UPDATE, async (_event, id: string, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.updateCustomer(id, data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_DELETE, async (_event, id: string, adminId?: string, adminName?: string) => {
    try {
      const result = service.deleteCustomer(id, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_SEARCH, async (_event, query: string) => {
    try {
      const result = service.searchCustomers(query)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CUSTOMERS_ORDERS, async (_event, customerId: string) => {
    try {
      const result = service.getCustomerOrders(customerId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
