// Database types for Supabase
export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: "superadmin" | "landlord" | "tenant"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  owner_id: string
  name: string
  slug: string
  workspace_type: "homes_apartments" | "dormitory"
  plan_type: "starter" | "professional" | "empire"
  unit_cap: number
  billing_status: "active" | "pending" | "suspended" | "cancelled"
  billing_cycle_day: number
  is_active: boolean
  kill_switch_enabled: boolean
  kill_switch_reason: string | null
  address: string | null
  contact_phone: string | null
  contact_email: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  trial_ends_at: string | null
  last_data_wipe_at: string | null
}

export interface Property {
  id: string
  workspace_id: string
  name: string
  property_type: "apartment_building" | "house" | "dormitory" | "condo" | "townhouse"
  address: string
  city: string | null
  province: string | null
  zip_code: string | null
  description: string | null
  total_units: number
  amenities: string[]
  images: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  property_id: string
  workspace_id: string
  unit_number: string
  floor_number: number | null
  unit_type: "studio" | "1br" | "2br" | "3br" | "loft" | "penthouse" | "room" | null
  square_meters: number | null
  base_rent: number
  deposit_amount: number
  occupancy_status: "vacant" | "occupied" | "reserved" | "maintenance"
  amenities: string[]
  images: string[]
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  workspace_id: string
  room_number: string
  floor_number: number | null
  room_type: "single" | "double" | "quad" | "suite" | "shared" | null
  max_beds: number
  base_rent_per_bed: number
  utility_split_method: "equal" | "per_bed" | "custom"
  is_active: boolean
  notes: string | null
  amenities: string[]
  images: string[]
  created_at: string
  updated_at: string
}

export interface Bed {
  id: string
  room_id: string
  workspace_id: string
  bed_number: string
  bed_type: "single" | "double" | "bunk_upper" | "bunk_lower"
  monthly_rate: number | null
  occupancy_status: "vacant" | "occupied" | "reserved" | "maintenance"
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TenantAccount {
  id: string
  workspace_id: string
  user_id: string | null
  full_name: string
  email: string | null
  phone: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  id_type: string | null
  id_number: string | null
  status: "active" | "inactive" | "archived"
  move_in_date: string | null
  move_out_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TenantBinding {
  id: string
  workspace_id: string
  tenant_id: string
  unit_id: string | null
  bed_id: string | null
  binding_type: "unit" | "bed"
  monthly_rent: number
  deposit_paid: number
  start_date: string
  end_date: string | null
  status: "active" | "pending" | "ended" | "terminated"
  contract_id: string | null
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  workspace_id: string
  billing_period_id: string
  tenant_id: string
  binding_id: string | null
  bill_number: string
  subtotal: number
  adjustments: number
  total_amount: number
  amount_paid: number
  balance_due: number
  previous_balance: number
  issue_date: string
  due_date: string
  status: "draft" | "pending" | "partial" | "paid" | "overdue" | "cancelled"
  late_fee_applied: number
  days_overdue: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  workspace_id: string
  bill_id: string
  tenant_id: string
  payment_number: string
  amount: number
  payment_method: string
  payment_method_label: string | null
  reference_number: string | null
  proof_url: string | null
  proof_verified: boolean
  verified_by: string | null
  verified_at: string | null
  status: "pending" | "verified" | "rejected" | "refunded"
  rejection_reason: string | null
  payment_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  workspace_id: string
  payment_id: string
  tenant_id: string
  receipt_number: string
  receipt_date: string
  amount_received: number
  pdf_url: string | null
  is_watermarked: boolean
  issued_by: string | null
  created_at: string
}

export interface MaintenanceRequest {
  id: string
  workspace_id: string
  tenant_id: string
  unit_id: string | null
  room_id: string | null
  request_number: string
  title: string
  description: string
  category: "plumbing" | "electrical" | "appliance" | "structural" | "pest" | "hvac" | "other" | null
  priority: "low" | "normal" | "high" | "urgent"
  images: string[]
  status: "pending" | "in_progress" | "completed" | "cancelled"
  resolution_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  estimated_cost: number | null
  actual_cost: number | null
  is_billable: boolean
  created_at: string
  updated_at: string
}

export interface Complaint {
  id: string
  workspace_id: string
  tenant_id: string
  complaint_number: string
  title: string
  description: string
  category: "noise" | "neighbor" | "safety" | "cleanliness" | "parking" | "staff" | "other" | null
  status: "open" | "investigating" | "resolved" | "closed"
  resolution_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  workspace_id: string
  title: string
  content: string
  category: "general" | "maintenance" | "billing" | "emergency" | "event" | null
  priority: "low" | "normal" | "high" | "urgent"
  target_property_id: string | null
  target_all: boolean
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SMSTemplate {
  id: string
  workspace_id: string
  name: string
  template_type: "receipt" | "reminder" | "overdue" | "announcement" | "welcome" | "custom"
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SMSQueue {
  id: string
  workspace_id: string
  tenant_id: string | null
  phone_number: string
  message: string
  message_type: "receipt" | "reminder" | "overdue" | "announcement" | "custom" | null
  status: "queued" | "sent" | "failed" | "cancelled"
  sent_at: string | null
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_email: string
  user_role: string
  action: string
  resource_type: string
  resource_id: string | null
  workspace_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
