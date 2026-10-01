// ============================================================
// IPC Channel Constants
// All main↔renderer communication goes through these channels
// ============================================================

export const IPC = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGIN_PIN: 'auth:login-pin',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_VERIFY_MANAGER: 'auth:verify-manager',
  AUTH_GET_CURRENT_USER: 'auth:get-current-user',
  AUTH_CHANGE_PASSWORD: 'auth:change-password',

  // Setup
  SETUP_CHECK: 'setup:check',
  SETUP_COMPLETE: 'setup:complete',

  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_CHARTS: 'dashboard:charts',
  DASHBOARD_RECENT_ORDERS: 'dashboard:recent-orders',
  DASHBOARD_LOW_STOCK: 'dashboard:low-stock',
  DASHBOARD_RECENT_ACTIVITY: 'dashboard:recent-activity',

  // Categories
  CATEGORIES_LIST: 'categories:list',
  CATEGORIES_GET: 'categories:get',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  CATEGORIES_REORDER: 'categories:reorder',

  // Products
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_GET: 'products:get',
  PRODUCTS_GET_BY_BARCODE: 'products:get-by-barcode',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_SEARCH: 'products:search',
  PRODUCTS_GET_POS: 'products:get-pos',

  // Modifier Groups
  MODIFIERS_LIST_GROUPS: 'modifiers:list-groups',
  MODIFIERS_GET_GROUP: 'modifiers:get-group',
  MODIFIERS_CREATE_GROUP: 'modifiers:create-group',
  MODIFIERS_UPDATE_GROUP: 'modifiers:update-group',
  MODIFIERS_DELETE_GROUP: 'modifiers:delete-group',
  MODIFIERS_GET_BY_PRODUCT: 'modifiers:get-by-product',
  MODIFIERS_LINK_PRODUCT: 'modifiers:link-product',
  MODIFIERS_UNLINK_PRODUCT: 'modifiers:unlink-product',

  // Orders
  ORDERS_LIST: 'orders:list',
  ORDERS_GET: 'orders:get',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_UPDATE_STATUS: 'orders:update-status',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_ADD_ITEM: 'orders:add-item',
  ORDERS_UPDATE_ITEM: 'orders:update-item',
  ORDERS_REMOVE_ITEM: 'orders:remove-item',
  ORDERS_APPLY_DISCOUNT: 'orders:apply-discount',
  ORDERS_HOLD: 'orders:hold',
  ORDERS_RECALL: 'orders:recall',
  ORDERS_GET_HELD: 'orders:get-held',
  ORDERS_SEND_TO_KITCHEN: 'orders:send-to-kitchen',
  ORDERS_GET_NEXT_NUMBER: 'orders:get-next-number',
  ORDERS_RECALCULATE: 'orders:recalculate',

  // Payments
  PAYMENTS_PROCESS: 'payments:process',
  PAYMENTS_REFUND: 'payments:refund',
  PAYMENTS_GET_BY_ORDER: 'payments:get-by-order',

  // Tables
  TABLES_LIST: 'tables:list',
  TABLES_GET: 'tables:get',
  TABLES_CREATE: 'tables:create',
  TABLES_UPDATE: 'tables:update',
  TABLES_DELETE: 'tables:delete',
  TABLES_UPDATE_STATUS: 'tables:update-status',
  TABLES_TRANSFER: 'tables:transfer',

  // Kitchen
  KITCHEN_GET_ORDERS: 'kitchen:get-orders',
  KITCHEN_UPDATE_ITEM: 'kitchen:update-item',
  KITCHEN_UPDATE_ORDER: 'kitchen:update-order',
  KITCHEN_COMPLETE_ORDER: 'kitchen:complete-order',

  // Customers
  CUSTOMERS_LIST: 'customers:list',
  CUSTOMERS_GET: 'customers:get',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_SEARCH: 'customers:search',
  CUSTOMERS_GET_ORDERS: 'customers:get-orders',

  // Inventory
  INVENTORY_LIST: 'inventory:list',
  INVENTORY_GET: 'inventory:get',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_LOW_STOCK: 'inventory:low-stock',
  INVENTORY_MOVEMENTS: 'inventory:movements',

  // Recipes
  RECIPES_GET: 'recipes:get',
  RECIPES_SAVE: 'recipes:save',
  RECIPES_DELETE: 'recipes:delete',

  // Suppliers
  SUPPLIERS_LIST: 'suppliers:list',
  SUPPLIERS_GET: 'suppliers:get',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',

  // Purchases
  PURCHASES_LIST: 'purchases:list',
  PURCHASES_GET: 'purchases:get',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_UPDATE: 'purchases:update',
  PURCHASES_DELETE: 'purchases:delete',

  // Wastage
  WASTAGE_LIST: 'wastage:list',
  WASTAGE_CREATE: 'wastage:create',

  // Expenses
  EXPENSES_LIST: 'expenses:list',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_UPDATE: 'expenses:update',
  EXPENSES_DELETE: 'expenses:delete',
  EXPENSE_CATEGORIES_LIST: 'expense-categories:list',
  EXPENSE_CATEGORIES_CREATE: 'expense-categories:create',
  EXPENSE_CATEGORIES_UPDATE: 'expense-categories:update',
  EXPENSE_CATEGORIES_DELETE: 'expense-categories:delete',

  // Cash Register
  CASH_OPEN: 'cash:open',
  CASH_CLOSE: 'cash:close',
  CASH_GET_ACTIVE: 'cash:get-active',
  CASH_IN: 'cash:cash-in',
  CASH_OUT: 'cash:cash-out',
  CASH_HISTORY: 'cash:history',
  CASH_MOVEMENTS: 'cash:movements',

  // Staff
  STAFF_LIST: 'staff:list',
  STAFF_GET: 'staff:get',
  STAFF_CREATE: 'staff:create',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',

  // Roles
  ROLES_LIST: 'roles:list',
  ROLES_GET: 'roles:get',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  PERMISSIONS_LIST: 'permissions:list',

  // Reports
  REPORTS_SALES: 'reports:sales',
  REPORTS_ORDERS: 'reports:orders',
  REPORTS_PRODUCTS: 'reports:products',
  REPORTS_CATEGORIES: 'reports:categories',
  REPORTS_PAYMENTS: 'reports:payments',
  REPORTS_DISCOUNTS: 'reports:discounts',
  REPORTS_REFUNDS: 'reports:refunds',
  REPORTS_CASH_REGISTER: 'reports:cash-register',
  REPORTS_EMPLOYEES: 'reports:employees',
  REPORTS_INVENTORY: 'reports:inventory',
  REPORTS_STOCK_MOVEMENTS: 'reports:stock-movements',
  REPORTS_PURCHASES: 'reports:purchases',
  REPORTS_SUPPLIERS: 'reports:suppliers',
  REPORTS_EXPENSES: 'reports:expenses',
  REPORTS_PROFIT_LOSS: 'reports:profit-loss',
  REPORTS_TAX: 'reports:tax',
  REPORTS_WASTAGE: 'reports:wastage',

  // Settings
  SETTINGS_LIST: 'settings:list',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_BULK_SET: 'settings:bulk-set',
  SETTINGS_GET_RESTAURANT: 'settings:get-restaurant',
  SETTINGS_UPDATE_RESTAURANT: 'settings:update-restaurant',

  // Printers
  PRINTERS_SYSTEM_LIST: 'printers:system-list',
  PRINTERS_GET_CONFIGS: 'printers:get-configs',
  PRINTERS_SAVE_CONFIG: 'printers:save-config',
  PRINTERS_DELETE_CONFIG: 'printers:delete-config',
  PRINTERS_PRINT_RECEIPT: 'printers:print-receipt',
  PRINTERS_PRINT_KITCHEN: 'printers:print-kitchen',
  PRINTERS_TEST: 'printers:test',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_LIST: 'backup:list',
  BACKUP_DELETE: 'backup:delete',
  BACKUP_SELECT_FOLDER: 'backup:select-folder',
  BACKUP_GET_SETTINGS: 'backup:get-settings',
  BACKUP_UPDATE_SETTINGS: 'backup:update-settings',
  BACKUP_EXPORT_DATA: 'backup:export-data',

  // Audit
  AUDIT_LIST: 'audit:list',
  AUDIT_EXPORT: 'audit:export',

  // System
  SYSTEM_SELECT_FILE: 'system:select-file',
  SYSTEM_SELECT_DIRECTORY: 'system:select-directory',
  SYSTEM_GET_VERSION: 'system:get-version',
  SYSTEM_SAVE_IMAGE: 'system:save-image',

  // Aliases for compatibility
  ORDER_CREATE: 'orders:create',
  ORDER_GET: 'orders:get',
  ORDER_LIST: 'orders:list',
  ORDER_UPDATE: 'orders:update',
  ORDER_UPDATE_STATUS: 'orders:update-status',
  ORDER_DELETE: 'orders:delete',
  ORDER_ADD_ITEM: 'orders:add-item',
  ORDER_UPDATE_ITEM: 'orders:update-item',
  ORDER_REMOVE_ITEM: 'orders:remove-item',
  ORDER_APPLY_DISCOUNT: 'orders:apply-discount',
  ORDER_HOLD: 'orders:hold',
  ORDER_RECALL: 'orders:recall',
  ORDER_GET_HELD: 'orders:get-held',
  ORDER_SEND_TO_KITCHEN: 'orders:send-to-kitchen',
  ORDER_GET_NEXT_NUMBER: 'orders:get-next-number',
  ORDER_RECALCULATE: 'orders:recalculate',

  PAYMENT_PROCESS: 'payments:process',
  PAYMENT_REFUND: 'payments:refund',
  PAYMENT_GET_BY_ORDER: 'payments:get-by-order',

  TABLE_LIST: 'tables:list',
  TABLE_GET: 'tables:get',
  TABLE_CREATE: 'tables:create',
  TABLE_UPDATE: 'tables:update',
  TABLE_DELETE: 'tables:delete',
  TABLE_UPDATE_STATUS: 'tables:update-status',
  TABLE_TRANSFER: 'tables:transfer',

  KITCHEN_UPDATE_ITEM_STATUS: 'kitchen:update-item',
  KITCHEN_UPDATE_ORDER_STATUS: 'kitchen:update-order',

  CUSTOMERS_ORDERS: 'customers:get-orders',

  CASH_ACTIVE: 'cash:get-active',

  REPORT_SALES: 'reports:sales',
  REPORT_ORDERS: 'reports:orders',
  REPORT_PRODUCTS: 'reports:products',
  REPORT_CATEGORIES: 'reports:categories',
  REPORT_PAYMENTS: 'reports:payments',
  REPORT_DISCOUNTS: 'reports:discounts',
  REPORT_REFUNDS: 'reports:refunds',
  REPORT_CASH: 'reports:cash-register',
  REPORT_EMPLOYEES: 'reports:employees',
  REPORT_INVENTORY: 'reports:inventory',
  REPORT_STOCK: 'reports:stock-movements',
  REPORT_PURCHASES: 'reports:purchases',
  REPORT_SUPPLIERS: 'reports:suppliers',
  REPORT_EXPENSES: 'reports:expenses',
  REPORT_PROFIT_LOSS: 'reports:profit-loss',
  REPORT_TAX: 'reports:tax',
  REPORT_WASTAGE: 'reports:wastage',

  SETTINGS_BULK: 'settings:bulk-set',
  SETTINGS_RESTAURANT_GET: 'settings:get-restaurant',
  SETTINGS_RESTAURANT_UPDATE: 'settings:update-restaurant',

  PRINT_PRINTERS: 'printers:system-list',
  PRINT_CONFIGS: 'printers:get-configs',
  PRINT_SAVE_CONFIG: 'printers:save-config',
  PRINT_DELETE_CONFIG: 'printers:delete-config',
  PRINT_RECEIPT: 'printers:print-receipt',
  PRINT_KITCHEN: 'printers:print-kitchen',
  PRINT_TEST: 'printers:test',

  BACKUP_SETTINGS_GET: 'backup:get-settings',
  BACKUP_SETTINGS_UPDATE: 'backup:update-settings',
  DATA_EXPORT: 'backup:export-data',
} as const

export type IPCChannel = typeof IPC[keyof typeof IPC]
