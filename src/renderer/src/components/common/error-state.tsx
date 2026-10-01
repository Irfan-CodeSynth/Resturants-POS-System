import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] gap-4 text-center">
      <div className="p-4 bg-destructive/10 rounded-full text-destructive">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <div className="max-w-[300px]">
        <h3 className="font-semibold mb-1 text-foreground">Error</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}
