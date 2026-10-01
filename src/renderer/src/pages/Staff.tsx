import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Key } from 'lucide-react'

export default function Staff() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
        <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No staff members yet</h3>
        <p className="mt-1">Add staff members and assign them roles to manage access.</p>
      </div>
    </motion.div>
  )
}
