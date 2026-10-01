import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type TicketItem = { name: string; qty: number; notes?: string }
type Ticket = {
  id: string
  table?: string
  type: string
  time: string
  status: 'new' | 'preparing'
  items: TicketItem[]
}

const mockTickets: Ticket[] = [
  { id: '101', table: '4', type: 'Dine In', time: '12m', status: 'preparing', items: [
    { name: 'Classic Burger', qty: 2, notes: 'No onions' },
    { name: 'Fries', qty: 1 }
  ]},
  { id: '102', type: 'Takeaway', time: '5m', status: 'new', items: [
    { name: 'Margherita Pizza', qty: 1 },
    { name: 'Cola', qty: 2 }
  ]}
]

export default function Kitchen() {
  const [tickets, setTickets] = useState(mockTickets)

  const markReady = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Kitchen Display</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500"></div> New</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500"></div> Preparing</div>
        </div>
      </div>

      <div className="flex gap-6 pb-4">
        <AnimatePresence>
          {tickets.map(ticket => (
            <motion.div
              key={ticket.id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex-none w-80 rounded-xl overflow-hidden shadow-xl border-t-8 ${ticket.status === 'new' ? 'border-t-blue-500' : 'border-t-yellow-500'} bg-slate-800 flex flex-col max-h-[calc(100vh-120px)]`}
            >
              <div className="p-4 border-b border-slate-700 flex justify-between items-start bg-slate-800/50">
                <div>
                  <div className="text-2xl font-black text-white">#{ticket.id}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-slate-300 border-slate-600">{ticket.type}</Badge>
                    {ticket.table && <Badge className="bg-slate-700">T{ticket.table}</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-medium">
                  <Clock className="h-4 w-4" /> {ticket.time}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {ticket.items.map((item, i) => (
                  <div key={i} className="flex gap-3 text-lg">
                    <div className="font-bold text-white bg-slate-700 h-8 w-8 rounded flex items-center justify-center shrink-0">{item.qty}</div>
                    <div>
                      <div className="font-semibold text-white leading-tight mt-1">{item.name}</div>
                      {item.notes && <div className="text-sm text-red-400 mt-1 font-medium">* {item.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <Button 
                  className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-500 text-white"
                  onClick={() => markReady(ticket.id)}
                >
                  <CheckCircle className="mr-2 h-6 w-6" /> Mark Ready
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {tickets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 mt-20">
            <CheckCircle className="h-20 w-20 mb-4 opacity-20" />
            <p className="text-2xl font-medium">All caught up!</p>
            <p>No active orders in the kitchen.</p>
          </div>
        )}
      </div>
    </div>
  )
}
