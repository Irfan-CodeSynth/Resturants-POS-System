import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/product.service'
import { IPCResponse, Product, PaginatedResponse, PaginatedRequest } from '../../shared/types'

interface ProductFilters extends PaginatedRequest {
  category_id?: string
}

export function registerProductsIPC(): void {
  ipcMain.handle(IPC.PRODUCTS_LIST, async (_event, filters?: ProductFilters): Promise<IPCResponse<PaginatedResponse<Product>>> => {
    try {
      const data = service.listProducts(filters)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_GET, async (_event, id: string): Promise<IPCResponse<Product | null>> => {
    try {
      const data = service.getProduct(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_GET_BY_BARCODE, async (_event, barcode: string): Promise<IPCResponse<Product | null>> => {
    try {
      const data = service.getProductByBarcode(barcode)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_CREATE, async (_event, data: Partial<Product>, userId?: string, userName?: string): Promise<IPCResponse<Product>> => {
    try {
      const result = service.createProduct(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_UPDATE, async (_event, id: string, data: Partial<Product>, userId?: string, userName?: string): Promise<IPCResponse<Product | null>> => {
    try {
      const result = service.updateProduct(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_DELETE, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteProduct(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_SEARCH, async (_event, query: string): Promise<IPCResponse<Product[]>> => {
    try {
      const data = service.searchProducts(query)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.PRODUCTS_GET_POS, async (_event, categoryId?: string): Promise<IPCResponse<Record<string, Product[]>>> => {
    try {
      const data = service.getPOSProducts(categoryId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
