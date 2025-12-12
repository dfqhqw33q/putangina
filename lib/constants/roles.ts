export type UserRole = "superadmin" | "landlord" | "tenant"

export const ROLES = {
  SUPERADMIN: "superadmin" as const,
  LANDLORD: "landlord" as const,
  TENANT: "tenant" as const,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  landlord: "Landlord / May-ari",
  tenant: "Tenant / Umuupa",
}

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  superadmin: "/superadmin",
  landlord: "/landlord",
  tenant: "/tenant",
}
