import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  titleFilipino?: string
  description?: string
  descriptionFilipino?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  titleFilipino,
  description,
  descriptionFilipino,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {titleFilipino && <p className="text-sm text-muted-foreground">{titleFilipino}</p>}
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
            {descriptionFilipino && <span className="hidden md:inline"> / {descriptionFilipino}</span>}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
