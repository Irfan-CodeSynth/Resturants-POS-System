import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash, Upload, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Product } from '../../../shared/types'
import { useAuthStore } from '@/stores/auth-store'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  selling_price: z.number().min(0, 'Price must be positive'),
  cost_price: z.number().min(0, 'Cost must be positive'),
  tax_rate: z.number().min(0, 'Tax rate must be positive'),
  track_stock: z.boolean(),
  is_active: z.boolean()
})

type ProductFormData = z.infer<typeof productSchema>

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      track_stock: true,
      is_active: true,
      selling_price: 0,
      cost_price: 0,
      tax_rate: 0
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        window.api.products.list(),
        window.api.categories.list()
      ])
      if (prodRes.success) setProducts(prodRes.data.data || [])
      if (catRes.success) setCategories(catRes.data || [])
    } catch (error) {
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const onSubmit = async (data: ProductFormData) => {
    const actor = useAuthStore.getState().user
    try {
      let res
      if (editingProduct) {
        res = await window.api.products.update(editingProduct.id, data, actor?.id, actor?.name)
      } else {
        res = await window.api.products.create(data, actor?.id, actor?.name)
      }

      if (res.success) {
        toast.success(editingProduct ? 'Product updated' : 'Product created')
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
    if (!confirm('Are you sure you want to delete this product?')) return
    const actor = useAuthStore.getState().user
    const res = await window.api.products.delete(id, actor?.id, actor?.name)
    if (res.success) {
      toast.success('Product deleted')
      loadData()
    } else {
      toast.error(res.error || 'Delete failed')
    }
  }

  const openAddDialog = () => {
    setEditingProduct(null)
    reset({
      track_stock: true,
      is_active: true,
      selling_price: 0,
      cost_price: 0,
      tax_rate: 0
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category_id: product.category_id,
      description: product.description,
      selling_price: product.selling_price,
      cost_price: product.cost_price,
      tax_rate: product.tax_rate,
      track_stock: Boolean(product.track_stock),
      is_active: Boolean(product.is_active)
    })
    setIsDialogOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-2">
          <button className="flex items-center px-4 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" /> Import
          </button>
          <button className="flex items-center px-4 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categories.find(c => c.id === product.category_id)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {product.selling_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditDialog(product)} className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Basic Dialog implementation without external dependencies for this quick example */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" {...register('name')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <input type="text" {...register('sku')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select {...register('category_id')} className="mt-1 block w-full border rounded-md shadow-sm p-2">
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (Rs.)</label>
                  <input type="number" step="0.01" {...register('selling_price', { valueAsNumber: true })} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                </div>
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
