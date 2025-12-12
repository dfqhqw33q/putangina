-- =====================================================
-- RENTAL MANAGEMENT ECOSYSTEM - DATABASE SCHEMA
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'landlord', 'tenant')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- 2. WORKSPACES TABLE (Landlord accounts/tenants)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  workspace_type TEXT NOT NULL CHECK (workspace_type IN ('homes_apartments', 'dormitory')),
  plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'empire')),
  
  -- Plan limits
  unit_cap INTEGER DEFAULT 10,
  
  -- Billing & Status
  billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'pending', 'suspended', 'cancelled')),
  billing_cycle_day INTEGER DEFAULT 1 CHECK (billing_cycle_day BETWEEN 1 AND 28),
  
  -- Activation & Kill switch
  is_active BOOLEAN DEFAULT true,
  kill_switch_enabled BOOLEAN DEFAULT false,
  kill_switch_reason TEXT,
  
  -- Metadata
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  logo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  
  -- Starter plan data retention (30-day wipe)
  last_data_wipe_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan ON public.workspaces(plan_type);

-- =====================================================
-- 3. WORKSPACE MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- =====================================================
-- 4. PROPERTIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment_building', 'house', 'dormitory', 'condo', 'townhouse')),
  address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  zip_code TEXT,
  description TEXT,
  total_units INTEGER DEFAULT 0,
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_workspace ON public.properties(workspace_id);

-- =====================================================
-- 5. UNITS TABLE (For Homes & Apartments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor_number INTEGER,
  unit_type TEXT CHECK (unit_type IN ('studio', '1br', '2br', '3br', 'loft', 'penthouse', 'room')),
  square_meters DECIMAL(10,2),
  base_rent DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  occupancy_status TEXT DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant', 'occupied', 'reserved', 'maintenance')),
  
  -- Features
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(property_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_property ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_workspace ON public.units(workspace_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(occupancy_status);

-- =====================================================
-- 6. ROOMS TABLE (For Dormitories)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor_number INTEGER,
  room_type TEXT CHECK (room_type IN ('single', 'double', 'quad', 'suite', 'shared')),
  max_beds INTEGER NOT NULL DEFAULT 1,
  base_rent_per_bed DECIMAL(12,2) NOT NULL,
  
  -- Shared utilities config
  utility_split_method TEXT DEFAULT 'equal' CHECK (utility_split_method IN ('equal', 'per_bed', 'custom')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(property_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_property ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_workspace ON public.rooms(workspace_id);

-- =====================================================
-- 7. BEDS TABLE (For Dormitories)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  bed_type TEXT DEFAULT 'single' CHECK (bed_type IN ('single', 'double', 'bunk_upper', 'bunk_lower')),
  monthly_rate DECIMAL(12,2),
  
  -- Status
  occupancy_status TEXT DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant', 'occupied', 'reserved', 'maintenance')),
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(room_id, bed_number)
);

CREATE INDEX IF NOT EXISTS idx_beds_room ON public.beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_workspace ON public.beds(workspace_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(occupancy_status);

-- =====================================================
-- 8. TENANT ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenant_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Tenant Info
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Identity
  id_type TEXT,
  id_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Move dates
  move_in_date DATE,
  move_out_date DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_accounts_workspace ON public.tenant_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tenant_accounts_user ON public.tenant_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_accounts_status ON public.tenant_accounts(status);

-- =====================================================
-- 9. TENANT BINDINGS TABLE (Links tenant to unit OR bed)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenant_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  
  -- Either unit_id OR bed_id must be set (not both)
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  
  -- Binding details
  binding_type TEXT NOT NULL CHECK (binding_type IN ('unit', 'bed')),
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit_paid DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'ended', 'terminated')),
  
  -- Contract reference
  contract_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either unit or bed is bound, not both
  CONSTRAINT binding_type_check CHECK (
    (binding_type = 'unit' AND unit_id IS NOT NULL AND bed_id IS NULL) OR
    (binding_type = 'bed' AND bed_id IS NOT NULL AND unit_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tenant_bindings_workspace ON public.tenant_bindings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bindings_tenant ON public.tenant_bindings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bindings_unit ON public.tenant_bindings(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bindings_bed ON public.tenant_bindings(bed_id);
CREATE INDEX IF NOT EXISTS idx_tenant_bindings_status ON public.tenant_bindings(status);

-- =====================================================
-- 10. UTILITY SOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.utility_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  utility_type TEXT NOT NULL CHECK (utility_type IN ('electricity', 'water', 'gas', 'internet', 'cable', 'other')),
  provider TEXT,
  account_number TEXT,
  is_metered BOOLEAN DEFAULT true,
  rate_per_unit DECIMAL(10,4),
  unit_label TEXT DEFAULT 'kWh',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utility_sources_workspace ON public.utility_sources(workspace_id);

-- =====================================================
-- 11. UTILITY READINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.utility_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  utility_source_id UUID NOT NULL REFERENCES public.utility_sources(id) ON DELETE CASCADE,
  
  -- Can be linked to unit, room, or property-wide
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Reading data
  previous_reading DECIMAL(12,2),
  current_reading DECIMAL(12,2) NOT NULL,
  consumption DECIMAL(12,2),
  reading_date DATE NOT NULL,
  
  -- For billing
  billing_period_id UUID,
  rate_applied DECIMAL(10,4),
  total_amount DECIMAL(12,2),
  
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_utility_readings_workspace ON public.utility_readings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_source ON public.utility_readings(utility_source_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_date ON public.utility_readings(reading_date);

-- =====================================================
-- 12. BILLING PERIODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.billing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id, start_date, end_date)
);

CREATE INDEX IF NOT EXISTS idx_billing_periods_workspace ON public.billing_periods(workspace_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_dates ON public.billing_periods(start_date, end_date);

-- =====================================================
-- 13. BILLS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  billing_period_id UUID NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  binding_id UUID REFERENCES public.tenant_bindings(id) ON DELETE SET NULL,
  
  -- Bill number for reference
  bill_number TEXT NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(12,2) DEFAULT 0,
  adjustments DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) NOT NULL,
  
  -- Previous balance carried over
  previous_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status (with Filipino labels in app)
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Late fee tracking
  late_fee_applied DECIMAL(12,2) DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_workspace ON public.bills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bills_tenant ON public.bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bills_period ON public.bills(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);

-- =====================================================
-- 14. BILL LINE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bill_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Item details
  item_type TEXT NOT NULL CHECK (item_type IN ('rent', 'electricity', 'water', 'gas', 'internet', 'maintenance', 'late_fee', 'deposit', 'adjustment', 'other')),
  description TEXT NOT NULL,
  
  -- For utility items
  utility_reading_id UUID REFERENCES public.utility_readings(id) ON DELETE SET NULL,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2),
  
  amount DECIMAL(12,2) NOT NULL,
  
  -- For dorm shared utilities
  is_shared BOOLEAN DEFAULT false,
  share_percentage DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_line_items_bill ON public.bill_line_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_line_items_type ON public.bill_line_items(item_type);

-- =====================================================
-- 15. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  
  -- Payment reference
  payment_number TEXT NOT NULL,
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  
  -- Payment method (Philippine methods)
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'gcash', 'maya', 'grabpay', 'shopeepay',
    'bdo', 'bpi', 'metrobank', 'unionbank', 'landbank', 'pnb', 'rcbc', 'security_bank',
    'palawan_express', 'cebuana', 'mlhuillier', 'western_union',
    'paypal', 'bank_transfer',
    'cash', 'check', 'other'
  )),
  payment_method_label TEXT,
  
  -- Reference info
  reference_number TEXT,
  
  -- Proof of payment
  proof_url TEXT,
  proof_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  rejection_reason TEXT,
  
  -- Dates
  payment_date DATE NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_workspace ON public.payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

-- =====================================================
-- 16. RECEIPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  
  -- Receipt details
  receipt_number TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  
  -- Amounts
  amount_received DECIMAL(12,2) NOT NULL,
  
  -- PDF storage
  pdf_url TEXT,
  is_watermarked BOOLEAN DEFAULT false,
  
  -- Issued by
  issued_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_workspace ON public.receipts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_tenant ON public.receipts(tenant_id);

-- =====================================================
-- 17. CONTRACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  binding_id UUID REFERENCES public.tenant_bindings(id) ON DELETE SET NULL,
  
  -- Contract details
  contract_number TEXT NOT NULL,
  contract_type TEXT DEFAULT 'lease' CHECK (contract_type IN ('lease', 'rental', 'sublease', 'month_to_month')),
  
  -- Terms
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated', 'renewed')),
  
  -- Document
  document_url TEXT,
  signed_url TEXT,
  signed_at TIMESTAMPTZ,
  
  -- Terms and conditions text
  terms_text TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_workspace ON public.contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- =====================================================
-- 18. DOCUMENT ARCHIVE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenant_accounts(id) ON DELETE SET NULL,
  
  -- Document details
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'receipt', 'id', 'proof_of_payment', 'notice', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Access control
  is_tenant_visible BOOLEAN DEFAULT false,
  
  -- Upload info
  uploaded_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_archive_workspace ON public.document_archive(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_archive_tenant ON public.document_archive(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_archive_type ON public.document_archive(document_type);

-- =====================================================
-- 19. MAINTENANCE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  
  -- Request details
  request_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'appliance', 'structural', 'pest', 'hvac', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Images
  images JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  
  -- Cost tracking
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  is_billable BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_workspace ON public.maintenance_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);

-- =====================================================
-- 20. COMPLAINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenant_accounts(id) ON DELETE CASCADE,
  
  -- Complaint details
  complaint_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('noise', 'neighbor', 'safety', 'cleanliness', 'parking', 'staff', 'other')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_workspace ON public.complaints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_complaints_tenant ON public.complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);

-- =====================================================
-- 21. ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Announcement details
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'maintenance', 'billing', 'emergency', 'event')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Target audience
  target_property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  target_all BOOLEAN DEFAULT true,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Author
  created_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_workspace ON public.announcements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published);

-- =====================================================
-- 22. SMS TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Template details
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('receipt', 'reminder', 'overdue', 'announcement', 'welcome', 'custom')),
  content TEXT NOT NULL,
  
  -- Variables available: {tenant_name}, {amount}, {due_date}, {unit_number}, etc.
  variables JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_workspace ON public.sms_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON public.sms_templates(template_type);

-- =====================================================
-- 23. SMS QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenant_accounts(id) ON DELETE SET NULL,
  
  -- Message details
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('receipt', 'reminder', 'overdue', 'announcement', 'custom')),
  
  -- Status (landlord sends manually via their phone)
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  
  -- Reference
  reference_type TEXT,
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_queue_workspace ON public.sms_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON public.sms_queue(status);

-- =====================================================
-- 24. AUDIT LOGS TABLE (Super Admin actions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Details
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_accounts_updated_at BEFORE UPDATE ON public.tenant_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_bindings_updated_at BEFORE UPDATE ON public.tenant_bindings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utility_sources_updated_at BEFORE UPDATE ON public.utility_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_periods_updated_at BEFORE UPDATE ON public.billing_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
