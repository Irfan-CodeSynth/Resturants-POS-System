import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

const mockTables = [
  { id: 1, number: '1', capacity: 4, status: 'available' },
  { id: 2, number: '2', capacity: 2, status: 'occupied', orderTotal: 1500, timeElapsed: '45m' },
  { id: 3, number: '3', capacity: 6, status: 'reserved' },
  { id: 4, number: '4', capacity: 4, status: 'available' },
]

export default function Tables() {
  const [filter, setFilter] = useState('all')

  const filteredTables = mockTables.filter(t => filter === 'all' || t.status === filter)

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
          <p className="text-muted-foreground mt-1">Manage dine-in tables and reservations</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Table</Button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'available', 'occupied', 'reserved'].map(f => (
          <Button 
            key={f} 
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredTables.map(table => (
          <motion.div
            key={table.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-2xl p-6 border-2 cursor-pointer transition-all hover:shadow-lg ${
              table.status === 'available' ? 'border-green-200 bg-green-50' :
              table.status === 'occupied' ? 'border-blue-200 bg-blue-50' :
              'border-orange-200 bg-orange-50'
            }`}
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 text-slate-500 text-sm">
              <Users className="h-4 w-4" /> {table.capacity}
            </div>
            
            <div className="mt-4 mb-8">
              <div className={`text-5xl font-black text-center ${
                table.status === 'available' ? 'text-green-600' :
                table.status === 'occupied' ? 'text-blue-600' :
                'text-orange-600'
              }`}>
                {table.number}
              </div>
            </div>

            <div className="h-14 flex flex-col justify-end text-center">
              {table.status === 'occupied' && (
                <>
                  <div className="font-bold text-slate-800">{formatCurrency(table.orderTotal || 0)}</div>
                  <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-1">
                    <Clock className="h-3 w-3" /> {table.timeElapsed}
                  </div>
                </>
              )}
              {table.status === 'available' && <div className="text-sm font-medium text-green-700">Available</div>}
              {table.status === 'reserved' && <div className="text-sm font-medium text-orange-700">Reserved</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
