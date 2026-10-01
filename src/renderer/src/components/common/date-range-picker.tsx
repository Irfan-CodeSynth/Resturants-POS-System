import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  onRangeChange: (startDate: Date, endDate: Date) => void
  className?: string
}

export default function DateRangePicker({ onRangeChange, className }: DateRangePickerProps) {
  const [preset, setPreset] = useState('today')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPreset(val)
    
    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch(val) {
      case 'today':
        break
      case 'yesterday':
        start.setDate(today.getDate() - 1)
        end.setDate(today.getDate() - 1)
        break
      case 'this_week':
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        start = new Date(today.setDate(diff))
        end = new Date()
        break
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date()
        break
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
    }

    if (val !== 'custom') {
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]
      setStartDate(startStr)
      setEndDate(endStr)
      onRangeChange(start, end)
    }
  }

  const handleCustomDateChange = () => {
    setPreset('custom')
    onRangeChange(new Date(startDate), new Date(endDate))
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1.5 shadow-sm">
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <select 
          value={preset} 
          onChange={handlePresetChange}
          className="bg-transparent border-none text-sm outline-none cursor-pointer pr-4"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {(preset === 'custom' || true) && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (preset === 'custom') onRangeChange(new Date(e.target.value), new Date(endDate))
            }}
            className="border rounded-md px-2 py-1.5 text-sm bg-background shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              if (preset === 'custom') onRangeChange(new Date(startDate), new Date(e.target.value))
            }}
            className="border rounded-md px-2 py-1.5 text-sm bg-background shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  )
}
