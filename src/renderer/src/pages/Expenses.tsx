import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await window.api.expenses?.list?.() || { success: true, data: [] }
      if (res.success) setExpenses(res.data || [])
    } catch (e) {
      toast.error('Failed to load expenses')
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No expenses recorded yet.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table layout for expenses */}
          </table>
        )}
      </div>
    </motion.div>
  )
}
