import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Receipt, CreditCard, AlertCircle, Megaphone } from "lucide-react"
import Link from "next/link"

async function getTenantData(supabase: any, tenantId: string, workspaceId: string) {
  const [{ data: currentBill }, { data: recentPayments }, { data: announcements }, { data: pendingMaintenance }] =
    await Promise.all([
      supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("status", "verified")
        .order("payment_date", { ascending: false })
        .limit(3),
      supabase
        .from("announcements")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("maintenance_requests")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pending", "in_progress"]),
    ])

  return {
    currentBill,
    recentPayments: recentPayments || [],
    announcements: announcements || [],
    pendingMaintenanceCount: pendingMaintenance?.count || 0,
  }
}

export default async function TenantDashboard() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase
    .from("tenant_accounts")
    .select("*, tenant_bindings(workspace_id)")
    .eq("user_id", user?.id)
    .single()

  if (!tenantAccount) {
    return <div>Tenant account not found</div>
  }

  const workspaceId = tenantAccount.tenant_bindings?.[0]?.workspace_id
  const data = await getTenantData(supabase, tenantAccount.id, workspaceId)

  const hasUnpaidBill = data.currentBill && data.currentBill.balance > 0
  const isOverdue = data.currentBill && new Date(data.currentBill.due_date) < new Date() && data.currentBill.balance > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kumusta, ${tenantAccount.full_name?.split(" ")[0]}!`}
        description="Tingnan ang iyong bills, payments, at announcements"
      />

      {/* Alert for overdue bill */}
      {isOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800">May overdue bill ka!</p>
              <p className="text-sm text-red-600">
                {data.currentBill.billing_period} - {formatCurrency(data.currentBill.balance)} balance
              </p>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link href="/tenant/bills">View Bill</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Balance"
          titleFil="Kasalukuyang Balanse"
          value={formatCurrency(data.currentBill?.balance || 0)}
          icon={Receipt}
          variant={isOverdue ? "danger" : hasUnpaidBill ? "warning" : "success"}
          href="/tenant/bills"
        />
        <StatCard
          title="Due Date"
          titleFil="Takdang Petsa"
          value={data.currentBill ? formatDate(data.currentBill.due_date) : "N/A"}
          icon={Receipt}
          variant={isOverdue ? "danger" : "default"}
        />
        <StatCard
          title="Last Payment"
          titleFil="Huling Bayad"
          value={data.recentPayments[0] ? formatCurrency(data.recentPayments[0].amount) : "N/A"}
          icon={CreditCard}
          href="/tenant/payments"
        />
        <StatCard
          title="Pending Requests"
          titleFil="Naghihintay na Request"
          value={data.pendingMaintenanceCount}
          icon={AlertCircle}
          variant={data.pendingMaintenanceCount > 0 ? "warning" : "default"}
          href="/tenant/maintenance"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Bill Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Current Bill</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tenant/bills">View Details</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.currentBill ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">{data.currentBill.billing_period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatCurrency(data.currentBill.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600">{formatCurrency(data.currentBill.amount_paid)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-medium">Balance Due</span>
                  <span
                    className={`text-lg font-bold ${data.currentBill.balance > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {formatCurrency(data.currentBill.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={data.currentBill.status} />
                </div>
                {data.currentBill.balance > 0 && (
                  <Button className="w-full" asChild>
                    <Link href="/tenant/payments/upload">Upload Payment Proof</Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Walang current bill</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tenant/payments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Walang recorded payments</p>
            ) : (
              <div className="space-y-3">
                {data.recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(payment.payment_date)}</p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              <CardTitle className="text-lg">Announcements</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tenant/announcements">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.announcements.map((announcement: any) => (
                <div key={announcement.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{announcement.title}</h4>
                    {announcement.is_pinned && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">Pinned</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(announcement.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
