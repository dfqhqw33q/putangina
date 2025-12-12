-- =====================================================
-- RPC FUNCTIONS
-- Rental Management Ecosystem
-- =====================================================

-- =====================================================
-- 1. CREATE WORKSPACE (Super Admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_workspace(
  p_owner_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_workspace_type TEXT DEFAULT 'homes_apartments',
  p_plan_type TEXT DEFAULT 'starter',
  p_unit_cap INTEGER DEFAULT 10
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_caller_role TEXT;
BEGIN
  -- Check if caller is superadmin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_caller_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmin can create workspaces';
  END IF;
  
  -- Create the workspace
  INSERT INTO public.workspaces (
    owner_id, name, slug, workspace_type, plan_type, unit_cap
  ) VALUES (
    p_owner_id, p_name, p_slug, p_workspace_type, p_plan_type, p_unit_cap
  ) RETURNING id INTO v_workspace_id;
  
  -- Add owner as workspace member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, p_owner_id, 'owner');
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, user_email, user_role, action, resource_type, resource_id, workspace_id, details)
  SELECT 
    auth.uid(),
    p.email,
    p.role,
    'create_workspace',
    'workspace',
    v_workspace_id,
    v_workspace_id,
    jsonb_build_object(
      'workspace_name', p_name,
      'owner_id', p_owner_id,
      'plan_type', p_plan_type
    )
  FROM public.profiles p WHERE p.id = auth.uid();
  
  RETURN v_workspace_id;
END;
$$;

-- =====================================================
-- 2. BIND TENANT TO UNIT OR BED
-- =====================================================
CREATE OR REPLACE FUNCTION public.bind_tenant(
  p_workspace_id UUID,
  p_tenant_id UUID,
  p_binding_type TEXT,
  p_unit_id UUID DEFAULT NULL,
  p_bed_id UUID DEFAULT NULL,
  p_monthly_rent DECIMAL DEFAULT 0,
  p_deposit_paid DECIMAL DEFAULT 0,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_binding_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if caller owns the workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE id = p_workspace_id AND owner_id = auth.uid()
  ) INTO v_is_owner;
  
  IF NOT v_is_owner AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized to bind tenants in this workspace';
  END IF;
  
  -- Validate binding type
  IF p_binding_type = 'unit' AND p_unit_id IS NULL THEN
    RAISE EXCEPTION 'unit_id is required for unit binding';
  END IF;
  
  IF p_binding_type = 'bed' AND p_bed_id IS NULL THEN
    RAISE EXCEPTION 'bed_id is required for bed binding';
  END IF;
  
  -- Check if unit/bed is available
  IF p_binding_type = 'unit' THEN
    IF EXISTS (
      SELECT 1 FROM public.units 
      WHERE id = p_unit_id AND occupancy_status != 'vacant'
    ) THEN
      RAISE EXCEPTION 'Unit is not available';
    END IF;
    
    -- Update unit status
    UPDATE public.units SET occupancy_status = 'occupied' WHERE id = p_unit_id;
  END IF;
  
  IF p_binding_type = 'bed' THEN
    IF EXISTS (
      SELECT 1 FROM public.beds 
      WHERE id = p_bed_id AND occupancy_status != 'vacant'
    ) THEN
      RAISE EXCEPTION 'Bed is not available';
    END IF;
    
    -- Update bed status
    UPDATE public.beds SET occupancy_status = 'occupied' WHERE id = p_bed_id;
  END IF;
  
  -- Create the binding
  INSERT INTO public.tenant_bindings (
    workspace_id, tenant_id, binding_type, unit_id, bed_id,
    monthly_rent, deposit_paid, start_date, end_date, status
  ) VALUES (
    p_workspace_id, p_tenant_id, p_binding_type, p_unit_id, p_bed_id,
    p_monthly_rent, p_deposit_paid, p_start_date, p_end_date, 'active'
  ) RETURNING id INTO v_binding_id;
  
  -- Update tenant account status
  UPDATE public.tenant_accounts 
  SET status = 'active', move_in_date = p_start_date
  WHERE id = p_tenant_id;
  
  RETURN v_binding_id;
END;
$$;

-- =====================================================
-- 3. END TENANT BINDING (Move out)
-- =====================================================
CREATE OR REPLACE FUNCTION public.end_tenant_binding(
  p_binding_id UUID,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_binding RECORD;
BEGIN
  -- Get binding info
  SELECT * INTO v_binding FROM public.tenant_bindings WHERE id = p_binding_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Binding not found';
  END IF;
  
  -- Check authorization
  IF NOT auth.is_workspace_owner(v_binding.workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Update binding status
  UPDATE public.tenant_bindings 
  SET status = 'ended', end_date = p_end_date
  WHERE id = p_binding_id;
  
  -- Mark unit/bed as vacant
  IF v_binding.unit_id IS NOT NULL THEN
    UPDATE public.units SET occupancy_status = 'vacant' WHERE id = v_binding.unit_id;
  END IF;
  
  IF v_binding.bed_id IS NOT NULL THEN
    UPDATE public.beds SET occupancy_status = 'vacant' WHERE id = v_binding.bed_id;
  END IF;
  
  -- Update tenant account
  UPDATE public.tenant_accounts 
  SET status = 'inactive', move_out_date = p_end_date
  WHERE id = v_binding.tenant_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 4. GENERATE BILL
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_bill(
  p_workspace_id UUID,
  p_billing_period_id UUID,
  p_tenant_id UUID,
  p_binding_id UUID,
  p_due_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill_id UUID;
  v_bill_number TEXT;
  v_binding RECORD;
  v_rent_amount DECIMAL;
  v_previous_balance DECIMAL := 0;
BEGIN
  -- Check authorization
  IF NOT auth.is_workspace_owner(p_workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Get binding info
  SELECT * INTO v_binding FROM public.tenant_bindings WHERE id = p_binding_id;
  v_rent_amount := v_binding.monthly_rent;
  
  -- Calculate previous balance from unpaid bills
  SELECT COALESCE(SUM(balance_due), 0) INTO v_previous_balance
  FROM public.bills
  WHERE tenant_id = p_tenant_id 
    AND status IN ('pending', 'partial', 'overdue')
    AND id != v_bill_id;
  
  -- Generate bill number
  v_bill_number := 'BILL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(uuid_generate_v4()::TEXT, 1, 8);
  
  -- Create the bill
  INSERT INTO public.bills (
    workspace_id, billing_period_id, tenant_id, binding_id,
    bill_number, subtotal, total_amount, balance_due, previous_balance,
    issue_date, due_date, status
  ) VALUES (
    p_workspace_id, p_billing_period_id, p_tenant_id, p_binding_id,
    v_bill_number, v_rent_amount, v_rent_amount + v_previous_balance, 
    v_rent_amount + v_previous_balance, v_previous_balance,
    CURRENT_DATE, p_due_date, 'pending'
  ) RETURNING id INTO v_bill_id;
  
  -- Add rent line item
  INSERT INTO public.bill_line_items (bill_id, workspace_id, item_type, description, amount)
  VALUES (v_bill_id, p_workspace_id, 'rent', 'Monthly Rent / Upa sa Buwan', v_rent_amount);
  
  RETURN v_bill_id;
END;
$$;

-- =====================================================
-- 5. ADD UTILITY TO BILL
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_utility_to_bill(
  p_bill_id UUID,
  p_utility_reading_id UUID,
  p_description TEXT,
  p_amount DECIMAL,
  p_is_shared BOOLEAN DEFAULT false,
  p_share_percentage DECIMAL DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line_item_id UUID;
  v_bill RECORD;
  v_reading RECORD;
  v_actual_amount DECIMAL;
BEGIN
  -- Get bill info
  SELECT * INTO v_bill FROM public.bills WHERE id = p_bill_id;
  
  -- Check authorization
  IF NOT auth.is_workspace_owner(v_bill.workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Get reading info
  SELECT * INTO v_reading FROM public.utility_readings WHERE id = p_utility_reading_id;
  
  -- Calculate actual amount based on share percentage
  v_actual_amount := CASE 
    WHEN p_is_shared THEN p_amount * (p_share_percentage / 100)
    ELSE p_amount
  END;
  
  -- Get utility type from reading
  INSERT INTO public.bill_line_items (
    bill_id, workspace_id, item_type, description, 
    utility_reading_id, quantity, unit_price, amount,
    is_shared, share_percentage
  )
  SELECT 
    p_bill_id, v_bill.workspace_id, 
    us.utility_type, p_description,
    p_utility_reading_id, v_reading.consumption, v_reading.rate_applied,
    v_actual_amount, p_is_shared, p_share_percentage
  FROM public.utility_sources us
  WHERE us.id = v_reading.utility_source_id
  RETURNING id INTO v_line_item_id;
  
  -- Update bill totals
  UPDATE public.bills
  SET 
    subtotal = subtotal + v_actual_amount,
    total_amount = total_amount + v_actual_amount,
    balance_due = balance_due + v_actual_amount
  WHERE id = p_bill_id;
  
  RETURN v_line_item_id;
END;
$$;

-- =====================================================
-- 6. CALCULATE DORM SHARED UTILITIES
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_dorm_shared_utilities(
  p_room_id UUID,
  p_utility_reading_id UUID
)
RETURNS TABLE (
  bed_id UUID,
  tenant_id UUID,
  share_amount DECIMAL,
  share_percentage DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
  v_reading RECORD;
  v_occupied_beds INTEGER;
  v_total_amount DECIMAL;
BEGIN
  -- Get room info
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  
  -- Get reading info
  SELECT * INTO v_reading FROM public.utility_readings WHERE id = p_utility_reading_id;
  v_total_amount := v_reading.total_amount;
  
  -- Count occupied beds
  SELECT COUNT(*) INTO v_occupied_beds
  FROM public.beds b
  INNER JOIN public.tenant_bindings tb ON tb.bed_id = b.id
  WHERE b.room_id = p_room_id AND tb.status = 'active';
  
  IF v_occupied_beds = 0 THEN
    RETURN;
  END IF;
  
  -- Return share per occupied bed
  RETURN QUERY
  SELECT 
    b.id AS bed_id,
    tb.tenant_id,
    ROUND(v_total_amount / v_occupied_beds, 2) AS share_amount,
    ROUND(100.0 / v_occupied_beds, 2) AS share_percentage
  FROM public.beds b
  INNER JOIN public.tenant_bindings tb ON tb.bed_id = b.id
  WHERE b.room_id = p_room_id AND tb.status = 'active';
END;
$$;

-- =====================================================
-- 7. RECORD PAYMENT
-- =====================================================
CREATE OR REPLACE FUNCTION public.record_payment(
  p_workspace_id UUID,
  p_bill_id UUID,
  p_tenant_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_payment_date DATE,
  p_reference_number TEXT DEFAULT NULL,
  p_proof_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_payment_number TEXT;
  v_bill RECORD;
  v_new_balance DECIMAL;
  v_new_status TEXT;
BEGIN
  -- Get bill info
  SELECT * INTO v_bill FROM public.bills WHERE id = p_bill_id;
  
  -- Check authorization (landlord or tenant submitting proof)
  IF NOT auth.is_workspace_owner(p_workspace_id) 
     AND NOT auth.is_superadmin()
     AND p_tenant_id NOT IN (SELECT auth.user_tenant_account_ids()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Generate payment number
  v_payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(uuid_generate_v4()::TEXT, 1, 8);
  
  -- Determine initial status (tenant submissions need verification)
  DECLARE
    v_initial_status TEXT := 'pending';
  BEGIN
    IF auth.is_workspace_owner(p_workspace_id) OR auth.is_superadmin() THEN
      v_initial_status := 'verified';
    END IF;
  
    -- Create payment record
    INSERT INTO public.payments (
      workspace_id, bill_id, tenant_id, payment_number,
      amount, payment_method, reference_number, proof_url,
      status, payment_date, notes,
      verified_by, verified_at
    ) VALUES (
      p_workspace_id, p_bill_id, p_tenant_id, v_payment_number,
      p_amount, p_payment_method, p_reference_number, p_proof_url,
      v_initial_status, p_payment_date, p_notes,
      CASE WHEN v_initial_status = 'verified' THEN auth.uid() ELSE NULL END,
      CASE WHEN v_initial_status = 'verified' THEN NOW() ELSE NULL END
    ) RETURNING id INTO v_payment_id;
    
    -- Only update bill if payment is verified
    IF v_initial_status = 'verified' THEN
      v_new_balance := v_bill.balance_due - p_amount;
      
      -- Determine new bill status
      v_new_status := CASE
        WHEN v_new_balance <= 0 THEN 'paid'
        WHEN v_new_balance < v_bill.total_amount THEN 'partial'
        ELSE v_bill.status
      END;
      
      -- Update bill
      UPDATE public.bills
      SET 
        amount_paid = amount_paid + p_amount,
        balance_due = GREATEST(0, v_new_balance),
        status = v_new_status
      WHERE id = p_bill_id;
    END IF;
  END;
  
  RETURN v_payment_id;
END;
$$;

-- =====================================================
-- 8. VERIFY PAYMENT
-- =====================================================
CREATE OR REPLACE FUNCTION public.verify_payment(
  p_payment_id UUID,
  p_verified BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_bill RECORD;
  v_new_balance DECIMAL;
  v_new_status TEXT;
BEGIN
  -- Get payment info
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  
  -- Check authorization
  IF NOT auth.is_workspace_owner(v_payment.workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  IF p_verified THEN
    -- Mark as verified
    UPDATE public.payments
    SET 
      status = 'verified',
      proof_verified = true,
      verified_by = auth.uid(),
      verified_at = NOW()
    WHERE id = p_payment_id;
    
    -- Update bill
    SELECT * INTO v_bill FROM public.bills WHERE id = v_payment.bill_id;
    v_new_balance := v_bill.balance_due - v_payment.amount;
    
    v_new_status := CASE
      WHEN v_new_balance <= 0 THEN 'paid'
      WHEN v_new_balance < v_bill.total_amount THEN 'partial'
      ELSE v_bill.status
    END;
    
    UPDATE public.bills
    SET 
      amount_paid = amount_paid + v_payment.amount,
      balance_due = GREATEST(0, v_new_balance),
      status = v_new_status
    WHERE id = v_payment.bill_id;
  ELSE
    -- Mark as rejected
    UPDATE public.payments
    SET 
      status = 'rejected',
      rejection_reason = p_rejection_reason
    WHERE id = p_payment_id;
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 9. ISSUE RECEIPT
-- =====================================================
CREATE OR REPLACE FUNCTION public.issue_receipt(
  p_payment_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_number TEXT;
  v_payment RECORD;
  v_workspace RECORD;
  v_is_watermarked BOOLEAN;
BEGIN
  -- Get payment info
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  
  -- Check authorization
  IF NOT auth.is_workspace_owner(v_payment.workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if payment is verified
  IF v_payment.status != 'verified' THEN
    RAISE EXCEPTION 'Payment must be verified before issuing receipt';
  END IF;
  
  -- Check workspace plan for watermark
  SELECT * INTO v_workspace FROM public.workspaces WHERE id = v_payment.workspace_id;
  v_is_watermarked := v_workspace.plan_type = 'starter';
  
  -- Generate receipt number
  v_receipt_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(uuid_generate_v4()::TEXT, 1, 8);
  
  -- Create receipt
  INSERT INTO public.receipts (
    workspace_id, payment_id, tenant_id,
    receipt_number, receipt_date, amount_received,
    is_watermarked, issued_by
  ) VALUES (
    v_payment.workspace_id, p_payment_id, v_payment.tenant_id,
    v_receipt_number, CURRENT_DATE, v_payment.amount,
    v_is_watermarked, auth.uid()
  ) RETURNING id INTO v_receipt_id;
  
  RETURN v_receipt_id;
END;
$$;

-- =====================================================
-- 10. QUEUE SMS MESSAGE
-- =====================================================
CREATE OR REPLACE FUNCTION public.queue_sms(
  p_workspace_id UUID,
  p_tenant_id UUID,
  p_phone_number TEXT,
  p_message TEXT,
  p_message_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sms_id UUID;
  v_workspace RECORD;
BEGIN
  -- Check authorization
  IF NOT auth.is_workspace_owner(p_workspace_id) AND NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Check if workspace plan allows mass SMS (Empire only for mass)
  SELECT * INTO v_workspace FROM public.workspaces WHERE id = p_workspace_id;
  
  -- Create SMS queue entry
  INSERT INTO public.sms_queue (
    workspace_id, tenant_id, phone_number, message,
    message_type, reference_type, reference_id, status
  ) VALUES (
    p_workspace_id, p_tenant_id, p_phone_number, p_message,
    p_message_type, p_reference_type, p_reference_id, 'queued'
  ) RETURNING id INTO v_sms_id;
  
  RETURN v_sms_id;
END;
$$;

-- =====================================================
-- 11. TOGGLE WORKSPACE KILL SWITCH (Super Admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION public.toggle_workspace_kill_switch(
  p_workspace_id UUID,
  p_enabled BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is superadmin
  IF NOT auth.is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmin can toggle kill switch';
  END IF;
  
  -- Update workspace
  UPDATE public.workspaces
  SET 
    kill_switch_enabled = p_enabled,
    kill_switch_reason = CASE WHEN p_enabled THEN p_reason ELSE NULL END,
    is_active = NOT p_enabled
  WHERE id = p_workspace_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, user_email, user_role, action, resource_type, resource_id, workspace_id, details)
  SELECT 
    auth.uid(),
    p.email,
    p.role,
    CASE WHEN p_enabled THEN 'enable_kill_switch' ELSE 'disable_kill_switch' END,
    'workspace',
    p_workspace_id,
    p_workspace_id,
    jsonb_build_object('reason', p_reason)
  FROM public.profiles p WHERE p.id = auth.uid();
  
  RETURN true;
END;
$$;

-- =====================================================
-- 12. UPDATE OVERDUE BILLS (Scheduled function)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_overdue_bills()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH updated AS (
    UPDATE public.bills
    SET 
      status = 'overdue',
      days_overdue = CURRENT_DATE - due_date
    WHERE due_date < CURRENT_DATE
      AND status IN ('pending', 'partial')
      AND balance_due > 0
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated FROM updated;
  
  RETURN v_updated;
END;
$$;

-- =====================================================
-- 13. GET WORKSPACE DASHBOARD STATS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_workspace_stats(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Check authorization
  IF NOT auth.is_workspace_owner(p_workspace_id) 
     AND NOT auth.is_superadmin()
     AND p_workspace_id NOT IN (SELECT auth.user_workspace_ids()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  SELECT jsonb_build_object(
    'total_properties', (SELECT COUNT(*) FROM public.properties WHERE workspace_id = p_workspace_id),
    'total_units', (SELECT COUNT(*) FROM public.units WHERE workspace_id = p_workspace_id),
    'occupied_units', (SELECT COUNT(*) FROM public.units WHERE workspace_id = p_workspace_id AND occupancy_status = 'occupied'),
    'vacant_units', (SELECT COUNT(*) FROM public.units WHERE workspace_id = p_workspace_id AND occupancy_status = 'vacant'),
    'total_tenants', (SELECT COUNT(*) FROM public.tenant_accounts WHERE workspace_id = p_workspace_id AND status = 'active'),
    'pending_bills', (SELECT COUNT(*) FROM public.bills WHERE workspace_id = p_workspace_id AND status = 'pending'),
    'overdue_bills', (SELECT COUNT(*) FROM public.bills WHERE workspace_id = p_workspace_id AND status = 'overdue'),
    'total_revenue_this_month', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.payments 
      WHERE workspace_id = p_workspace_id 
        AND status = 'verified'
        AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'pending_maintenance', (SELECT COUNT(*) FROM public.maintenance_requests WHERE workspace_id = p_workspace_id AND status = 'pending'),
    'open_complaints', (SELECT COUNT(*) FROM public.complaints WHERE workspace_id = p_workspace_id AND status = 'open')
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;
