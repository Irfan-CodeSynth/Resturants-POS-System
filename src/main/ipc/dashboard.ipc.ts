import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as dashboardService from '../services/dashboard.service'

export function registerDashboardIPC(): void {
  ipcMain.handle(IPC.DASHBOARD_STATS, async () => {
    try {
      const data = dashboardService.getStats()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.DASHBOARD_CHARTS, async (_event, period) => {
    try {
      const data = dashboardService.getCharts(period)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.DASHBOARD_RECENT_ORDERS, async (_event, limit) => {
    try {
      const data = dashboardService.getRecentOrders(limit)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.DASHBOARD_LOW_STOCK, async () => {
    try {
      const data = dashboardService.getLowStock()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle(IPC.DASHBOARD_RECENT_ACTIVITY, async (_event, limit) => {
    try {
      const data = dashboardService.getRecentActivity(limit)
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
