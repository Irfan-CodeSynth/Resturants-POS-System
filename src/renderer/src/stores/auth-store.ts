import { create } from 'zustand'

export interface User {
  id: string
  username: string
  name: string
  roleId: string
  roleName: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isSetupComplete: boolean
  permissions: string[]
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginPin: (pin: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkSetup: () => Promise<void>
  setUser: (user: User | null, permissions: string[]) => void
  hasPermission: (key: string) => boolean
}

// The auth service returns one flat user row with role_name and permissions bolted on.
function toUser(payload: any): User {
  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    roleId: payload.role_id,
    roleName: payload.role_name,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isSetupComplete: true, // Should ideally come from an IPC call
  permissions: [],
  login: async (username, password) => {
    try {
      const res = await window.api.auth.login(username, password)
      if (res.success && res.data) {
        set({ user: toUser(res.data), isAuthenticated: true, permissions: res.data.permissions || [] })
        return { success: true }
      }
      return { success: false, error: res.error || 'Login failed' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
  loginPin: async (pin) => {
    try {
      const res = await window.api.auth.loginPin(pin)
      if (res.success && res.data) {
        set({ user: toUser(res.data), isAuthenticated: true, permissions: res.data.permissions || [] })
        return { success: true }
      }
      return { success: false, error: res.error || 'Login failed' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
  logout: async () => {
    try {
      await window.api.auth.logout()
    } catch (e) {
      // ignore
    }
    set({ user: null, isAuthenticated: false, permissions: [] })
  },
  checkSetup: async () => {
    try {
      const res = await window.api.setup.check()
      if (res.success) {
        set({ isSetupComplete: res.data?.setup_completed === 1 || res.data?.isSetupComplete === true })
      }
    } catch (e) {
      set({ isSetupComplete: false })
    }
  },
  setUser: (user, permissions) => {
    set({ user, isAuthenticated: !!user, permissions })
  },
  hasPermission: (key) => {
    return get().permissions.includes(key) || get().permissions.includes('admin')
  }
}))
