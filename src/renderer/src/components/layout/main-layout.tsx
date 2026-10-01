import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, 
  Package, Tags, Layers, FileText, ShoppingBag, Truck, Trash2, 
  Users, UserCog, Shield, Receipt, MonitorSpeaker, PieChart, 
  Settings, Database, ScrollText, Search, Bell, Menu, LogOut, Lock
} from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { useAuthStore } from '../../stores/auth-store'
import { cn } from '@/lib/utils'

const sidebarNavItems = [
  {
    section: 'Main',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'POS', href: '/pos', icon: MonitorSpeaker },
    ]
  },
  {
    section: 'Operations',
    items: [
      { title: 'Tables', href: '/tables', icon: UtensilsCrossed },
      { title: 'Kitchen', href: '/kitchen', icon: ChefHat },
      { title: 'Orders', href: '/orders', icon: ShoppingCart },
    ]
  },
  {
    section: 'Menu & Inventory',
    items: [
      { title: 'Products', href: '/products', icon: Package },
      { title: 'Categories', href: '/categories', icon: Tags },
      { title: 'Modifiers', href: '/modifiers', icon: Layers },
      { title: 'Inventory', href: '/inventory', icon: Database },
      { title: 'Recipes', href: '/recipes', icon: FileText },
      { title: 'Purchases', href: '/purchases', icon: ShoppingBag },
      { title: 'Suppliers', href: '/suppliers', icon: Truck },
      { title: 'Wastage', href: '/wastage', icon: Trash2 },
    ]
  },
  {
    section: 'Management',
    items: [
      { title: 'Customers', href: '/customers', icon: Users },
      { title: 'Staff', href: '/staff', icon: UserCog },
      { title: 'Roles', href: '/roles', icon: Shield },
      { title: 'Expenses', href: '/expenses', icon: Receipt },
      { title: 'Cash Register', href: '/cash-register', icon: MonitorSpeaker },
    ]
  },
  {
    section: 'System',
    items: [
      { title: 'Reports', href: '/reports', icon: PieChart },
      { title: 'Settings', href: '/settings', icon: Settings },
      { title: 'Backup', href: '/backup', icon: Database },
      { title: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ]
  }
]

export default function MainLayout() {
  const { sidebarCollapsed, toggleSidebar, restaurantInfo } = useAppStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleLock = () => {
    navigate('/lock')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? '80px' : '260px' }}
        className="flex flex-col border-r bg-card h-full transition-all duration-300"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!sidebarCollapsed && (
            <span className="font-semibold text-lg truncate">
              {restaurantInfo?.name || 'Restaurant POS'}
            </span>
          )}
          <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-muted ml-auto">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {sidebarNavItems.map((section, idx) => (
            <div key={idx} className="mb-6 px-3">
              {!sidebarCollapsed && (
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                      )
                    }
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.roleName}</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mx-auto">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-muted border-none rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <button onClick={handleLock} className="p-2 hover:bg-muted rounded-full" title="Lock Screen">
              <Lock className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-full text-destructive" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/20 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
