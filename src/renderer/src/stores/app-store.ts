import { create } from 'zustand'

// Mirrors the restaurant singleton row, so the field names are the database's snake_case ones.
export interface RestaurantInfo {
  id: string
  name: string
  address?: string
  phone?: string
  currency?: string
  tax_rate?: number
}

export interface AppState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  restaurantInfo: RestaurantInfo | null
  currency: string
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  loadRestaurant: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  theme: 'light',
  restaurantInfo: null,
  currency: 'Rs.',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => {
    set({ theme })
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  loadRestaurant: async () => {
    try {
      const res = await window.api.settings.getRestaurant()
      if (res.success && res.data) {
        set({ restaurantInfo: res.data, currency: res.data.currency || 'Rs.' })
      }
    } catch (e) {
      console.error('Failed to load restaurant info', e)
    }
  }
}))
