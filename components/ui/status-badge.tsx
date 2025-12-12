import { cn } from "@/lib/utils"
import { BILL_STATUS, type BillStatus } from "@/lib/constants/status"
import { PAYMENT_STATUS, type PaymentStatus } from "@/lib/constants/status"
import { MAINTENANCE_STATUS, type MaintenanceStatus } from "@/lib/constants/status"
import { OCCUPANCY_STATUS, type OccupancyStatus } from "@/lib/constants/status"

interface StatusBadgeProps {
  status: string
  type: "bill" | "payment" | "maintenance" | "occupancy"
  showFilipino?: boolean
  className?: string
}

export function StatusBadge({ status, type, showFilipino = true, className }: StatusBadgeProps) {
  let config: { label: string; labelFilipino: string; color: string } | undefined

  switch (type) {
    case "bill":
      config = BILL_STATUS[status as BillStatus]
      break
    case "payment":
      config = PAYMENT_STATUS[status as PaymentStatus]
      break
    case "maintenance":
      config = MAINTENANCE_STATUS[status as MaintenanceStatus]
      break
    case "occupancy":
      config = OCCUPANCY_STATUS[status as OccupancyStatus]
      break
  }

  if (!config) {
    return (
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
        {status}
      </span>
    )
  }

  const colorClasses = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[config.color as keyof typeof colorClasses] || colorClasses.gray,
        className,
      )}
      title={showFilipino ? config.labelFilipino : undefined}
    >
      {config.label}
      {showFilipino && <span className="hidden text-[10px] opacity-70 sm:inline">/ {config.labelFilipino}</span>}
    </span>
  )
}
