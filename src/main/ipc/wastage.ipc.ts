import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/wastage.service'
import { IPCResponse, Wastage, PaginatedResponse, PaginatedRequest } from '../../shared/types'

interface WastageFilters extends PaginatedRequest {
  start_date?: string
  end_date?: string
}

export function registerWastageIPC(): void {
  ipcMain.handle(IPC.WASTAGE_LIST, async (_event, filters?: WastageFilters): Promise<IPCResponse<PaginatedResponse<Wastage>>> => {
    try {
      const data = service.listWastage(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.WASTAGE_CREATE, async (_event, data: Partial<Wastage>, userId?: string, userName?: string): Promise<IPCResponse<Wastage>> => {
    try {
      const result = service.createWastage(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
