import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Download, Upload, AlertTriangle, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

export default function BackupRestore() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleCreateBackup = async () => {
    setLoading(true)
    toast.info("Creating backup...")
    try {
      const res = await window.api.backup?.create?.()
      if (res?.success) {
        toast.success("Backup created successfully")
        // reload backups list
      } else {
        toast.error("Failed to create backup")
      }
    } catch (e) {
      toast.error("Error creating backup")
    }
    setLoading(false)
  }

  const handleRestore = async () => {
    if(!confirm("WARNING: Restoring a backup will overwrite all current data. Are you sure you want to proceed?")) return
    toast.info("Restoring data...")
    // Restore logic
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Database className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Backup & Restore</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center space-x-2 text-lg font-bold border-b pb-3">
            <Download className="w-5 h-5 text-green-600" />
            <h2>Create Backup</h2>
          </div>
          <p className="text-sm text-gray-500">Create a secure copy of all your database records, settings, and configurations.</p>
          <div className="pt-2">
            <button onClick={handleCreateBackup} disabled={loading} className="w-full flex justify-center items-center px-4 py-3 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50 font-medium">
              <Download className="w-4 h-4 mr-2" /> Generate New Backup Now
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4 border-red-200">
          <div className="flex items-center space-x-2 text-lg font-bold border-b border-red-100 pb-3 text-red-700">
            <Upload className="w-5 h-5" />
            <h2>Restore Data</h2>
          </div>
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span>Restoring will overwrite all current system data. This action cannot be undone. Always create a backup before restoring.</span>
          </div>
          <div className="pt-2">
            <button onClick={handleRestore} disabled={loading} className="w-full flex justify-center items-center px-4 py-3 border border-red-300 text-red-700 bg-white rounded-md shadow-sm hover:bg-red-50 disabled:opacity-50 font-medium">
              <Upload className="w-4 h-4 mr-2" /> Select Backup File to Restore
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border mt-8">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold">Recent Backups</h3>
          <button className="text-gray-500 hover:text-blue-600 flex items-center text-sm">
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
        <div className="p-10 text-center text-gray-500">
          <Database className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p>No automatic or manual backups found.</p>
        </div>
      </div>
    </motion.div>
  )
}
