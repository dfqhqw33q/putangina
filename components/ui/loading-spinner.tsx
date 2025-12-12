import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-primary border-t-transparent", sizeClasses[size])} />
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  messageFilipino?: string
}

export function PageLoading({ message = "Loading...", messageFilipino = "Naglo-load..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">{messageFilipino}</p>
      </div>
    </div>
  )
}
