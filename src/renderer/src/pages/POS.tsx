import { useState, useEffect, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Utensils, ShoppingBag, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function POS() {
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderType, setOrderType] = useState('dine_in')
  const [barcodeBuffer, setBarcodeBuffer] = useState('')

  // Modals state
  const [showPayment, setShowPayment] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showCustomer, setShowCustomer] = useState(false)

  useEffect(() => {
    // Mock load
    setCategories([{ id: 'c1', name: 'Burgers' }, { id: 'c2', name: 'Drinks' }])
    setProducts([
      { id: 'p1', categoryId: 'c1', name: 'Classic Burger', price: 500, stock: 10 },
      { id: 'p2', categoryId: 'c2', name: 'Cola', price: 100, stock: 50 }
    ])
  }, [])

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      if (barcodeBuffer) {
        // handle barcode
        toast.info(`Scanned: ${barcodeBuffer}`)
        setBarcodeBuffer('')
      }
    } else {
      setBarcodeBuffer(prev => prev + e.key)
    }
  }

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [barcodeBuffer])

  const filteredProducts = products.filter(p => 
    (activeCategory === 'all' || p.categoryId === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: any) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.productId === id) {
        const newQty = Math.max(1, i.qty + delta)
        return { ...i, qty: newQty }
      }
      return i
    }))
  }

  const removeItem = (id: string) => {
    setOrderItems(prev => prev.filter(i => i.productId !== id))
  }

  const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const handlePay = () => {
    setShowPayment(false)
    toast.success('Payment processed successfully!')
    setOrderItems([])
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Categories */}
      <div className="w-24 border-r bg-white flex flex-col items-center py-4 space-y-4 overflow-y-auto">
        <Button 
          variant={activeCategory === 'all' ? 'default' : 'ghost'} 
          className="w-16 h-16 rounded-xl flex-col"
          onClick={() => setActiveCategory('all')}
        >
          <span className="text-xs mt-1">All</span>
        </Button>
        {categories.map(c => (
          <Button 
            key={c.id}
            variant={activeCategory === c.id ? 'default' : 'ghost'} 
            className="w-16 h-16 rounded-xl flex-col"
            onClick={() => setActiveCategory(c.id)}
          >
            <span className="text-xs mt-1 truncate w-14 text-center">{c.name}</span>
          </Button>
        ))}
      </div>

      {/* Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-white flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search products or scan barcode..." 
              className="pl-9 bg-slate-100 border-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredProducts.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow" onClick={() => addToCart(p)}>
                    <div className="h-32 bg-slate-200 flex items-center justify-center text-slate-400">
                      Image
                    </div>
                    <CardContent className="p-3">
                      <div className="font-semibold line-clamp-2">{p.name}</div>
                      <div className="text-primary font-bold mt-1">{formatCurrency(p.price)}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Order Panel */}
      <div className="w-96 border-l bg-white flex flex-col">
        <div className="p-4 border-b flex justify-between gap-2 bg-slate-50">
          <Button variant={orderType === 'dine_in' ? 'default' : 'outline'} className="flex-1" onClick={() => setOrderType('dine_in')}>
            <Utensils className="h-4 w-4 mr-2" /> Dine In
          </Button>
          <Button variant={orderType === 'takeaway' ? 'default' : 'outline'} className="flex-1" onClick={() => setOrderType('takeaway')}>
            <ShoppingBag className="h-4 w-4 mr-2" /> Takeaway
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orderItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {orderItems.map(item => (
                <motion.div key={item.productId} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex justify-between items-start border-b pb-3">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-slate-500">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center font-medium">{item.qty}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.productId)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="bg-slate-50 p-4 border-t space-y-2">
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm cursor-pointer hover:text-slate-700" onClick={() => setShowDiscount(true)}>
            <span>Discount</span>
            <span>{formatCurrency(0)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Tax (16%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="p-4 bg-white grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
            Hold Order
          </Button>
          <Button variant="outline" className="h-14 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => setShowCustomer(true)}>
            Customer
          </Button>
          <Button className="col-span-2 h-16 text-lg bg-green-600 hover:bg-green-700 text-white" disabled={orderItems.length === 0} onClick={() => setShowPayment(true)}>
            Pay {formatCurrency(total)}
          </Button>
        </div>
      </div>
      
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
             <div className="text-center p-6 bg-slate-50 rounded-xl">
               <div className="text-sm text-slate-500 mb-1">Total Due</div>
               <div className="text-4xl font-black">{formatCurrency(total)}</div>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <Button variant="outline" className="h-20 flex-col" onClick={handlePay}>
                 <Banknote className="h-6 w-6 mb-2" />
                 Cash
               </Button>
               <Button variant="outline" className="h-20 flex-col" onClick={handlePay}>
                 <CreditCard className="h-6 w-6 mb-2" />
                 Card
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShoppingCart(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
}
