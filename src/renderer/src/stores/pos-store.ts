import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { useAuthStore } from './auth-store'

export type OrderType = 'dine_in' | 'takeaway' | 'delivery'

export interface OrderItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
  modifiers: any[]
}

export interface POSState {
  currentOrder: OrderItem[]
  currentOrderId: string | null
  orderType: OrderType
  selectedTable: any | null
  selectedCustomer: any | null
  heldOrders: any[]
  categories: any[]
  products: any[]
  setOrderType: (type: OrderType) => void
  selectTable: (table: any) => void
  selectCustomer: (customer: any) => void
  addItem: (product: any, quantity?: number, modifiers?: any[], notes?: string) => void
  removeItem: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  updateItemNote: (itemId: string, notes: string) => void
  addModifiers: (itemId: string, modifiers: any[]) => void
  applyDiscount: (type: 'percentage' | 'fixed', value: number) => void
  clearOrder: () => void
  holdOrder: () => void
  recallOrder: (orderId: string) => void
  loadCategories: () => Promise<void>
  loadProducts: () => Promise<void>
  createOrder: () => Promise<{ success: boolean; data?: any; error?: string }>
  sendToKitchen: (orderId?: string) => Promise<{ success: boolean; error?: string }>
}

export const usePosStore = create<POSState>((set, get) => ({
  currentOrder: [],
  currentOrderId: null,
  orderType: 'dine_in',
  selectedTable: null,
  selectedCustomer: null,
  heldOrders: [],
  categories: [],
  products: [],
  setOrderType: (type) => set({ orderType: type }),
  selectTable: (table) => set({ selectedTable: table }),
  selectCustomer: (customer) => set({ selectedCustomer: customer }),
  addItem: (product, quantity = 1, modifiers = [], notes = '') => {
    set((state) => {
      const existingItem = state.currentOrder.find((item) => item.productId === product.id && JSON.stringify(item.modifiers) === JSON.stringify(modifiers))
      if (existingItem) {
        return {
          currentOrder: state.currentOrder.map((item) =>
            item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item
          )
        }
      }
      return {
        currentOrder: [
          ...state.currentOrder,
          { id: uuid(), productId: product.id, name: product.name, price: product.selling_price, quantity, modifiers, notes }
        ]
      }
    })
  },
  removeItem: (itemId) => set((state) => ({ currentOrder: state.currentOrder.filter((item) => item.id !== itemId) })),
  updateItemQuantity: (itemId, quantity) => set((state) => ({
    currentOrder: state.currentOrder.map((item) => (item.id === itemId ? { ...item, quantity } : item))
  })),
  updateItemNote: (itemId, notes) => set((state) => ({
    currentOrder: state.currentOrder.map((item) => (item.id === itemId ? { ...item, notes } : item))
  })),
  addModifiers: (itemId, modifiers) => set((state) => ({
    currentOrder: state.currentOrder.map((item) => (item.id === itemId ? { ...item, modifiers } : item))
  })),
  applyDiscount: (type, value) => {
    // Discount logic applied at order creation level or stored in state
  },
  clearOrder: () => set({ currentOrder: [], selectedTable: null, selectedCustomer: null }),
  holdOrder: () => {
    const { currentOrder, orderType, selectedTable, selectedCustomer } = get()
    if (currentOrder.length === 0) return
    const order = { id: uuid(), items: currentOrder, orderType, selectedTable, selectedCustomer, time: new Date().toISOString() }
    set((state) => ({ heldOrders: [...state.heldOrders, order], currentOrder: [], selectedTable: null, selectedCustomer: null }))
  },
  recallOrder: (orderId) => {
    const { heldOrders } = get()
    const order = heldOrders.find((o) => o.id === orderId)
    if (order) {
      set((state) => ({
        currentOrder: order.items,
        orderType: order.orderType,
        selectedTable: order.selectedTable,
        selectedCustomer: order.selectedCustomer,
        heldOrders: state.heldOrders.filter((o) => o.id !== orderId)
      }))
    }
  },
  loadCategories: async () => {
    try {
      const res = await window.api.categories.list()
      if (res.success) set({ categories: res.data })
    } catch (e) { console.error(e) }
  },
  loadProducts: async () => {
    try {
      const res = await window.api.products.list()
      // products.list is paginated, so the rows live at res.data.data
      if (res.success) set({ products: res.data?.data ?? [] })
    } catch (e) { console.error(e) }
  },
  createOrder: async () => {
    const { currentOrder, orderType, selectedTable, selectedCustomer } = get()
    try {
      // Keys are snake_case because order.service.createOrder reads them straight from the payload.
      // Prices are deliberately omitted: the server resolves each product's selling price.
      const orderData = {
        order_type: orderType,
        table_id: selectedTable?.id,
        customer_id: selectedCustomer?.id,
        user_id: useAuthStore.getState().user?.id ?? null,
        items: currentOrder.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers
        }))
      }
      const res = await window.api.orders.create(orderData)
      if (res.success) {
        set({ currentOrderId: res.data?.id ?? null })
        get().clearOrder()
        return { success: true, data: res.data }
      }
      return { success: false, error: res.error }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
  sendToKitchen: async (orderId?: string) => {
    const id = orderId ?? get().currentOrderId
    if (!id) return { success: false, error: 'No order has been created yet' }
    try {
      const res = await window.api.orders.sendToKitchen(id)
      return res.success ? { success: true } : { success: false, error: res.error }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}))
