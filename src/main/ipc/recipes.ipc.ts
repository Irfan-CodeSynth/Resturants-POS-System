import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/recipe.service'
import { IPCResponse, Recipe, RecipeItem } from '../../shared/types'

export function registerRecipesIPC(): void {
  ipcMain.handle(IPC.RECIPES_GET, async (_event, productId: string): Promise<IPCResponse<Recipe | null>> => {
    try {
      const data = service.getByProduct(productId)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.RECIPES_SAVE, async (_event, productId: string, items: Partial<RecipeItem>[], notes?: string, userId?: string, userName?: string): Promise<IPCResponse<Recipe>> => {
    try {
      const result = service.save(productId, items, notes, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.RECIPES_DELETE, async (_event, productId: string, userId?: string, userName?: string): Promise<IPCResponse<boolean>> => {
    try {
      const result = service.deleteRecipe(productId, userId, userName)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
