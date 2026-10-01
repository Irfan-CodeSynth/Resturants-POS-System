import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash, Truck, Phone, Mail, Building } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

const supplierSchema = z.object({
  name: z.string().min(1, 'Contact Name is required'),
  company: z.string().min(1, 'Company name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional()
})

type SupplierFormData = z.infer<typeof supplierSchema>

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema)
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await window.api.suppliers?.list?.() || { success: true, data: [] }
      if (res.success) setSuppliers(res.data?.data || [])
    } catch (error) {
      toast.error('Failed to load suppliers')
    }
    setLoading(false)
  }

  const onSubmit = async (data: SupplierFormData) => {
    const actor = useAuthStore.getState().user
    try {
      const res = editingSupplier 
        ? await window.api.suppliers.update(editingSupplier.id, data, actor?.id, actor?.name)
        : await window.api.suppliers.create(data, actor?.id, actor?.name)

      if (res.success) {
        toast.success(editingSupplier ? 'Supplier updated' : 'Supplier created')
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
    if (!confirm('Are you sure you want to delete this supplier?')) return
    const actor = useAuthStore.getState().user
    const res = await window.api.suppliers.delete(id, actor?.id, actor?.name)
    if (res.success) {
      toast.success('Supplier deleted')
      loadData()
    } else {
      toast.error(res.error || 'Delete failed')
    }
  }

  const openAddDialog = () => {
    setEditingSupplier(null)
    reset({ name: '', company: '', phone: '', email: '', address: '', tax_id: '', notes: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (supplier: any) => {
    setEditingSupplier(supplier)
    reset(supplier)
    setIsDialogOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
        </div>
        <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No suppliers found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{supplier.company}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{supplier.name}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      {supplier.phone && <span className="flex items-center mr-3"><Phone className="w-3 h-3 mr-1" />{supplier.phone}</span>}
                      {supplier.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{supplier.email}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.purchase_count || 0} orders
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditDialog(supplier)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900">
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
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input type="text" {...register('company')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Person Name</label>
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
                  <label className="block text-sm font-medium text-gray-700">Tax ID / VAT</label>
                  <input type="text" {...register('tax_id')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea {...register('address')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea {...register('notes')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-md hover:bg-white bg-white shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
