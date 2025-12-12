"use client"

import { StatCard } from "@/components/ui/stat-card"
import { Building2, Users, CreditCard } from "lucide-react"

interface LandlordStatsProps {
  propertiesCount: number
  unitsCount: number
  tenantsCount: number
  pendingPaymentsCount: number
}

export function LandlordStats({ propertiesCount, unitsCount, tenantsCount, pendingPaymentsCount }: LandlordStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Properties"
        value={propertiesCount}
        icon={<Building2 className="h-5 w-5" />}
        href="/landlord/properties"
      />
      <StatCard
        title="Units"
        value={unitsCount}
        icon={<Building2 className="h-5 w-5" />}
        href="/landlord/properties"
      />
      <StatCard
        title="Active Tenants"
        value={tenantsCount}
        icon={<Users className="h-5 w-5" />}
        href="/landlord/tenants"
      />
      <StatCard
        title="Pending Payments"
        value={pendingPaymentsCount}
        icon={<CreditCard className="h-5 w-5" />}
        variant="warning"
        href="/landlord/payments"
      />
    </div>
  )
}
