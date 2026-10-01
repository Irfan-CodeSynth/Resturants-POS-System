import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/inventory.service'
import { IPCResponse, InventoryItem, PaginatedResponse, PaginatedRequest, InventoryMovement, InventoryMovementType } from '../../shared/types'

interface InventoryFilters extends PaginatedRequest {
  supplier_id?: string
}

interface MovementFilters extends PaginatedRequest {
  type?: string
  start_date?: string
  end_date?: string
}

export function registerInventoryIPC(): void {
  ipcMain.handle(IPC.INVENTORY_LIST, async (_event, filters?: InventoryFilters): Promise<IPCResponse<PaginatedResponse<InventoryItem>>> => {
    try {
      const data = service.listItems(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_GET, async (_event, id: string): Promise<IPCResponse<InventoryItem | null>> => {
    try {
      const data = service.getItem(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_CREATE, async (_event, data: Partial<InventoryItem>, userId?: string, userName?: string): Promise<IPCResponse<InventoryItem>> => {
    try {
      const result = service.createItem(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_UPDATE, async (_event, id: string, data: Partial<InventoryItem>, userId?: string, userName?: string): Promise<IPCResponse<InventoryItem | null>> => {
    try {
      const result = service.updateItem(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_DELETE, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteItem(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_ADJUST, async (_event, itemId: string, quantity: number, type: InventoryMovementType, reason?: string, referenceType?: string, referenceId?: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      service.adjustStock(itemId, quantity, type, reason, referenceType, referenceId, userId, userName)
      return { success: true, data: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_LOW_STOCK, async (): Promise<IPCResponse<InventoryItem[]>> => {
    try {
      const data = service.getLowStock()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.INVENTORY_MOVEMENTS, async (_event, itemId?: string, filters?: MovementFilters): Promise<IPCResponse<PaginatedResponse<InventoryMovement>>> => {
    try {
      const data = service.getMovements(itemId, filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
