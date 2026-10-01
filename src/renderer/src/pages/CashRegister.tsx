import { useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Unlock, Lock } from 'lucide-react'

export default function CashRegister() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Monitor className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Cash Register</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-10 text-center flex flex-col items-center justify-center">
        {isOpen ? (
          <>
            <Unlock className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Register is OPEN</h2>
            <p className="text-gray-500 mb-6">Current session started by Admin at {new Date().toLocaleTimeString()}</p>
            <button onClick={() => setIsOpen(false)} className="px-6 py-3 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 font-medium">
              Close Register
            </button>
          </>
        ) : (
          <>
            <Lock className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Register is CLOSED</h2>
            <p className="text-gray-500 mb-6">You must open the register to process cash transactions.</p>
            <div className="w-full max-w-sm flex space-x-3">
              <input type="number" placeholder="Opening Amount" className="flex-1 border rounded-md px-4 py-2" />
              <button onClick={() => setIsOpen(true)} className="px-6 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 font-medium whitespace-nowrap">
                Open Register
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
