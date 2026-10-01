import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, User, KeyRound, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const pinSchema = z.object({
  pin: z.string().min(4, 'PIN must be at least 4 digits'),
})

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('password')
  const { login, loginPin } = useAuthStore()

  const passwordForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const pinForm = useForm({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: '' },
  })

  const onPasswordSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setLoading(true)
      const res = await login(data.username, data.password)
      if (res.success) {
        toast.success('Login successful')
        navigate('/')
      } else {
        toast.error(res.error || 'Invalid credentials')
      }
    } catch (error: any) {
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const onPinSubmit = async (data: z.infer<typeof pinSchema>) => {
    try {
      setLoading(true)
      const res = await loginPin(data.pin)
      if (res.success) {
        toast.success('Login successful')
        navigate('/')
      } else {
        toast.error(res.error || 'Invalid PIN')
      }
    } catch (error: any) {
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Restaurant POS</h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="pin">PIN Code</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTab === 'password' ? (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      className="border-slate-700 bg-slate-950 pl-9 text-white placeholder:text-slate-500"
                      {...passwordForm.register('username')}
                    />
                  </div>
                  {passwordForm.formState.errors.username && (
                    <p className="text-xs text-red-400">{passwordForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="border-slate-700 bg-slate-950 pl-9 text-white placeholder:text-slate-500"
                      {...passwordForm.register('password')}
                    />
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-red-400">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="mt-6 w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-slate-300">Enter PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="••••"
                    className="border-slate-700 bg-slate-950 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-500"
                    maxLength={8}
                    {...pinForm.register('pin')}
                  />
                  {pinForm.formState.errors.pin && (
                    <p className="text-xs text-center text-red-400">{pinForm.formState.errors.pin.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((btn, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      className="h-14 border-slate-700 bg-slate-800 text-lg hover:bg-slate-700 hover:text-white"
                      onClick={() => {
                        if (btn === 'C') pinForm.setValue('pin', '')
                        else if (btn === 'DEL') {
                          const current = pinForm.getValues('pin')
                          pinForm.setValue('pin', current.slice(0, -1))
                        }
                        else {
                          const current = pinForm.getValues('pin')
                          if (current.length < 8) pinForm.setValue('pin', current + btn)
                        }
                      }}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
                <Button type="submit" className="mt-4 w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Unlock with PIN'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
