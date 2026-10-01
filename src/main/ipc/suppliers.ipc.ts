import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/supplier.service'
import { IPCResponse, Supplier, PaginatedResponse, PaginatedRequest } from '../../shared/types'

export function registerSuppliersIPC(): void {
  ipcMain.handle(IPC.SUPPLIERS_LIST, async (_event, filters?: PaginatedRequest): Promise<IPCResponse<PaginatedResponse<Supplier>>> => {
    try {
      const data = service.listSuppliers(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_GET, async (_event, id: string): Promise<IPCResponse<Supplier | null>> => {
    try {
      const data = service.getSupplier(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_CREATE, async (_event, data: Partial<Supplier>, userId?: string, userName?: string): Promise<IPCResponse<Supplier>> => {
    try {
      const result = service.createSupplier(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_UPDATE, async (_event, id: string, data: Partial<Supplier>, userId?: string, userName?: string): Promise<IPCResponse<Supplier | null>> => {
    try {
      const result = service.updateSupplier(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.SUPPLIERS_DELETE, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteSupplier(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
