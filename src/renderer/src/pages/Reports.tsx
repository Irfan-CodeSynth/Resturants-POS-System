import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, FileText } from 'lucide-react'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')

  const tabs = [
    { id: 'sales', label: 'Sales Summary' },
    { id: 'orders', label: 'Orders & Tickets' },
    { id: 'products', label: 'Product Performance' },
    { id: 'categories', label: 'Category Sales' },
    { id: 'payments', label: 'Payment Methods' },
    { id: 'inventory', label: 'Inventory Value' },
    { id: 'staff', label: 'Staff Performance' },
    { id: 'tax', label: 'Tax Report' }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      </div>

      <div className="flex flex-1 overflow-hidden bg-white rounded-xl shadow-sm border">
        {/* Sidebar Tabs */}
        <div className="w-56 border-r bg-gray-50 p-2 space-y-1 overflow-y-auto">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-white flex justify-between items-center">
            <h2 className="text-lg font-bold capitalize">{activeTab.replace('-', ' ')} Report</h2>
            <div className="flex space-x-2">
              <input type="date" className="border rounded px-3 py-1.5 text-sm" />
              <span className="text-gray-400 mt-1">-</span>
              <input type="date" className="border rounded px-3 py-1.5 text-sm" />
              <button className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded shadow-sm hover:bg-blue-700">Generate</button>
              <button className="px-3 py-1.5 border bg-white text-gray-700 text-sm rounded shadow-sm hover:bg-gray-50 flex items-center">
                <Download className="w-4 h-4 mr-1" /> Export
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-gray-500 overflow-y-auto bg-gray-50/30">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p>Select date range and click Generate to view the report.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
