import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: number
  trendLabel?: string
  className?: string
  delay?: number
}

export default function StatsCard({ 
  title, value, icon, trend, trendLabel, className, delay = 0 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm p-6", className)}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
        
        {trend !== undefined && (
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-full",
            trend > 0 ? "text-emerald-700 bg-emerald-100/50 dark:text-emerald-400 dark:bg-emerald-950/50" : 
            trend < 0 ? "text-rose-700 bg-rose-100/50 dark:text-rose-400 dark:bg-rose-950/50" : 
            "text-muted-foreground bg-muted"
          )}>
            {trend > 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : trend < 0 ? <ArrowDownIcon className="w-3 h-3 mr-1" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {trendLabel && (
        <p className="text-xs text-muted-foreground mt-2">{trendLabel}</p>
      )}
    </motion.div>
  )
}
