import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, BarChart3, Users, Building2 } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      title: "Workspace Summary",
      titleFilipino: "Buod ng Workspace",
      description: "Overview of all workspaces, plans, and status",
      icon: Building2,
    },
    {
      title: "Landlord Report",
      titleFilipino: "Ulat ng May-ari",
      description: "List of all landlords with workspace details",
      icon: Users,
    },
    {
      title: "Revenue Report",
      titleFilipino: "Ulat ng Kita",
      description: "Total revenue across all workspaces",
      icon: BarChart3,
    },
    {
      title: "Activity Report",
      titleFilipino: "Ulat ng Aktibidad",
      description: "System activity and audit log summary",
      icon: FileText,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Reports"
        titleFilipino="Mga Ulat"
        description="Generate and download system reports"
        descriptionFilipino="Lumikha at i-download ang mga ulat ng sistema"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <report.icon className="h-5 w-5" />
                {report.title}
              </CardTitle>
              <CardDescription>
                {report.description}
                <br />
                <span className="text-xs">{report.titleFilipino}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download Report / I-download ang Ulat
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
