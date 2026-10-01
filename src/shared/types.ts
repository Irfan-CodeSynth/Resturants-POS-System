// ============================================================
// Shared Type Definitions
// Used by both main process and renderer
// ============================================================

// ---- Enums / Constants ----
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded'
export type KitchenItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other'
export type CashRegisterStatus = 'open' | 'closed'
export type CashMovementType = 'sale' | 'cash_in' | 'cash_out' | 'refund'
export type InventoryMovementType = 'purchase' | 'sale' | 'adjustment' | 'waste' | 'return' | 'transfer'
export type DiscountType = 'percentage' | 'fixed'
export type PurchasePaymentStatus = 'pending' | 'partial' | 'paid'
export type WastageReason = 'expired' | 'burnt' | 'damaged' | 'spilled' | 'other'
export type InventoryUnit = 'KG' | 'G' | 'L' | 'ML' | 'PCS' | 'BOX' | 'PACK' | 'DOZEN' | 'PLATE'
export type PrinterType = 'receipt' | 'kitchen' | 'normal'
export type BackupType = 'manual' | 'auto' | 'scheduled' | 'on_close'

// ---- Entities ----

export interface User {
  id: string
  name: string
  username: string
  pin_hash?: string
  role_id: string
  role_name?: string
  is_active: number
  last_login?: string
  created_at: string
  updated_at: string
  permissions?: string[]
}

export interface Role {
  id: string
  name: string
  description?: string
  is_system: number
  created_at: string
  permissions?: string[]
}

export interface Restaurant {
  id: string
  name: string
  logo?: string
  phone?: string
  address?: string
  currency: string
  currency_code: string
  timezone: string
  date_format: string
  time_format: string
  tax_rate: number
  service_charge_rate: number
  receipt_footer: string
  default_order_type: OrderType
  setup_completed: number
  created_at: string
  updated_at: string
}

export interface Setting {
  id: string
  key: string
  value: string | null
  group: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  image?: string
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
  product_count?: number
}

export interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  category_id?: string
  category_name?: string
  description?: string
  image?: string
  selling_price: number
  cost_price: number
  tax_rate: number
  is_active: number
  track_stock: number
  current_stock?: number
  created_at: string
  updated_at: string
  modifier_groups?: ModifierGroup[]
}

export interface ModifierGroup {
  id: string
  name: string
  is_required: number
  min_selections: number
  max_selections: number
  sort_order: number
  created_at: string
  modifiers: Modifier[]
}

export interface Modifier {
  id: string
  group_id: string
  name: string
  price_adjustment: number
  is_default: number
  sort_order: number
  created_at: string
}

export interface Table {
  id: string
  number: number
  name?: string
  capacity: number
  status: TableStatus
  position_x: number
  position_y: number
  floor: string
  shape: string
  current_order_id?: string
  current_order_amount?: number
  order_time?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  total_spending: number
  order_count: number
  last_order_at?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  order_type: OrderType
  status: OrderStatus
  table_id?: string
  table_number?: number
  customer_id?: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  delivery_fee: number
  delivery_notes?: string
  subtotal: number
  discount_amount: number
  discount_type?: DiscountType
  discount_value: number
  tax_amount: number
  service_charge: number
  total: number
  notes?: string
  is_held: number
  user_id: string
  user_name?: string
  created_at: string
  updated_at: string
  completed_at?: string
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  total: number
  notes?: string
  status: KitchenItemStatus
  sent_to_kitchen: number
  created_at: string
  modifiers?: OrderItemModifier[]
}

export interface OrderItemModifier {
  id: string
  order_item_id: string
  modifier_id?: string
  modifier_name: string
  price_adjustment: number
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount: number
  reference?: string
  received_amount: number
  change_amount: number
  user_id: string
  user_name?: string
  created_at: string
}

export interface Refund {
  id: string
  order_id: string
  payment_id?: string
  amount: number
  reason: string
  user_id: string
  user_name?: string
  approved_by?: string
  approver_name?: string
  created_at: string
}

export interface CashRegister {
  id: string
  user_id: string
  user_name?: string
  opening_amount: number
  closing_amount?: number
  expected_amount?: number
  difference?: number
  status: CashRegisterStatus
  opened_at: string
  closed_at?: string
  notes?: string
  movements?: CashMovement[]
}

export interface CashMovement {
  id: string
  register_id: string
  type: CashMovementType
  amount: number
  reason?: string
  reference_type?: string
  reference_id?: string
  user_id: string
  user_name?: string
  created_at: string
}

export interface InventoryItem {
  id: string
  name: string
  sku?: string
  unit: InventoryUnit
  current_stock: number
  minimum_stock: number
  cost_per_unit: number
  supplier_id?: string
  supplier_name?: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  item_id: string
  item_name?: string
  type: InventoryMovementType
  quantity: number
  unit_cost: number
  reference_type?: string
  reference_id?: string
  reason?: string
  user_id: string
  user_name?: string
  created_at: string
}

export interface Recipe {
  id: string
  product_id: string
  product_name?: string
  notes?: string
  created_at: string
  updated_at: string
  items: RecipeItem[]
}

export interface RecipeItem {
  id: string
  recipe_id: string
  inventory_item_id: string
  inventory_item_name?: string
  quantity: number
  unit: string
  available_stock?: number
}

export interface Supplier {
  id: string
  name: string
  company?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  notes?: string
  is_active: number
  created_at: string
  updated_at: string
  purchase_count?: number
  total_purchases?: number
}

export interface Purchase {
  id: string
  supplier_id?: string
  supplier_name?: string
  invoice_number?: string
  date: string
  total: number
  payment_status: PurchasePaymentStatus
  notes?: string
  user_id: string
  user_name?: string
  created_at: string
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  inventory_item_id: string
  inventory_item_name?: string
  quantity: number
  unit_cost: number
  total: number
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Expense {
  id: string
  category_id?: string
  category_name?: string
  amount: number
  date: string
  description?: string
  payment_method: PaymentMethod
  user_id: string
  user_name?: string
  created_at: string
}

export interface Wastage {
  id: string
  inventory_item_id: string
  inventory_item_name?: string
  quantity: number
  reason: WastageReason
  unit?: string
  user_id: string
  user_name?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  user_name?: string
  action: string
  entity?: string
  entity_id?: string
  details?: string
  created_at: string
}

export interface Backup {
  id: string
  filename: string
  filepath: string
  size: number
  type: BackupType
  user_id?: string
  user_name?: string
  created_at: string
}

export interface PrinterConfig {
  id: string
  name: string
  type: PrinterType
  printer_name?: string
  paper_width: number
  copies: number
  auto_print: number
  is_default: number
  created_at: string
  updated_at: string
}

// ---- API Request/Response Types ----

export interface PaginatedRequest {
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface DateRangeFilter {
  start_date: string
  end_date: string
}

export interface DashboardStats {
  today_sales: number
  today_orders: number
  average_order_value: number
  gross_profit: number
  net_sales: number
  total_discounts: number
  total_refunds: number
  total_expenses: number
  cash_balance: number
}

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface SalesChartData {
  date: string
  sales: number
  orders: number
}

export interface ReportData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  summary?: Record<string, number>
  date_range?: DateRangeFilter
}

export interface SetupData {
  restaurant: {
    name: string
    phone?: string
    address?: string
    currency: string
    currency_code: string
    tax_rate: number
    receipt_footer?: string
    default_order_type: OrderType
    timezone: string
    date_format: string
    time_format: string
  }
  admin: {
    name: string
    username: string
    password: string
  }
  printer?: {
    receipt_printer?: string
    kitchen_printer?: string
    paper_width?: number
  }
}

export interface ProcessPaymentRequest {
  order_id: string
  payments: Array<{
    method: PaymentMethod
    amount: number
    received_amount?: number
    reference?: string
  }>
}

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
