import { registerAuthIPC } from './auth.ipc'
import { registerSetupIPC } from './setup.ipc'
import { registerDashboardIPC } from './dashboard.ipc'
import { registerOrdersIPC } from './orders.ipc'
import { registerPaymentsIPC } from './payments.ipc'
import { registerKitchenIPC } from './kitchen.ipc'
import { registerTablesIPC } from './tables.ipc'
import { registerProductsIPC } from './products.ipc'
import { registerCategoriesIPC } from './categories.ipc'
import { registerModifiersIPC } from './modifiers.ipc'
import { registerInventoryIPC } from './inventory.ipc'
import { registerRecipesIPC } from './recipes.ipc'
import { registerSuppliersIPC } from './suppliers.ipc'
import { registerPurchasesIPC } from './purchases.ipc'
import { registerWastageIPC } from './wastage.ipc'
import { registerCustomersIPC } from './customers.ipc'
import { registerStaffIPC } from './staff.ipc'
import { registerRolesIPC } from './roles.ipc'
import { registerExpensesIPC } from './expenses.ipc'
import { registerCashIPC } from './cash.ipc'
import { registerSettingsIPC } from './settings.ipc'
import { registerBackupIPC } from './backup.ipc'
import { registerAuditIPC } from './audit.ipc'
import { registerPrintIPC } from './print.ipc'
import { registerReportsIPC } from './reports.ipc'
import { registerSystemIPC } from './system.ipc'

export function registerAllIPC(): void {
  registerAuthIPC()
  registerSetupIPC()
  registerDashboardIPC()
  registerOrdersIPC()
  registerPaymentsIPC()
  registerKitchenIPC()
  registerTablesIPC()
  registerProductsIPC()
  registerCategoriesIPC()
  registerModifiersIPC()
  registerInventoryIPC()
  registerRecipesIPC()
  registerSuppliersIPC()
  registerPurchasesIPC()
  registerWastageIPC()
  registerCustomersIPC()
  registerStaffIPC()
  registerRolesIPC()
  registerExpensesIPC()
  registerCashIPC()
  registerSettingsIPC()
  registerBackupIPC()
  registerAuditIPC()
  registerPrintIPC()
  registerReportsIPC()
  registerSystemIPC()
}
