// Type declaration for the preload API
import type { ElectronAPI } from './index'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
