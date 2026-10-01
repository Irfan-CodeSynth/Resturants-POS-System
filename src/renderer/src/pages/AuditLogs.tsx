import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert, History, User } from 'lucide-react'
import { toast } from 'sonner'

// Actions are stored per-verb ('CREATE', 'create_order', 'delete_role'), so tone keys off the verb.
function actionTone(action: string): string {
  const verb = (action || '').toLowerCase()
  if (verb === 'create' || verb.startsWith('create_')) return 'bg-green-100 text-green-700'
  if (verb === 'update' || verb.startsWith('update_')) return 'bg-blue-100 text-blue-700'
  if (verb === 'delete' || verb.startsWith('delete_')) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const res = await window.api.audit.list()
      if (res.success) {
        setLogs(res.data?.logs || [])
      }
    } catch (e) {
      toast.error('Failed to load audit logs')
    }
    setLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <History className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">Read-only system logs for tracking user actions and changes.</div>
          <button className="px-3 py-1.5 text-sm border bg-white rounded hover:bg-gray-50">Export Logs</button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No logs found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{log.user_name || 'System'}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${actionTone(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{log.entity}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  )
}
