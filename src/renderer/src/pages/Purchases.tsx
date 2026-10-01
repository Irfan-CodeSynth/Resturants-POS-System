import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus } from 'lucide-react'

export default function Purchases() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Purchases</h1>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
        <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p>No purchase orders found.</p>
      </div>
    </motion.div>
  )
}
