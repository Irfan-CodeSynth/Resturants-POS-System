import { app, dialog, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import fs from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'

export function registerSystemIPC(): void {
  ipcMain.handle('system:select-file', async (_event, options: any) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        ...options
      })
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, data: result.filePaths[0] }
      }
      return { success: true, data: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('system:select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, data: result.filePaths[0] }
      }
      return { success: true, data: null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('system:get-version', () => {
    try {
      return { success: true, data: app.getVersion() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('system:get-app-path', (_event, name: any) => {
    try {
      return { success: true, data: app.getPath(name) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('system:save-image', async (_event, imagePath: string) => {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error('Image not found')
      }
      const userData = app.getPath('userData')
      const imagesDir = path.join(userData, 'images')
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }
      
      const ext = path.extname(imagePath)
      const fileName = `${uuid()}${ext}`
      const destPath = path.join(imagesDir, fileName)
      
      fs.copyFileSync(imagePath, destPath)
      return { success: true, data: `images://${fileName}` }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
