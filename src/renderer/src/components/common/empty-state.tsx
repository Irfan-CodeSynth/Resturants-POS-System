import { ReactNode } from 'react'
import { Search } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ 
  icon = <Search className="w-10 h-10" />, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] gap-4 p-8 text-center border-2 border-dashed rounded-xl border-border bg-card/50">
      <div className="p-4 bg-muted rounded-full text-muted-foreground">
        {icon}
      </div>
      <div className="max-w-[400px]">
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
