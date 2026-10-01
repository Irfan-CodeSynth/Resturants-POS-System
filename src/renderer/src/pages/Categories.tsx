import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash, GripVertical, Image as ImageIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Category } from '../../../shared/types'
import { useAuthStore } from '@/stores/auth-store'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  sort_order: z.number().int(),
  is_active: z.boolean()
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      is_active: true,
      sort_order: 0
    }
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await window.api.categories.list()
      if (res.success) setCategories(res.data || [])
    } catch (error) {
      toast.error('Failed to load categories')
    }
    setLoading(false)
  }

  const onSubmit = async (data: CategoryFormData) => {
    const actor = useAuthStore.getState().user
    try {
      const res = editingCategory 
        ? await window.api.categories.update(editingCategory.id, data, actor?.id, actor?.name)
        : await window.api.categories.create(data, actor?.id, actor?.name)

      if (res.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
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
    if (!confirm('Are you sure you want to delete this category?')) return
    const actor = useAuthStore.getState().user
    const res = await window.api.categories.delete(id, actor?.id, actor?.name)
    if (res.success) {
      toast.success('Category deleted')
      loadData()
    } else {
      toast.error(res.error || 'Delete failed. Ensure no products are linked.')
    }
  }

  const openAddDialog = () => {
    setEditingCategory(null)
    reset({ name: '', description: '', icon: '', sort_order: categories.length, is_active: true })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    reset({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0,
      is_active: Boolean(category.is_active)
    })
    setIsDialogOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <div key={category.id} className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">{category.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditDialog(category)} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" {...register('name')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea {...register('description')} rows={3} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_active" {...register('is_active')} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
