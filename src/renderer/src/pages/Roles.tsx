import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Plus, Edit, Trash } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string())
})

type RoleFormData = z.infer<typeof roleSchema>

export default function Roles() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissionGroups, setPermissionGroups] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any | null>(null)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { permissions: [] }
  })

  const currentPermissions = watch('permissions') || []

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        window.api.roles.list(),
        window.api.roles.listPermissions()
      ])
      if (rolesRes.success) setRoles(rolesRes.data || [])
      if (permissionsRes.success) {
        const groups: Record<string, string[]> = {}
        for (const permission of permissionsRes.data || []) {
          ;(groups[permission.group] ??= []).push(permission.key)
        }
        setPermissionGroups(groups)
      }
      if (!rolesRes.success) toast.error(rolesRes.error || 'Failed to load roles')
    } catch (error) {
      toast.error('Failed to load roles')
    }
    setLoading(false)
  }

  const onSubmit = async (data: RoleFormData) => {
    const actor = useAuthStore.getState().user
    try {
      const res = editingRole 
        ? await window.api.roles.update(editingRole.id, data.name, data.description, data.permissions, actor?.id, actor?.name)
        : await window.api.roles.create(data.name, data.description, data.permissions, actor?.id, actor?.name)

      if (res?.success) {
        toast.success(editingRole ? 'Role updated' : 'Role created')
        setIsDialogOpen(false)
        loadData()
      } else {
        toast.error(res?.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return
    try {
      const actor = useAuthStore.getState().user
      const res = await window.api.roles.delete(id, actor?.id, actor?.name)
      if (res?.success) {
        toast.success('Role deleted')
        loadData()
      } else {
        toast.error(res?.error || 'Delete failed')
      }
    } catch(e) {
      toast.error('Error')
    }
  }

  const openAddDialog = () => {
    setEditingRole(null)
    reset({ name: '', description: '', permissions: [] })
    setIsDialogOpen(true)
  }

  const openEditDialog = async (role: any) => {
    if(role.is_system) {
      toast.error("System roles cannot be edited")
      return
    }
    setEditingRole(role)
    let permissions: string[] = []
    try {
      const res = await window.api.roles.get(role.id)
      if (res?.success) permissions = res.data?.permissions || []
    } catch (error) {
      toast.error('Failed to load role permissions')
    }
    reset({ name: role.name, description: role.description || '', permissions })
    setIsDialogOpen(true)
  }

  const handleGroupToggle = (groupPerms: string[], checked: boolean) => {
    if (checked) {
      const newPerms = Array.from(new Set([...currentPermissions, ...groupPerms]))
      setValue('permissions', newPerms)
    } else {
      const newPerms = currentPermissions.filter(p => !groupPerms.includes(p))
      setValue('permissions', newPerms)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        </div>
        <button onClick={openAddDialog} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">Loading roles...</div>
        ) : roles.map(role => (
          <div key={role.id} className="bg-white p-5 rounded-xl shadow-sm border relative">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 flex items-center">
                {role.name}
                {!!role.is_system && <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full font-normal">System</span>}
              </h3>
              {!role.is_system && (
                <div className="flex space-x-1">
                  <button onClick={() => openEditDialog(role)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(role.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4 h-10">{role.description || 'No description provided.'}</p>
            <div className="border-t pt-3 flex justify-between items-center text-sm">
              <span className="text-gray-500">{role.permission_count || 0} permissions</span>
            </div>
          </div>
        ))}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Role Name</label>
                    <input type="text" {...register('name')} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea {...register('description')} rows={2} className="mt-1 block w-full border rounded-md shadow-sm p-2" />
                  </div>
                </div>

                <div>
                  <h3 className="font-bold border-b pb-2 mb-4">Permissions</h3>
                  <div className="space-y-6">
                    {Object.entries(permissionGroups).map(([group, perms]) => {
                      const allChecked = perms.every(p => currentPermissions.includes(p))
                      
                      return (
                        <div key={group} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">{group}</h4>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`group-${group}`}
                                checked={allChecked}
                                onChange={(e) => handleGroupToggle(perms, e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300" 
                              />
                              <label htmlFor={`group-${group}`} className="text-xs text-gray-500 cursor-pointer">Select All</label>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map(p => (
                              <div key={p} className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  id={`perm-${p}`}
                                  value={p}
                                  {...register('permissions')}
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300" 
                                />
                                <label htmlFor={`perm-${p}`} className="text-sm text-gray-700 cursor-pointer">{p.replaceAll('.', ' ')}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border rounded-md hover:bg-white bg-white shadow-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
