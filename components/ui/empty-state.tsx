"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  titleFilipino?: string
  description?: string
  descriptionFilipino?: string
  action?: {
    label: string
    labelFilipino?: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  titleFilipino,
  description,
  descriptionFilipino,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {titleFilipino && <p className="text-sm text-muted-foreground">{titleFilipino}</p>}
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
          {descriptionFilipino && (
            <>
              <br />
              <span className="text-xs">{descriptionFilipino}</span>
            </>
          )}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4" title={action.labelFilipino}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
