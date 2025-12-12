"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils/format"

interface AuditLog {
  id: string
  user_email: string
  user_role: string
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchLogs()
  }, [page, searchValue])

  const fetchLogs = async () => {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (searchValue) {
      query = query.or(
        `action.ilike.%${searchValue}%,user_email.ilike.%${searchValue}%,resource_type.ilike.%${searchValue}%`,
      )
    }

    const { data, count } = await query

    setLogs(data || [])
    setTotal(count || 0)
    setIsLoading(false)
  }

  const actionColors: Record<string, string> = {
    create_workspace: "bg-green-100 text-green-800",
    enable_kill_switch: "bg-red-100 text-red-800",
    disable_kill_switch: "bg-blue-100 text-blue-800",
    update_workspace: "bg-yellow-100 text-yellow-800",
    delete_workspace: "bg-red-100 text-red-800",
  }

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Date/Time",
      headerFilipino: "Petsa/Oras",
      cell: (row) => <span className="text-sm">{formatDateTime(row.created_at)}</span>,
    },
    {
      key: "user_email",
      header: "User",
      headerFilipino: "Gumagamit",
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user_email}</p>
          <p className="text-xs text-muted-foreground">{row.user_role}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      headerFilipino: "Aksyon",
      cell: (row) => (
        <Badge className={actionColors[row.action] || "bg-gray-100 text-gray-800"}>
          {row.action.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "resource_type",
      header: "Resource",
      headerFilipino: "Rekurso",
      cell: (row) => <span className="text-sm capitalize">{row.resource_type}</span>,
      hideOnMobile: true,
    },
    {
      key: "details",
      header: "Details",
      headerFilipino: "Mga Detalye",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {Object.entries(row.details || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
            .slice(0, 50)}
          {Object.keys(row.details || {}).length > 0 && "..."}
        </span>
      ),
      hideOnMobile: true,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        titleFilipino="Mga Tala ng Aktibidad"
        description="View all system activity and admin actions"
        descriptionFilipino="Tingnan ang lahat ng aktibidad ng sistema at aksyon ng admin"
      />

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search actions, users..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        isLoading={isLoading}
        emptyMessage="No activity logs found"
        emptyMessageFilipino="Walang nahanap na tala ng aktibidad"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
