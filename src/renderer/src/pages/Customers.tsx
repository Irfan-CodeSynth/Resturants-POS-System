import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash, Users as UsersIcon, Phone, Mail, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await window.api.customers?.list?.() || { success: true, data: [] }
      if (res.success) setCustomers(res.data?.customers || [])
    } catch (error) {
      toast.error('Failed to load customers')
    }
    setLoading(false)
  }

  const onSubmit = async (data: CustomerFormData) => {
    const actor = useAuthStore.getState().user
    try {
      const res = editingCustomer 
        ? await window.api.customers.update(editingCustomer.id, data, actor?.id, actor?.name)
        : await window.api.customers.create(data, actor?.id, actor?.name)

      if (res.success) {
        toast.success(editingCustomer ? 'Customer updated' : 'Customer created')
        setIsDialogOpen(false)
        loadData()
      } else {
        toast.error(res.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    const actor = useAuthStore.getState().user
    const res = await window.api.customers.delete(id, actor?.id, actor?.name)
    if (res.success) {
      toast.success('Customer deleted')
      loadData()
    } else {
      toast.error(res.error || 'Delete failed')
    }
  }

  const openAddDialog = () => {
    setEditingCustomer(null)
    reset({ name: '', phone: '', email: '', address: '', notes: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer)
    reset(customer)
    setIsDialogOpen(true)
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <UsersIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No customers found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500 flex flex-col space-y-1">
                      {customer.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{customer.phone}</span>}
                      {customer.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{customer.email}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.order_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); openEditDialog(customer) }} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(customer.id) }} className="text-red-600 hover:text-red-900">
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" {...register('name')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="text" {...register('phone')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" {...register('email')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea {...register('address')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea {...register('notes')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
