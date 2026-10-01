import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, RefreshCcw, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Mock order data
  const order = {
    id: id || '1001',
    status: 'completed',
    type: 'Dine In',
    table: '4',
    customer: 'John Doe',
    cashier: 'Admin User',
    date: '2023-10-27 14:30',
    items: [
      { name: 'Classic Burger', qty: 2, price: 500, total: 1000 },
      { name: 'Fries', qty: 1, price: 200, total: 200 },
      { name: 'Cola', qty: 2, price: 150, total: 300 },
    ],
    subtotal: 1500,
    tax: 240,
    total: 1740,
    payments: [
      { method: 'Card', amount: 1740, time: '15:00' }
    ]
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Order #{order.id}</h2>
          <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">{order.status.toUpperCase()}</Badge>
          <div className="flex-1" />
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Receipt</Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"><Ban className="mr-2 h-4 w-4" /> Cancel</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-slate-500">{formatCurrency(item.price)} x {item.qty}</div>
                    </div>
                    <div className="font-bold">{formatCurrency(item.total)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-2 pt-4 border-t w-64 ml-auto">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium">{order.type}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Table</span>
                  <span className="font-medium">{order.table}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium">{order.customer}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Cashier</span>
                  <span className="font-medium">{order.cashier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium">{order.date}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {order.payments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-2 text-sm border-b last:border-0">
                    <div>
                      <div className="font-medium">{p.method}</div>
                      <div className="text-xs text-slate-500">{p.time}</div>
                    </div>
                    <div className="font-semibold text-green-600">{formatCurrency(p.amount)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
