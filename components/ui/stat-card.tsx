import type React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  titleFilipino?: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
  variant?: "default" | "success" | "warning" | "danger"
}

export function StatCard({
  title,
  titleFilipino,
  value,
  description,
  icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  const variantClasses = {
    default: "",
    success: "border-l-4 border-l-green-500",
    warning: "border-l-4 border-l-yellow-500",
    danger: "border-l-4 border-l-red-500",
  }

  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground" title={titleFilipino}>
              {title}
            </p>
            <p className="text-2xl font-bold md:text-3xl">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
                {trend.isPositive ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
