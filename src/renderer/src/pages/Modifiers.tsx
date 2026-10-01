import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash, LayoutList, PlusCircle, MinusCircle } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

const modifierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price_adjustment: z.number().default(0),
  is_default: z.boolean().default(false)
})

const modifierGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  is_required: z.boolean().default(false),
  min_selections: z.number().min(0).default(0),
  max_selections: z.number().min(0).default(1),
  modifiers: z.array(modifierSchema).min(1, 'At least one modifier is required')
})

type ModifierGroupFormData = z.infer<typeof modifierGroupSchema>

export default function Modifiers() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ModifierGroupFormData>({
    resolver: zodResolver(modifierGroupSchema),
    defaultValues: {
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      modifiers: [{ name: '', price_adjustment: 0, is_default: false }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'modifiers'
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await window.api.modifiers?.listGroups?.() || { success: true, data: [] }
      if (res.success) setGroups(res.data || [])
    } catch (error) {
      toast.error('Failed to load modifiers')
    }
    setLoading(false)
  }

  const onSubmit = async (data: ModifierGroupFormData) => {
    const actor = useAuthStore.getState().user
    try {
      const res = editingGroup 
        ? await window.api.modifiers.updateGroup(editingGroup.id, data, actor?.id, actor?.name)
        : await window.api.modifiers.createGroup(data, actor?.id, actor?.name)

      if (res.success) {
        toast.success(editingGroup ? 'Modifier group updated' : 'Modifier group created')
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
    if (!confirm('Are you sure you want to delete this modifier group?')) return
    const actor = useAuthStore.getState().user
    const res = await window.api.modifiers.deleteGroup(id, actor?.id, actor?.name)
    if (res.success) {
      toast.success('Group deleted')
      loadData()
    } else {
      toast.error(res.error || 'Delete failed')
    }
  }

  const openAddDialog = () => {
    setEditingGroup(null)
    reset({
      name: '',
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      modifiers: [{ name: '', price_adjustment: 0, is_default: false }]
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (group: any) => {
    setEditingGroup(group)
    reset({
      name: group.name,
      is_required: Boolean(group.is_required),
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      modifiers: group.modifiers?.length ? group.modifiers.map((m: any) => ({ ...m, is_default: Boolean(m.is_default) })) : [{ name: '', price_adjustment: 0, is_default: false }]
    })
    setIsDialogOpen(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Modifier Groups</h1>
        <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Modifier Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading modifiers...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
          <LayoutList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No modifier groups yet</h3>
          <p className="mt-1">Add modifiers like 'Size', 'Toppings', or 'Spice Level'.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    {group.is_required ? 'Required' : 'Optional'} &bull; Min: {group.min_selections} &bull; Max: {group.max_selections}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openEditDialog(group)} className="p-2 text-gray-500 hover:text-blue-600 rounded bg-white border">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(group.id)} className="p-2 text-gray-500 hover:text-red-600 rounded bg-white border">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-gray-100">
                {group.modifiers?.map((mod: any, idx: number) => (
                  <li key={idx} className="p-3 px-4 flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="font-medium">{mod.name}</span>
                      {mod.is_default ? <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Default</span> : null}
                    </span>
                    <span className="text-sm text-gray-500">
                      {mod.price_adjustment > 0 ? '+' : ''}Rs. {mod.price_adjustment.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingGroup ? 'Edit Modifier Group' : 'Add Modifier Group'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                    <input type="text" {...register('name')} placeholder="e.g. Size, Milk Type" className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <input type="checkbox" id="is_required" {...register('is_required')} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                    <label htmlFor="is_required" className="text-sm text-gray-900 font-medium">Customer must select an option</label>
                  </div>
                  
                  <div></div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min Selections</label>
                    <input type="number" min="0" {...register('min_selections', { valueAsNumber: true })} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Selections</label>
                    <input type="number" min="1" {...register('max_selections', { valueAsNumber: true })} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-semibold">Options (Modifiers)</h3>
                    <button type="button" onClick={() => append({ name: '', price_adjustment: 0, is_default: false })} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                      <PlusCircle className="w-4 h-4 mr-1" /> Add Option
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border">
                        <div className="flex-1">
                          <input type="text" {...register(`modifiers.${index}.name`)} placeholder="Name (e.g. Large, Almond Milk)" className="block w-full border rounded-md shadow-sm p-2" />
                          {errors.modifiers?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.modifiers[index]?.name?.message}</p>}
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">Rs.</span>
                            <input type="number" step="0.01" {...register(`modifiers.${index}.price_adjustment`, { valueAsNumber: true })} className="block w-full border rounded-md shadow-sm p-2 pl-8" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 w-24">
                          <input type="checkbox" id={`def-${index}`} {...register(`modifiers.${index}.is_default`)} className="h-4 w-4" />
                          <label htmlFor={`def-${index}`} className="text-sm">Default</label>
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={fields.length === 1}>
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-md hover:bg-white bg-white shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">Save Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
