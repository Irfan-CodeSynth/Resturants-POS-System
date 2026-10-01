import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/modifier.service'
import { IPCResponse, ModifierGroup } from '../../shared/types'

export function registerModifiersIPC(): void {
  ipcMain.handle(IPC.MODIFIERS_LIST_GROUPS, async (): Promise<IPCResponse<ModifierGroup[]>> => {
    try {
      const data = service.listGroups()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_GET_GROUP, async (_event, id: string): Promise<IPCResponse<ModifierGroup | null>> => {
    try {
      const data = service.getGroup(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_CREATE_GROUP, async (_event, data: Partial<ModifierGroup>, userId?: string, userName?: string): Promise<IPCResponse<ModifierGroup>> => {
    try {
      const result = service.createGroup(data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_UPDATE_GROUP, async (_event, id: string, data: Partial<ModifierGroup>, userId?: string, userName?: string): Promise<IPCResponse<ModifierGroup | null>> => {
    try {
      const result = service.updateGroup(id, data, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_DELETE_GROUP, async (_event, id: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteGroup(id, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_GET_BY_PRODUCT, async (_event, productId: string): Promise<IPCResponse<ModifierGroup[]>> => {
    try {
      const data = service.getByProduct(productId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_LINK_PRODUCT, async (_event, productId: string, groupId: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      service.linkProduct(productId, groupId, userId, userName)
      return { success: true, data: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.MODIFIERS_UNLINK_PRODUCT, async (_event, productId: string, groupId: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      service.unlinkProduct(productId, groupId, userId, userName)
      return { success: true, data: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
