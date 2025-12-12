import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/utils/format"
import { Building2, Users, Receipt, CreditCard } from "lucide-react"
import Link from "next/link"

async function getLandlordStats(supabase: any, workspaceId: string) {
  const [
    { count: propertiesCount },
    { count: unitsCount },
    { count: tenantsCount },
    { data: pendingPayments },
    { data: recentBills },
    { data: maintenanceRequests },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("units").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("tenant_accounts")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
    supabase
      .from("payments")
      .select("*, tenant_accounts(full_name)")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .limit(5),
    supabase
      .from("bills")
      .select("*, tenant_accounts(full_name)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("maintenance_requests")
      .select("*, tenant_accounts(full_name), units(unit_number)")
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "in_progress"])
      .limit(5),
  ])

  return {
    propertiesCount: propertiesCount || 0,
    unitsCount: unitsCount || 0,
    tenantsCount: tenantsCount || 0,
    pendingPayments: pendingPayments || [],
    recentBills: recentBills || [],
    maintenanceRequests: maintenanceRequests || [],
  }
}

export default async function LandlordDashboard() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_members(workspace_id)")
    .eq("id", user?.id)
    .single()

  const workspaceId = profile?.workspace_members?.[0]?.workspace_id

  if (!workspaceId) {
    return <div>No workspace found</div>
  }

  const stats = await getLandlordStats(supabase, workspaceId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview ng iyong rental properties"
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/landlord/billing/generate">
                <Receipt className="mr-2 h-4 w-4" />
                Generate Bills
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Properties"
          titleFil="Mga Ari-arian"
          value={stats.propertiesCount}
          icon={Building2}
          href="/landlord/properties"
        />
        <StatCard
          title="Units"
          titleFil="Mga Unit"
          value={stats.unitsCount}
          icon={Building2}
          href="/landlord/properties"
        />
        <StatCard
          title="Active Tenants"
          titleFil="Aktibong Nangungupahan"
          value={stats.tenantsCount}
          icon={Users}
          href="/landlord/tenants"
        />
        <StatCard
          title="Pending Payments"
          titleFil="Naghihintay na Bayad"
          value={stats.pendingPayments.length}
          icon={CreditCard}
          variant={stats.pendingPayments.length > 0 ? "warning" : "default"}
          href="/landlord/payments?status=pending"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landlord/payments?status=pending">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.pendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Walang naghihintay na bayad</p>
            ) : (
              <div className="space-y-3">
                {stats.pendingPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{payment.tenant_accounts?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(payment.amount)}</p>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Maintenance Requests</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landlord/maintenance">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.maintenanceRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Walang pending na maintenance request</p>
            ) : (
              <div className="space-y-3">
                {stats.maintenanceRequests.map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.tenant_accounts?.full_name} - Unit {request.units?.unit_number}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bills</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landlord/billing">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Walang recent bills</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Tenant</th>
                      <th className="text-left py-2 font-medium hidden sm:table-cell">Period</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                      <th className="text-right py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentBills.map((bill: any) => (
                      <tr key={bill.id} className="border-b last:border-0">
                        <td className="py-3">{bill.tenant_accounts?.full_name}</td>
                        <td className="py-3 hidden sm:table-cell">{bill.billing_period}</td>
                        <td className="py-3 text-right">{formatCurrency(bill.total_amount)}</td>
                        <td className="py-3 text-right">
                          <StatusBadge status={bill.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
