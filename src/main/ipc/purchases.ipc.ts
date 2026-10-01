import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/purchase.service'
import { IPCResponse, Purchase, PaginatedResponse, PaginatedRequest } from '../../shared/types'

interface PurchaseFilters extends PaginatedRequest {
  supplier_id?: string
  payment_status?: string
  start_date?: string
  end_date?: string
}

export function registerPurchasesIPC(): void {
  ipcMain.handle(IPC.PURCHASES_LIST, async (_event, filters?: PurchaseFilters): Promise<IPCResponse<PaginatedResponse<Purchase>>> => {
    try {
      const data = service.listPurchases(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PURCHASES_GET, async (_event, id: string): Promise<IPCResponse<Purchase | null>> => {
    try {
      const data = service.getPurchase(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PURCHASES_CREATE, async (_event, data: Partial<Purchase>, userId?: string, userName?: string): Promise<IPCResponse<Purchase>> => {
    try {
      const result = service.createPurchase(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PURCHASES_UPDATE, async (_event, id: string, data: Partial<Purchase>, userId?: string, userName?: string): Promise<IPCResponse<Purchase | null>> => {
    try {
      const result = service.updatePurchase(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PURCHASES_DELETE, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deletePurchase(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
