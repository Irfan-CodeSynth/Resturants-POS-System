import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Store, User, Printer, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const steps = [
  { id: 'restaurant', title: 'Restaurant Info', icon: Store },
  { id: 'admin', title: 'Admin Account', icon: User },
  { id: 'settings', title: 'Initial Settings', icon: Printer },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
]

const restaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  currency: z.string().min(1, 'Currency is required'),
  taxRate: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid tax rate'),
  receiptFooter: z.string().optional(),
})

const adminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const settingsSchema = z.object({
  printerName: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  orderType: z.string().min(1, 'Default order type is required'),
})

export default function SetupWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState<any>({})

  const restaurantForm = useForm({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { name: '', phone: '', address: '', currency: 'Rs.', taxRate: '0', receiptFooter: 'Thank you for your visit!' },
  })

  const adminForm = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: '', username: 'admin', password: '', confirmPassword: '' },
  })

  const settingsForm = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { printerName: '', timezone: 'Asia/Karachi', orderType: 'dine_in' },
  })

  const handleNext = async (data: any) => {
    const newData = { ...setupData, [steps[currentStep].id]: data }
    setSetupData(newData)
    
    if (currentStep === 2) {
      await submitSetup(newData)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const submitSetup = async (data: any) => {
    try {
      setLoading(true)
      const res = await window.api.setup.complete({
        restaurant: data.restaurant,
        admin: data.admin,
        settings: data.settings
      })
      if (res.success) {
        setCurrentStep(3)
      } else {
        toast.error(res.error || 'Failed to complete setup')
      }
    } catch (error) {
      toast.error('An error occurred during setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <h1 className="text-center text-3xl font-bold text-slate-900">Welcome to Restaurant POS</h1>
          <p className="text-center text-slate-500">Let's get your system set up</p>
        </div>

        <div className="mb-8 flex justify-between px-8 relative">
          <div className="absolute left-14 right-14 top-1/2 h-0.5 -translate-y-1/2 bg-slate-200" />
          <div className="absolute left-14 right-14 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-in-out" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
          
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isPast = index < currentStep
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isActive || isPast ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-200 bg-white text-slate-400'} transition-colors duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`mt-2 text-sm font-medium ${isActive || isPast ? 'text-primary' : 'text-slate-400'}`}>{step.title}</span>
              </div>
            )
          })}
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white p-1 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {currentStep === 0 && (
                <form id="step0" onSubmit={restaurantForm.handleSubmit(handleNext)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Restaurant Name</Label>
                      <Input {...restaurantForm.register('name')} placeholder="The Grand Cafe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input {...restaurantForm.register('phone')} placeholder="+92 300 1234567" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input {...restaurantForm.register('address')} placeholder="123 Main St, City" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency Symbol</Label>
                      <Input {...restaurantForm.register('currency')} placeholder="Rs." />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input {...restaurantForm.register('taxRate')} placeholder="16" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Receipt Footer</Label>
                      <Input {...restaurantForm.register('receiptFooter')} placeholder="Thank you for your visit!" />
                    </div>
                  </div>
                </form>
              )}

              {currentStep === 1 && (
                <form id="step1" onSubmit={adminForm.handleSubmit(handleNext)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input {...adminForm.register('name')} placeholder="Admin User" />
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input {...adminForm.register('username')} placeholder="admin" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" {...adminForm.register('password')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" {...adminForm.register('confirmPassword')} />
                    </div>
                  </div>
                </form>
              )}

              {currentStep === 2 && (
                <form id="step2" onSubmit={settingsForm.handleSubmit(handleNext)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Order Type</Label>
                      <Select onValueChange={(v) => settingsForm.setValue('orderType', v)} defaultValue="dine_in">
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dine_in">Dine-in</SelectItem>
                          <SelectItem value="takeaway">Takeaway</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Input {...settingsForm.register('timezone')} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Printer Name (Optional)</Label>
                      <Input {...settingsForm.register('printerName')} placeholder="e.g. EPSON TM-T88V" />
                      <p className="text-xs text-muted-foreground">Leave blank to configure later</p>
                    </div>
                  </div>
                </form>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h2 className="text-2xl font-bold">Setup Complete!</h2>
                  <p className="mt-2 text-slate-500">Your POS system is ready to use.</p>
                  <Button className="mt-8 px-8" size="lg" onClick={() => navigate('/login')}>
                    Go to Login <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {currentStep < 3 && (
            <div className="flex justify-between border-t border-slate-100 p-6 bg-slate-50">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={currentStep === 0 || loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button form={`step${currentStep}`} type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : currentStep === 2 ? 'Complete Setup' : 'Next Step'}
                {!loading && currentStep !== 2 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
