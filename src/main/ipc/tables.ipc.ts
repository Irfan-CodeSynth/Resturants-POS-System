import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as tableService from '../services/table.service'

export function registerTablesIPC(): void {
  ipcMain.handle(IPC.TABLE_LIST, async () => {
    try {
      const data = tableService.listTables()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_GET, async (_event, id) => {
    try {
      const data = tableService.getTable(id)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_CREATE, async (_event, data) => {
    try {
      const result = tableService.createTable(data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_UPDATE, async (_event, id, data) => {
    try {
      const result = tableService.updateTable(id, data)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_DELETE, async (_event, id) => {
    try {
      const result = tableService.deleteTable(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_UPDATE_STATUS, async (_event, id, status) => {
    try {
      const result = tableService.updateStatus(id, status)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.TABLE_TRANSFER, async (_event, fromId, toId) => {
    try {
      const result = tableService.transferTable(fromId, toId)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
