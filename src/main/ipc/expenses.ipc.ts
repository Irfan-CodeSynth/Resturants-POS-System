import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/expense.service'

export function registerExpensesIPC(): void {
  ipcMain.handle(IPC.EXPENSES_LIST, async (_event, filters: any) => {
    try {
      const result = service.listExpenses(filters)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSES_CREATE, async (_event, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.createExpense(data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSES_UPDATE, async (_event, id: string, data: any, adminId?: string, adminName?: string) => {
    try {
      const result = service.updateExpense(id, data, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSES_DELETE, async (_event, id: string, adminId?: string, adminName?: string) => {
    try {
      const result = service.deleteExpense(id, adminId, adminName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSE_CATEGORIES_LIST, async () => {
    try {
      const result = service.listCategories()
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSE_CATEGORIES_CREATE, async (_event, name: string, description: string) => {
    try {
      const result = service.createCategory(name, description)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSE_CATEGORIES_UPDATE, async (_event, id: string, name: string, description: string) => {
    try {
      const result = service.updateCategory(id, name, description)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.EXPENSE_CATEGORIES_DELETE, async (_event, id: string) => {
    try {
      const result = service.deleteCategory(id)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
