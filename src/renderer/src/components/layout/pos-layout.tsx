import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Utensils, ShoppingBag, Car } from 'lucide-react'
import { useAuthStore } from '../../stores/auth-store'
import { usePosStore } from '../../stores/pos-store'
import { cn } from '@/lib/utils'

interface POSLayoutProps {
  children: ReactNode
}

export default function POSLayout({ children }: POSLayoutProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { orderType, setOrderType, currentOrder } = usePosStore()

  const orderTypes = [
    { id: 'dine_in', label: 'Dine In', icon: Utensils },
    { id: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
    { id: 'delivery', label: 'Delivery', icon: Car },
  ] as const

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Slim Top Bar */}
      <header className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Order Type Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {orderTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                  orderType === type.id 
                    ? "bg-background shadow-sm text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">User:</span>
            <span>{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main POS Content (Children) */}
      <main className="flex-1 overflow-hidden flex">
        {children}
      </main>
    </div>
  )
}
