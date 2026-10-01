import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth-store'
import { useAppStore } from './stores/app-store'
import MainLayout from './components/layout/main-layout'
import POSLayout from './components/layout/pos-layout'
import LoadingState from './components/common/loading-state'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const POS = lazy(() => import('./pages/POS'))
const Tables = lazy(() => import('./pages/Tables'))
const Kitchen = lazy(() => import('./pages/Kitchen'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const Modifiers = lazy(() => import('./pages/Modifiers'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Recipes = lazy(() => import('./pages/Recipes'))
const Purchases = lazy(() => import('./pages/Purchases'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Wastage = lazy(() => import('./pages/Wastage'))
const Customers = lazy(() => import('./pages/Customers'))
const Staff = lazy(() => import('./pages/Staff'))
const Roles = lazy(() => import('./pages/Roles'))
const Expenses = lazy(() => import('./pages/Expenses'))
const CashRegister = lazy(() => import('./pages/CashRegister'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const BackupRestore = lazy(() => import('./pages/BackupRestore'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const LockScreen = lazy(() => import('./pages/LockScreen'))
const SetupWizard = lazy(() => import('./pages/SetupWizard'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSetupComplete } = useAuthStore()

  if (!isSetupComplete) {
    return <Navigate to="/setup" replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { checkSetup } = useAuthStore()
  const { loadRestaurant } = useAppStore()

  useEffect(() => {
    checkSetup()
    loadRestaurant()
  }, [])

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Suspense fallback={<LoadingState message="Loading..." />}>
        <Routes>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/lock" element={<LockScreen />} />
          
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSLayout>
                  <POS />
                </POSLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tables" element={<Tables />} />
            <Route path="kitchen" element={<Kitchen />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="modifiers" element={<Modifiers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="wastage" element={<Wastage />} />
            <Route path="customers" element={<Customers />} />
            <Route path="staff" element={<Staff />} />
            <Route path="roles" element={<Roles />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="cash-register" element={<CashRegister />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="backup" element={<BackupRestore />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
