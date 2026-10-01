import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, BookOpen } from 'lucide-react'

export default function Recipes() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <ChefHat className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Recipes</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-xl shadow-sm border p-4 h-[calc(100vh-140px)] overflow-y-auto">
          <h2 className="font-bold border-b pb-2 mb-4">Products</h2>
          <div className="text-sm text-gray-500 text-center py-10">Select a product to edit its recipe.</div>
        </div>
        <div className="col-span-2 bg-white rounded-xl shadow-sm border p-10 flex flex-col items-center justify-center text-gray-500">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <p>No product selected.</p>
        </div>
      </div>
    </motion.div>
  )
}
