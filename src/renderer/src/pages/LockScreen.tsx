import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'

export default function LockScreen() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    setLoading(true)
    try {
      const res = await window.api.auth.loginPin(pin)
      if (res.success && res.data.id === user?.id) {
        toast.success('Unlocked')
        navigate(-1)
      } else {
        toast.error('Invalid PIN')
        setPin('')
      }
    } catch (err) {
      toast.error('Error unlocking')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchUser = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800 text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border-4 border-slate-950 shadow-inner">
          <User className="h-10 w-10 text-slate-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-white">{user?.name || 'Locked'}</h2>
        <p className="mb-6 text-sm text-slate-400">Enter PIN to unlock</p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <Input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="border-slate-700 bg-slate-950 text-center text-3xl tracking-[0.5em] text-white py-6"
            placeholder="••••"
            maxLength={8}
            autoFocus
          />
          
          <Button type="submit" className="w-full py-6 text-lg" disabled={loading || !pin}>
            <Lock className="mr-2 h-5 w-5" />
            Unlock
          </Button>
        </form>

        <Button variant="link" onClick={handleSwitchUser} className="mt-4 text-slate-400">
          Switch User <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}
