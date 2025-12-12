"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, FileSpreadsheet, Receipt, Users, Building2 } from "lucide-react"
import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { exportToCSV } from "@/lib/utils/export-csv"

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleExport(reportType: string) {
    setLoading(reportType)
    const supabase = createBrowserSupabaseClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from("profiles")
        .select("workspace_members(workspace_id)")
        .eq("id", user?.id)
        .single()

      const workspaceId = profile?.workspace_members?.[0]?.workspace_id

      let data: Record<string, unknown>[] = []
      let filename = ""

      switch (reportType) {
        case "billing":
          const { data: bills } = await supabase
            .from("bills")
            .select(`
              bill_number,
              tenant_accounts(full_name),
              issue_date,
              due_date,
              total_amount,
              amount_paid,
              balance_due,
              status
            `)
            .eq("workspace_id", workspaceId)
            .order("issue_date", { ascending: false })

          data = (bills || []).map((bill) => ({
            "Bill Number": bill.bill_number,
            Tenant: bill.tenant_accounts?.full_name,
            "Issue Date": bill.issue_date,
            "Due Date": bill.due_date,
            "Total Amount": bill.total_amount,
            "Amount Paid": bill.amount_paid,
            "Balance Due": bill.balance_due,
            Status: bill.status,
          }))
          filename = "billing_report"
          break

        case "payments":
          const { data: payments } = await supabase
            .from("payments")
            .select(`
              payment_number,
              tenant_accounts(full_name),
              payment_date,
              amount,
              payment_method,
              reference_number,
              status
            `)
            .eq("workspace_id", workspaceId)
            .order("payment_date", { ascending: false })

          data = (payments || []).map((payment) => ({
            "Payment Number": payment.payment_number,
            Tenant: payment.tenant_accounts?.full_name,
            "Payment Date": payment.payment_date,
            Amount: payment.amount,
            Method: payment.payment_method,
            Reference: payment.reference_number,
            Status: payment.status,
          }))
          filename = "payments_report"
          break

        case "tenants":
          const { data: tenants } = await supabase
            .from("tenant_accounts")
            .select(`
              full_name,
              email,
              phone,
              status,
              move_in_date,
              move_out_date
            `)
            .eq("workspace_id", workspaceId)
            .order("full_name", { ascending: true })

          data = (tenants || []).map((tenant) => ({
            Name: tenant.full_name,
            Email: tenant.email,
            Phone: tenant.phone,
            Status: tenant.status,
            "Move In": tenant.move_in_date,
            "Move Out": tenant.move_out_date,
          }))
          filename = "tenants_report"
          break

        case "occupancy":
          const { data: units } = await supabase
            .from("units")
            .select(`
              unit_number,
              properties(name),
              occupancy_status,
              base_rent,
              tenant_bindings(tenant_accounts(full_name))
            `)
            .eq("workspace_id", workspaceId)
            .order("unit_number", { ascending: true })

          data = (units || []).map((unit) => ({
            Property: unit.properties?.name,
            "Unit Number": unit.unit_number,
            Status: unit.occupancy_status,
            Rent: unit.base_rent,
            Tenant: unit.tenant_bindings?.[0]?.tenant_accounts?.full_name || "N/A",
          }))
          filename = "occupancy_report"
          break

        case "balances":
          const { data: outstandingBills } = await supabase
            .from("bills")
            .select(`
              bill_number,
              tenant_accounts(full_name, phone),
              due_date,
              balance_due,
              days_overdue,
              status
            `)
            .eq("workspace_id", workspaceId)
            .gt("balance_due", 0)
            .order("days_overdue", { ascending: false })

          data = (outstandingBills || []).map((bill) => ({
            "Bill Number": bill.bill_number,
            Tenant: bill.tenant_accounts?.full_name,
            Phone: bill.tenant_accounts?.phone,
            "Due Date": bill.due_date,
            "Balance Due": bill.balance_due,
            "Days Overdue": bill.days_overdue,
            Status: bill.status,
          }))
          filename = "outstanding_balances_report"
          break
      }

      exportToCSV(data, filename)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export report")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="I-export ang mga ulat at data" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Billing Report</CardTitle>
                <CardDescription>Summary ng lahat ng bills</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleExport("billing")}
              disabled={loading === "billing"}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === "billing" ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Payment Report</CardTitle>
                <CardDescription>Lahat ng payments received</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleExport("payments")}
              disabled={loading === "payments"}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === "payments" ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Tenant Report</CardTitle>
                <CardDescription>List ng lahat ng tenant</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleExport("tenants")}
              disabled={loading === "tenants"}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === "tenants" ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">Occupancy Report</CardTitle>
                <CardDescription>Unit occupancy status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleExport("occupancy")}
              disabled={loading === "occupancy"}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === "occupancy" ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-base">Outstanding Balances</CardTitle>
                <CardDescription>Tenants with unpaid balances</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleExport("balances")}
              disabled={loading === "balances"}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading === "balances" ? "Exporting..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
