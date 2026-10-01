import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const mockOrders = [
  { id: '1001', type: 'Dine In', status: 'completed', customer: 'John Doe', table: '4', total: 1500, time: '2023-10-27 14:30' },
  { id: '1002', type: 'Takeaway', status: 'preparing', customer: 'Walk-in', table: '-', total: 850, time: '2023-10-27 15:15' },
  { id: '1003', type: 'Delivery', status: 'ready', customer: 'Sarah Smith', table: '-', total: 2200, time: '2023-10-27 15:45' },
]

export default function Orders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  return (
    <div className="flex-1 p-8 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground mt-1">View and manage all orders</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search order number..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Order #</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer / Table</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/orders/${order.id}`)}>
                <TableCell className="font-medium text-blue-600">#{order.id}</TableCell>
                <TableCell>{order.time}</TableCell>
                <TableCell>{order.type}</TableCell>
                <TableCell>
                  <div className="font-medium">{order.customer}</div>
                  {order.table !== '-' && <div className="text-xs text-muted-foreground">Table {order.table}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                    order.status === 'preparing' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }>
                    {order.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
