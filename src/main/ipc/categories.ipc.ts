import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/category.service'
import { IPCResponse, Category } from '../../shared/types'

export function registerCategoriesIPC(): void {
  ipcMain.handle(IPC.CATEGORIES_LIST, async (): Promise<IPCResponse<Category[]>> => {
    try {
      const data = service.listCategories()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_GET, async (_event, id: string): Promise<IPCResponse<Category | null>> => {
    try {
      const data = service.getCategory(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_CREATE, async (_event, data: Partial<Category>, userId?: string, userName?: string): Promise<IPCResponse<Category>> => {
    try {
      const result = service.createCategory(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_UPDATE, async (_event, id: string, data: Partial<Category>, userId?: string, userName?: string): Promise<IPCResponse<Category | null>> => {
    try {
      const result = service.updateCategory(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_DELETE, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteCategory(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.CATEGORIES_REORDER, async (_event, orderedIds: string[], userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      service.reorderCategories(orderedIds, userId, userName)
      return { success: true, data: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
