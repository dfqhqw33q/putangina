import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { PLAN_FEATURES, type PlanType } from "@/lib/constants/plans"

export default function PlansPage() {
  const plans = Object.entries(PLAN_FEATURES) as [PlanType, (typeof PLAN_FEATURES)[PlanType]][]

  const planColors = {
    starter: "border-gray-200",
    professional: "border-blue-200",
    empire: "border-purple-200",
  }

  const FeatureRow = ({ label, value }: { label: string; value: boolean | string | number }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {typeof value === "boolean" ? (
        value ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-red-400" />
        )
      ) : (
        <span className="text-sm font-medium">{value}</span>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Plan Settings"
        titleFilipino="Mga Setting ng Plano"
        description="View and manage subscription plan features"
        descriptionFilipino="Tingnan at pamahalaan ang mga tampok ng subscription plan"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(([key, plan]) => (
          <Card key={key} className={`${planColors[key]} border-2`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={key === "empire" ? "default" : "secondary"}>{plan.nameFilipino}</Badge>
              </div>
              <CardDescription>Max {plan.maxUnits} units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <FeatureRow label="Data Retention" value={plan.dataRetention} />
              <FeatureRow label="Tenant Portal" value={plan.tenantPortal} />
              <FeatureRow label="PDF Watermark" value={plan.pdfWatermark} />
              <FeatureRow label="Dormitory Mode" value={plan.dormMode} />
              <FeatureRow label="Mass SMS" value={plan.massSMS} />
              <FeatureRow label="Fraud Protection" value={plan.fraudProtection} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
