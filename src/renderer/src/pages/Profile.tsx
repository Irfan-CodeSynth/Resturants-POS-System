import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, UserCircle, Key } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/stores/auth-store'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type PasswordForm = z.infer<typeof passwordSchema>

export default function Profile() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  })

  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user) {
      toast.error('You need to be signed in to change a password')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.auth.changePassword(user.id, data.currentPassword, data.newPassword)
      if (res?.success) {
        toast.success("Password updated successfully")
        reset()
      } else {
        toast.error(res?.error || "Failed to update password")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <UserCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-bold border-b pb-3 mb-4">Account Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" disabled value="Admin User" className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" disabled value="admin" className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input type="text" disabled value="Administrator" className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-gray-50 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 border-b pb-3 mb-4 text-lg font-bold">
          <Key className="w-5 h-5 text-gray-400" />
          <h2>Change Password</h2>
        </div>
        
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" {...register('currentPassword')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" {...register('newPassword')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" {...register('confirmPassword')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          
          <div className="pt-2">
            <button type="submit" disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" /> Update Password
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
