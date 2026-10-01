import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import * as service from '../services/report.service'

export function registerReportsIPC(): void {
  const handlerMap: Record<string, (dateRange: any) => any> = {
    [IPC.REPORT_SALES]: service.salesReport,
    [IPC.REPORT_ORDERS]: service.ordersReport,
    [IPC.REPORT_PRODUCTS]: service.productsReport,
    [IPC.REPORT_CATEGORIES]: service.categoriesReport,
    [IPC.REPORT_PAYMENTS]: service.paymentsReport,
    [IPC.REPORT_DISCOUNTS]: service.discountsReport,
    [IPC.REPORT_REFUNDS]: service.refundsReport,
    [IPC.REPORT_CASH]: service.cashRegisterReport,
    [IPC.REPORT_EMPLOYEES]: service.employeesReport,
    [IPC.REPORT_INVENTORY]: () => service.inventoryReport(),
    [IPC.REPORT_STOCK]: service.stockMovementsReport,
    [IPC.REPORT_PURCHASES]: service.purchasesReport,
    [IPC.REPORT_SUPPLIERS]: () => service.suppliersReport(),
    [IPC.REPORT_EXPENSES]: service.expensesReport,
    [IPC.REPORT_PROFIT_LOSS]: service.profitLossReport,
    [IPC.REPORT_TAX]: service.taxReport,
    [IPC.REPORT_WASTAGE]: service.wastageReport
  }

  for (const [channel, handler] of Object.entries(handlerMap)) {
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        const result = handler(args[0])
        return { success: true, data: result }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    })
  }
}
