import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, AlertTriangle, Activity } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"

async function getDashboardStats() {
  const supabase = await createClient()

  const [workspacesResult, landlordResult, tenantsResult, recentLogsResult] = await Promise.all([
    supabase.from("workspaces").select("id, plan_type, is_active, kill_switch_enabled", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "landlord"),
    supabase.from("profiles").select("id", { count: "exact" }).eq("role", "tenant"),
    supabase
      .from("audit_logs")
      .select("id, action, user_email, resource_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const workspaces = workspacesResult.data || []
  const activeWorkspaces = workspaces.filter((w) => w.is_active && !w.kill_switch_enabled).length
  const suspendedWorkspaces = workspaces.filter((w) => w.kill_switch_enabled).length

  const planCounts = {
    starter: workspaces.filter((w) => w.plan_type === "starter").length,
    professional: workspaces.filter((w) => w.plan_type === "professional").length,
    empire: workspaces.filter((w) => w.plan_type === "empire").length,
  }

  return {
    totalWorkspaces: workspacesResult.count || 0,
    activeWorkspaces,
    suspendedWorkspaces,
    totalLandlords: landlordResult.count || 0,
    totalTenants: tenantsResult.count || 0,
    planCounts,
    recentLogs: recentLogsResult.data || [],
  }
}

export default async function SuperAdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div>
      <PageHeader
        title="Super Admin Dashboard"
        titleFilipino="Dashboard ng Super Admin"
        description="System-wide overview and management"
        descriptionFilipino="Pangkalahatang-tanaw at pamamahala ng sistema"
      />

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Workspaces"
          titleFilipino="Kabuuang Workspace"
          value={stats.totalWorkspaces}
          description={`${stats.activeWorkspaces} active, ${stats.suspendedWorkspaces} suspended`}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Total Landlords"
          titleFilipino="Kabuuang May-ari"
          value={stats.totalLandlords}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Tenants"
          titleFilipino="Kabuuang Umuupa"
          value={stats.totalTenants}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Suspended"
          titleFilipino="Suspendido"
          value={stats.suspendedWorkspaces}
          variant={stats.suspendedWorkspaces > 0 ? "danger" : "default"}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Plan Distribution & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Distribution / Distribusyon ng Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Starter / Panimula</span>
                </div>
                <span className="font-semibold">{stats.planCounts.starter}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Professional / Propesyonal</span>
                </div>
                <span className="font-semibold">{stats.planCounts.professional}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Empire / Imperyo</span>
                </div>
                <span className="font-semibold">{stats.planCounts.empire}</span>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-gray-100">
              {stats.totalWorkspaces > 0 && (
                <>
                  <div
                    className="bg-gray-400 transition-all"
                    style={{ width: `${(stats.planCounts.starter / stats.totalWorkspaces) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: `${(stats.planCounts.professional / stats.totalWorkspaces) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all"
                    style={{ width: `${(stats.planCounts.empire / stats.totalWorkspaces) * 100}%` }}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity / Kamakailang Aktibidad</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
                <br />
                <span className="text-xs">Walang kamakailang aktibidad</span>
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{log.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user_email} • {log.resource_type}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
