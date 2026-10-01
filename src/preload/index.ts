// ============================================================
// Preload Script — Secure API Bridge
// ============================================================
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

// Build the API object dynamically from IPC channels
function createInvoker(channel: string) {
  return (...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
}

const api = {
  // Auth
  auth: {
    login: createInvoker(IPC.AUTH_LOGIN),
    loginPin: createInvoker(IPC.AUTH_LOGIN_PIN),
    logout: createInvoker(IPC.AUTH_LOGOUT),
    verifyManager: createInvoker(IPC.AUTH_VERIFY_MANAGER),
    changePassword: createInvoker(IPC.AUTH_CHANGE_PASSWORD),
  },

  // Setup
  setup: {
    check: createInvoker(IPC.SETUP_CHECK),
    complete: createInvoker(IPC.SETUP_COMPLETE),
  },

  // Dashboard
  dashboard: {
    getStats: createInvoker(IPC.DASHBOARD_STATS),
    getCharts: createInvoker(IPC.DASHBOARD_CHARTS),
    getRecentOrders: createInvoker(IPC.DASHBOARD_RECENT_ORDERS),
    getLowStock: createInvoker(IPC.DASHBOARD_LOW_STOCK),
    getRecentActivity: createInvoker(IPC.DASHBOARD_RECENT_ACTIVITY),
  },

  // Categories
  categories: {
    list: createInvoker(IPC.CATEGORIES_LIST),
    get: createInvoker(IPC.CATEGORIES_GET),
    create: createInvoker(IPC.CATEGORIES_CREATE),
    update: createInvoker(IPC.CATEGORIES_UPDATE),
    delete: createInvoker(IPC.CATEGORIES_DELETE),
    reorder: createInvoker(IPC.CATEGORIES_REORDER),
  },

  // Products
  products: {
    list: createInvoker(IPC.PRODUCTS_LIST),
    get: createInvoker(IPC.PRODUCTS_GET),
    getByBarcode: createInvoker(IPC.PRODUCTS_GET_BY_BARCODE),
    create: createInvoker(IPC.PRODUCTS_CREATE),
    update: createInvoker(IPC.PRODUCTS_UPDATE),
    delete: createInvoker(IPC.PRODUCTS_DELETE),
    search: createInvoker(IPC.PRODUCTS_SEARCH),
    getPOS: createInvoker(IPC.PRODUCTS_GET_POS),
  },

  // Modifiers
  modifiers: {
    listGroups: createInvoker(IPC.MODIFIERS_LIST_GROUPS),
    getGroup: createInvoker(IPC.MODIFIERS_GET_GROUP),
    createGroup: createInvoker(IPC.MODIFIERS_CREATE_GROUP),
    updateGroup: createInvoker(IPC.MODIFIERS_UPDATE_GROUP),
    deleteGroup: createInvoker(IPC.MODIFIERS_DELETE_GROUP),
    getByProduct: createInvoker(IPC.MODIFIERS_GET_BY_PRODUCT),
    linkProduct: createInvoker(IPC.MODIFIERS_LINK_PRODUCT),
    unlinkProduct: createInvoker(IPC.MODIFIERS_UNLINK_PRODUCT),
  },

  // Orders
  orders: {
    list: createInvoker(IPC.ORDERS_LIST),
    get: createInvoker(IPC.ORDERS_GET),
    create: createInvoker(IPC.ORDERS_CREATE),
    update: createInvoker(IPC.ORDERS_UPDATE),
    updateStatus: createInvoker(IPC.ORDERS_UPDATE_STATUS),
    delete: createInvoker(IPC.ORDERS_DELETE),
    addItem: createInvoker(IPC.ORDERS_ADD_ITEM),
    updateItem: createInvoker(IPC.ORDERS_UPDATE_ITEM),
    removeItem: createInvoker(IPC.ORDERS_REMOVE_ITEM),
    applyDiscount: createInvoker(IPC.ORDERS_APPLY_DISCOUNT),
    hold: createInvoker(IPC.ORDERS_HOLD),
    recall: createInvoker(IPC.ORDERS_RECALL),
    getHeld: createInvoker(IPC.ORDERS_GET_HELD),
    sendToKitchen: createInvoker(IPC.ORDERS_SEND_TO_KITCHEN),
    getNextNumber: createInvoker(IPC.ORDERS_GET_NEXT_NUMBER),
    recalculate: createInvoker(IPC.ORDERS_RECALCULATE),
  },

  // Payments
  payments: {
    process: createInvoker(IPC.PAYMENTS_PROCESS),
    refund: createInvoker(IPC.PAYMENTS_REFUND),
    getByOrder: createInvoker(IPC.PAYMENTS_GET_BY_ORDER),
  },

  // Tables
  tables: {
    list: createInvoker(IPC.TABLES_LIST),
    get: createInvoker(IPC.TABLES_GET),
    create: createInvoker(IPC.TABLES_CREATE),
    update: createInvoker(IPC.TABLES_UPDATE),
    delete: createInvoker(IPC.TABLES_DELETE),
    updateStatus: createInvoker(IPC.TABLES_UPDATE_STATUS),
    transfer: createInvoker(IPC.TABLES_TRANSFER),
  },

  // Kitchen
  kitchen: {
    getOrders: createInvoker(IPC.KITCHEN_GET_ORDERS),
    updateItem: createInvoker(IPC.KITCHEN_UPDATE_ITEM),
    updateOrder: createInvoker(IPC.KITCHEN_UPDATE_ORDER),
    completeOrder: createInvoker(IPC.KITCHEN_COMPLETE_ORDER),
  },

  // Customers
  customers: {
    list: createInvoker(IPC.CUSTOMERS_LIST),
    get: createInvoker(IPC.CUSTOMERS_GET),
    create: createInvoker(IPC.CUSTOMERS_CREATE),
    update: createInvoker(IPC.CUSTOMERS_UPDATE),
    delete: createInvoker(IPC.CUSTOMERS_DELETE),
    search: createInvoker(IPC.CUSTOMERS_SEARCH),
    getOrders: createInvoker(IPC.CUSTOMERS_GET_ORDERS),
  },

  // Inventory
  inventory: {
    list: createInvoker(IPC.INVENTORY_LIST),
    get: createInvoker(IPC.INVENTORY_GET),
    create: createInvoker(IPC.INVENTORY_CREATE),
    update: createInvoker(IPC.INVENTORY_UPDATE),
    delete: createInvoker(IPC.INVENTORY_DELETE),
    adjust: createInvoker(IPC.INVENTORY_ADJUST),
    getLowStock: createInvoker(IPC.INVENTORY_LOW_STOCK),
    getMovements: createInvoker(IPC.INVENTORY_MOVEMENTS),
  },

  // Recipes
  recipes: {
    get: createInvoker(IPC.RECIPES_GET),
    save: createInvoker(IPC.RECIPES_SAVE),
    delete: createInvoker(IPC.RECIPES_DELETE),
  },

  // Suppliers
  suppliers: {
    list: createInvoker(IPC.SUPPLIERS_LIST),
    get: createInvoker(IPC.SUPPLIERS_GET),
    create: createInvoker(IPC.SUPPLIERS_CREATE),
    update: createInvoker(IPC.SUPPLIERS_UPDATE),
    delete: createInvoker(IPC.SUPPLIERS_DELETE),
  },

  // Purchases
  purchases: {
    list: createInvoker(IPC.PURCHASES_LIST),
    get: createInvoker(IPC.PURCHASES_GET),
    create: createInvoker(IPC.PURCHASES_CREATE),
    update: createInvoker(IPC.PURCHASES_UPDATE),
    delete: createInvoker(IPC.PURCHASES_DELETE),
  },

  // Wastage
  wastage: {
    list: createInvoker(IPC.WASTAGE_LIST),
    create: createInvoker(IPC.WASTAGE_CREATE),
  },

  // Expenses
  expenses: {
    list: createInvoker(IPC.EXPENSES_LIST),
    create: createInvoker(IPC.EXPENSES_CREATE),
    update: createInvoker(IPC.EXPENSES_UPDATE),
    delete: createInvoker(IPC.EXPENSES_DELETE),
    listCategories: createInvoker(IPC.EXPENSE_CATEGORIES_LIST),
    createCategory: createInvoker(IPC.EXPENSE_CATEGORIES_CREATE),
    updateCategory: createInvoker(IPC.EXPENSE_CATEGORIES_UPDATE),
    deleteCategory: createInvoker(IPC.EXPENSE_CATEGORIES_DELETE),
  },

  // Cash Register
  cash: {
    open: createInvoker(IPC.CASH_OPEN),
    close: createInvoker(IPC.CASH_CLOSE),
    getActive: createInvoker(IPC.CASH_GET_ACTIVE),
    cashIn: createInvoker(IPC.CASH_IN),
    cashOut: createInvoker(IPC.CASH_OUT),
    history: createInvoker(IPC.CASH_HISTORY),
    movements: createInvoker(IPC.CASH_MOVEMENTS),
  },

  // Staff
  staff: {
    list: createInvoker(IPC.STAFF_LIST),
    get: createInvoker(IPC.STAFF_GET),
    create: createInvoker(IPC.STAFF_CREATE),
    update: createInvoker(IPC.STAFF_UPDATE),
    delete: createInvoker(IPC.STAFF_DELETE),
  },

  // Roles
  roles: {
    list: createInvoker(IPC.ROLES_LIST),
    get: createInvoker(IPC.ROLES_GET),
    create: createInvoker(IPC.ROLES_CREATE),
    update: createInvoker(IPC.ROLES_UPDATE),
    delete: createInvoker(IPC.ROLES_DELETE),
    listPermissions: createInvoker(IPC.PERMISSIONS_LIST),
  },

  // Reports
  reports: {
    sales: createInvoker(IPC.REPORTS_SALES),
    orders: createInvoker(IPC.REPORTS_ORDERS),
    products: createInvoker(IPC.REPORTS_PRODUCTS),
    categories: createInvoker(IPC.REPORTS_CATEGORIES),
    payments: createInvoker(IPC.REPORTS_PAYMENTS),
    discounts: createInvoker(IPC.REPORTS_DISCOUNTS),
    refunds: createInvoker(IPC.REPORTS_REFUNDS),
    cashRegister: createInvoker(IPC.REPORTS_CASH_REGISTER),
    employees: createInvoker(IPC.REPORTS_EMPLOYEES),
    inventory: createInvoker(IPC.REPORTS_INVENTORY),
    stockMovements: createInvoker(IPC.REPORTS_STOCK_MOVEMENTS),
    purchases: createInvoker(IPC.REPORTS_PURCHASES),
    suppliers: createInvoker(IPC.REPORTS_SUPPLIERS),
    expenses: createInvoker(IPC.REPORTS_EXPENSES),
    profitLoss: createInvoker(IPC.REPORTS_PROFIT_LOSS),
    tax: createInvoker(IPC.REPORTS_TAX),
    wastage: createInvoker(IPC.REPORTS_WASTAGE),
  },

  // Settings
  settings: {
    list: createInvoker(IPC.SETTINGS_LIST),
    get: createInvoker(IPC.SETTINGS_GET),
    set: createInvoker(IPC.SETTINGS_SET),
    bulkSet: createInvoker(IPC.SETTINGS_BULK_SET),
    getRestaurant: createInvoker(IPC.SETTINGS_GET_RESTAURANT),
    updateRestaurant: createInvoker(IPC.SETTINGS_UPDATE_RESTAURANT),
  },

  // Printers
  printers: {
    systemList: createInvoker(IPC.PRINTERS_SYSTEM_LIST),
    getConfigs: createInvoker(IPC.PRINTERS_GET_CONFIGS),
    saveConfig: createInvoker(IPC.PRINTERS_SAVE_CONFIG),
    deleteConfig: createInvoker(IPC.PRINTERS_DELETE_CONFIG),
    printReceipt: createInvoker(IPC.PRINTERS_PRINT_RECEIPT),
    printKitchen: createInvoker(IPC.PRINTERS_PRINT_KITCHEN),
    test: createInvoker(IPC.PRINTERS_TEST),
  },

  // Backup
  backup: {
    create: createInvoker(IPC.BACKUP_CREATE),
    restore: createInvoker(IPC.BACKUP_RESTORE),
    list: createInvoker(IPC.BACKUP_LIST),
    delete: createInvoker(IPC.BACKUP_DELETE),
    selectFolder: createInvoker(IPC.BACKUP_SELECT_FOLDER),
    getSettings: createInvoker(IPC.BACKUP_GET_SETTINGS),
    updateSettings: createInvoker(IPC.BACKUP_UPDATE_SETTINGS),
    exportData: createInvoker(IPC.BACKUP_EXPORT_DATA),
  },

  // Audit
  audit: {
    list: createInvoker(IPC.AUDIT_LIST),
    export: createInvoker(IPC.AUDIT_EXPORT),
  },

  // System
  system: {
    selectFile: createInvoker(IPC.SYSTEM_SELECT_FILE),
    selectDirectory: createInvoker(IPC.SYSTEM_SELECT_DIRECTORY),
    getVersion: createInvoker(IPC.SYSTEM_GET_VERSION),
    saveImage: createInvoker(IPC.SYSTEM_SAVE_IMAGE),
  },
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
