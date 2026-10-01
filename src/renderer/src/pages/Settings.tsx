import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/auth-store'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('restaurant')
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    loadSettings()
  }, [])

  // The restaurant singleton holds business identity/tax; loose preferences live in the
  // key/value `settings` table, so a page like this has to read and write both.
  async function loadSettings() {
    setLoading(true)
    try {
      const [restaurantRes, settingsRes] = await Promise.all([
        window.api.settings.getRestaurant(),
        window.api.settings.list()
      ])
      if (!restaurantRes.success) throw new Error(restaurantRes.error || 'Failed to load settings')

      const prefs: Record<string, string> = {}
      for (const row of settingsRes.data ?? []) prefs[row.key] = row.value

      reset({
        ...restaurantRes.data,
        tax_rate: Number(restaurantRes.data?.tax_rate ?? 0),
        require_table: prefs.require_table === '1',
        theme: prefs.theme || 'light'
      })
    } catch (e: any) {
      toast.error(e.message || 'Failed to load settings')
    }
    setLoading(false)
  }

  const onSubmit = async (data: any) => {
    const actor = useAuthStore.getState().user
    try {
      const { require_table, theme, ...restaurant } = data
      const res = await window.api.settings.updateRestaurant(restaurant, actor?.id, actor?.name)
      if (!res.success) throw new Error(res.error || 'Failed to save settings')

      await window.api.settings.bulkSet([
        { key: 'require_table', value: require_table ? '1' : '0', group: 'orders' },
        { key: 'theme', value: theme || 'light', group: 'appearance' }
      ], actor?.id, actor?.name)
      toast.success('Settings saved successfully')
    } catch (e: any) {
      toast.error(e.message || 'An error occurred while saving')
    }
  }

  const tabs = [
    { id: 'restaurant', label: 'Restaurant Info' },
    { id: 'currency', label: 'Currency & Tax' },
    { id: 'orders', label: 'Orders & POS' },
    { id: 'appearance', label: 'Appearance' }
  ]

  if (loading) return <div className="p-10 text-center">Loading settings...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Settings className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">System Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden bg-white rounded-xl shadow-sm border">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r bg-gray-50 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form id="settingsForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            
            {activeTab === 'restaurant' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">Restaurant Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                  <input type="text" {...register('name')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea {...register('address')} rows={3} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input type="text" {...register('phone')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
              </div>
            )}

            {activeTab === 'currency' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">Currency & Tax</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
                  <input type="text" {...register('currency')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
                  <input type="number" step="0.01" {...register('tax_rate')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">Orders & POS</h2>
                <div className="flex items-center">
                  <input type="checkbox" id="requireTable" {...register('require_table')} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="requireTable" className="ml-2 block text-sm text-gray-900">Require Table for Dine-In</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Footer Message</label>
                  <textarea {...register('receipt_footer')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">Appearance</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Theme</label>
                  <select {...register('theme')} className="mt-1 block w-full border rounded-md shadow-sm p-2">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" form="settingsForm" className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </button>
      </div>
    </motion.div>
  )
}
