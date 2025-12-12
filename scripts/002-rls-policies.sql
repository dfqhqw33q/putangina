-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Rental Management Ecosystem
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current user's role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is landlord of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = ws_id AND owner_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is a member of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members 
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's workspace IDs (as landlord/member)
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  UNION
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get tenant's allowed workspace IDs
CREATE OR REPLACE FUNCTION public.get_tenant_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT ta.workspace_id 
  FROM public.tenant_accounts ta
  WHERE ta.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get tenant account IDs for current user
CREATE OR REPLACE FUNCTION public.get_user_tenant_account_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.tenant_accounts WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 1. PROFILES POLICIES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all profiles
CREATE POLICY "superadmin_all_profiles" ON public.profiles
  FOR ALL USING (public.is_superadmin());

-- Users can see their own profile
CREATE POLICY "users_own_profile_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Landlords can see tenant profiles in their workspace
CREATE POLICY "landlords_see_workspace_tenants" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() = 'landlord' AND
    id IN (
      SELECT ta.user_id FROM public.tenant_accounts ta
      WHERE ta.workspace_id IN (SELECT public.get_user_workspace_ids())
      AND ta.user_id IS NOT NULL
    )
  );

-- =====================================================
-- 2. WORKSPACES POLICIES
-- =====================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Superadmin can manage all workspaces
CREATE POLICY "superadmin_all_workspaces" ON public.workspaces
  FOR ALL USING (public.is_superadmin());

-- Landlords can see and update their own workspaces
CREATE POLICY "landlords_own_workspaces_select" ON public.workspaces
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "landlords_own_workspaces_update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace members can see their workspaces
CREATE POLICY "members_see_workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id));

-- Tenants can see workspace they belong to (limited)
CREATE POLICY "tenants_see_workspace" ON public.workspaces
  FOR SELECT USING (id IN (SELECT public.get_tenant_workspace_ids()));

-- =====================================================
-- 3. WORKSPACE MEMBERS POLICIES
-- =====================================================
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Superadmin can manage all
CREATE POLICY "superadmin_all_workspace_members" ON public.workspace_members
  FOR ALL USING (public.is_superadmin());

-- Workspace owners can manage their members
CREATE POLICY "owners_manage_members" ON public.workspace_members
  FOR ALL USING (public.is_workspace_owner(workspace_id));

-- Members can see their own membership
CREATE POLICY "members_see_own" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 4. PROPERTIES POLICIES
-- =====================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_properties" ON public.properties
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace properties
CREATE POLICY "landlords_manage_properties" ON public.properties
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view properties in their workspace
CREATE POLICY "tenants_view_properties" ON public.properties
  FOR SELECT USING (workspace_id IN (SELECT public.get_tenant_workspace_ids()));

-- =====================================================
-- 5. UNITS POLICIES
-- =====================================================
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_units" ON public.units
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace units
CREATE POLICY "landlords_manage_units" ON public.units
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their bound unit
CREATE POLICY "tenants_view_bound_units" ON public.units
  FOR SELECT USING (
    id IN (
      SELECT tb.unit_id FROM public.tenant_bindings tb
      WHERE tb.tenant_id IN (SELECT public.get_user_tenant_account_ids())
      AND tb.unit_id IS NOT NULL
    )
  );

-- =====================================================
-- 6. ROOMS POLICIES
-- =====================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_rooms" ON public.rooms
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace rooms
CREATE POLICY "landlords_manage_rooms" ON public.rooms
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view rooms they're bound to
CREATE POLICY "tenants_view_bound_rooms" ON public.rooms
  FOR SELECT USING (
    id IN (
      SELECT b.room_id FROM public.beds b
      INNER JOIN public.tenant_bindings tb ON tb.bed_id = b.id
      WHERE tb.tenant_id IN (SELECT public.get_user_tenant_account_ids())
    )
  );

-- =====================================================
-- 7. BEDS POLICIES
-- =====================================================
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_beds" ON public.beds
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace beds
CREATE POLICY "landlords_manage_beds" ON public.beds
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their bound bed
CREATE POLICY "tenants_view_bound_beds" ON public.beds
  FOR SELECT USING (
    id IN (
      SELECT tb.bed_id FROM public.tenant_bindings tb
      WHERE tb.tenant_id IN (SELECT public.get_user_tenant_account_ids())
      AND tb.bed_id IS NOT NULL
    )
  );

-- =====================================================
-- 8. TENANT ACCOUNTS POLICIES
-- =====================================================
ALTER TABLE public.tenant_accounts ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_tenant_accounts" ON public.tenant_accounts
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace tenants
CREATE POLICY "landlords_manage_tenants" ON public.tenant_accounts
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own account
CREATE POLICY "tenants_view_own_account" ON public.tenant_accounts
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 9. TENANT BINDINGS POLICIES
-- =====================================================
ALTER TABLE public.tenant_bindings ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_bindings" ON public.tenant_bindings
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace bindings
CREATE POLICY "landlords_manage_bindings" ON public.tenant_bindings
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own bindings
CREATE POLICY "tenants_view_own_bindings" ON public.tenant_bindings
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 10. UTILITY SOURCES POLICIES
-- =====================================================
ALTER TABLE public.utility_sources ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_utility_sources" ON public.utility_sources
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace utility sources
CREATE POLICY "landlords_manage_utility_sources" ON public.utility_sources
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- =====================================================
-- 11. UTILITY READINGS POLICIES
-- =====================================================
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_utility_readings" ON public.utility_readings
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace readings
CREATE POLICY "landlords_manage_utility_readings" ON public.utility_readings
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view readings for their unit/room
CREATE POLICY "tenants_view_utility_readings" ON public.utility_readings
  FOR SELECT USING (
    unit_id IN (
      SELECT tb.unit_id FROM public.tenant_bindings tb
      WHERE tb.tenant_id IN (SELECT public.get_user_tenant_account_ids())
      AND tb.unit_id IS NOT NULL
    )
    OR
    room_id IN (
      SELECT b.room_id FROM public.beds b
      INNER JOIN public.tenant_bindings tb ON tb.bed_id = b.id
      WHERE tb.tenant_id IN (SELECT public.get_user_tenant_account_ids())
    )
  );

-- =====================================================
-- 12. BILLING PERIODS POLICIES
-- =====================================================
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_billing_periods" ON public.billing_periods
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace billing periods
CREATE POLICY "landlords_manage_billing_periods" ON public.billing_periods
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view billing periods in their workspace
CREATE POLICY "tenants_view_billing_periods" ON public.billing_periods
  FOR SELECT USING (workspace_id IN (SELECT public.get_tenant_workspace_ids()));

-- =====================================================
-- 13. BILLS POLICIES
-- =====================================================
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_bills" ON public.bills
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace bills
CREATE POLICY "landlords_manage_bills" ON public.bills
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own bills
CREATE POLICY "tenants_view_own_bills" ON public.bills
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 14. BILL LINE ITEMS POLICIES
-- =====================================================
ALTER TABLE public.bill_line_items ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_bill_items" ON public.bill_line_items
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace bill items
CREATE POLICY "landlords_manage_bill_items" ON public.bill_line_items
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own bill items
CREATE POLICY "tenants_view_own_bill_items" ON public.bill_line_items
  FOR SELECT USING (
    bill_id IN (
      SELECT id FROM public.bills WHERE tenant_id IN (SELECT public.get_user_tenant_account_ids())
    )
  );

-- =====================================================
-- 15. PAYMENTS POLICIES
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_payments" ON public.payments
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace payments
CREATE POLICY "landlords_manage_payments" ON public.payments
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own payments
CREATE POLICY "tenants_view_own_payments" ON public.payments
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- Tenants can insert payments (submit proof)
CREATE POLICY "tenants_insert_payments" ON public.payments
  FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 16. RECEIPTS POLICIES
-- =====================================================
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_receipts" ON public.receipts
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace receipts
CREATE POLICY "landlords_manage_receipts" ON public.receipts
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own receipts
CREATE POLICY "tenants_view_own_receipts" ON public.receipts
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 17. CONTRACTS POLICIES
-- =====================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_contracts" ON public.contracts
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace contracts
CREATE POLICY "landlords_manage_contracts" ON public.contracts
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own contracts
CREATE POLICY "tenants_view_own_contracts" ON public.contracts
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 18. DOCUMENT ARCHIVE POLICIES
-- =====================================================
ALTER TABLE public.document_archive ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_documents" ON public.document_archive
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace documents
CREATE POLICY "landlords_manage_documents" ON public.document_archive
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their visible documents
CREATE POLICY "tenants_view_visible_documents" ON public.document_archive
  FOR SELECT USING (
    tenant_id IN (SELECT public.get_user_tenant_account_ids()) AND is_tenant_visible = true
  );

-- =====================================================
-- 19. MAINTENANCE REQUESTS POLICIES
-- =====================================================
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_maintenance" ON public.maintenance_requests
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace maintenance requests
CREATE POLICY "landlords_manage_maintenance" ON public.maintenance_requests
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own requests
CREATE POLICY "tenants_view_own_maintenance" ON public.maintenance_requests
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- Tenants can create maintenance requests
CREATE POLICY "tenants_create_maintenance" ON public.maintenance_requests
  FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- Tenants can update their own pending requests
CREATE POLICY "tenants_update_own_maintenance" ON public.maintenance_requests
  FOR UPDATE USING (
    tenant_id IN (SELECT public.get_user_tenant_account_ids())
    AND status = 'pending'
  );

-- =====================================================
-- 20. COMPLAINTS POLICIES
-- =====================================================
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_complaints" ON public.complaints
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace complaints
CREATE POLICY "landlords_manage_complaints" ON public.complaints
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view their own complaints
CREATE POLICY "tenants_view_own_complaints" ON public.complaints
  FOR SELECT USING (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- Tenants can create complaints
CREATE POLICY "tenants_create_complaints" ON public.complaints
  FOR INSERT WITH CHECK (tenant_id IN (SELECT public.get_user_tenant_account_ids()));

-- =====================================================
-- 21. ANNOUNCEMENTS POLICIES
-- =====================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_announcements" ON public.announcements
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace announcements
CREATE POLICY "landlords_manage_announcements" ON public.announcements
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- Tenants can view published announcements in their workspace
CREATE POLICY "tenants_view_announcements" ON public.announcements
  FOR SELECT USING (
    workspace_id IN (SELECT public.get_tenant_workspace_ids())
    AND is_published = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- =====================================================
-- 22. SMS TEMPLATES POLICIES
-- =====================================================
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_sms_templates" ON public.sms_templates
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace templates
CREATE POLICY "landlords_manage_sms_templates" ON public.sms_templates
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- =====================================================
-- 23. SMS QUEUE POLICIES
-- =====================================================
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;

-- Superadmin full access
CREATE POLICY "superadmin_all_sms_queue" ON public.sms_queue
  FOR ALL USING (public.is_superadmin());

-- Landlords manage their workspace SMS queue
CREATE POLICY "landlords_manage_sms_queue" ON public.sms_queue
  FOR ALL USING (workspace_id IN (SELECT public.get_user_workspace_ids()));

-- =====================================================
-- 24. AUDIT LOGS POLICIES
-- =====================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmin can view audit logs
CREATE POLICY "superadmin_only_audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_superadmin());
