export type PlanType = "starter" | "professional" | "empire"

export const PLANS = {
  STARTER: "starter" as const,
  PROFESSIONAL: "professional" as const,
  EMPIRE: "empire" as const,
}

export const PLAN_FEATURES: Record<
  PlanType,
  {
    name: string
    nameFilipino: string
    dataRetention: string
    tenantPortal: boolean
    pdfWatermark: boolean
    dormMode: boolean
    massSMS: boolean
    fraudProtection: boolean
    maxUnits: number
  }
> = {
  starter: {
    name: "Starter",
    nameFilipino: "Panimula",
    dataRetention: "30 days / 30 araw",
    tenantPortal: false,
    pdfWatermark: true,
    dormMode: false,
    massSMS: false,
    fraudProtection: false,
    maxUnits: 10,
  },
  professional: {
    name: "Professional",
    nameFilipino: "Propesyonal",
    dataRetention: "Permanent / Permanente",
    tenantPortal: true,
    pdfWatermark: false,
    dormMode: false,
    massSMS: false,
    fraudProtection: true,
    maxUnits: 50,
  },
  empire: {
    name: "Empire",
    nameFilipino: "Imperyo",
    dataRetention: "Permanent / Permanente",
    tenantPortal: true,
    pdfWatermark: false,
    dormMode: true,
    massSMS: true,
    fraudProtection: true,
    maxUnits: 999,
  },
}
