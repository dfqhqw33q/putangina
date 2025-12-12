-- =====================================================
-- DEFAULT SMS TEMPLATES
-- Will be copied to new workspaces
-- =====================================================

-- Note: These templates use placeholders that will be replaced:
-- {tenant_name} - Tenant's full name
-- {amount} - Amount in PHP
-- {due_date} - Due date
-- {unit_number} - Unit/Room/Bed number
-- {month} - Billing month
-- {payment_method} - Payment method used
-- {receipt_number} - Receipt reference number
-- {balance} - Remaining balance
-- {workspace_name} - Property/Workspace name

-- This function creates default templates for a workspace
CREATE OR REPLACE FUNCTION public.create_default_sms_templates(p_workspace_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Receipt Template (Resibo)
  INSERT INTO public.sms_templates (workspace_id, name, template_type, content, variables)
  VALUES (
    p_workspace_id,
    'Payment Receipt / Resibo ng Bayad',
    'receipt',
    'Salamat po {tenant_name}! Natanggap na po namin ang inyong bayad na PHP {amount} para sa {month}. Receipt #{receipt_number}. Maraming salamat po!',
    '["tenant_name", "amount", "month", "receipt_number"]'
  );

  -- Payment Reminder Template (Paalala)
  INSERT INTO public.sms_templates (workspace_id, name, template_type, content, variables)
  VALUES (
    p_workspace_id,
    'Payment Reminder / Paalala sa Bayad',
    'reminder',
    'Magandang araw po {tenant_name}! Paalala lang po na ang inyong bayad na PHP {amount} para sa {month} ay due na sa {due_date}. Salamat po!',
    '["tenant_name", "amount", "month", "due_date"]'
  );

  -- Overdue Notice Template (Abiso ng Lampas na Bayad)
  INSERT INTO public.sms_templates (workspace_id, name, template_type, content, variables)
  VALUES (
    p_workspace_id,
    'Overdue Notice / Abiso ng Lampas na Bayad',
    'overdue',
    'Magandang araw po {tenant_name}. Ang inyong bayad na PHP {amount} para sa {month} ay lampas na po sa due date ({due_date}). Pakibayaran na lang po agad. Salamat!',
    '["tenant_name", "amount", "month", "due_date"]'
  );

  -- Welcome Template (Maligayang Pagdating)
  INSERT INTO public.sms_templates (workspace_id, name, template_type, content, variables)
  VALUES (
    p_workspace_id,
    'Welcome Message / Maligayang Pagdating',
    'welcome',
    'Maligayang pagdating sa {workspace_name}, {tenant_name}! Ang inyong unit ay {unit_number}. Para sa mga katanungan, i-text lang po kami. Salamat!',
    '["workspace_name", "tenant_name", "unit_number"]'
  );

  -- General Announcement Template (Anunsyo)
  INSERT INTO public.sms_templates (workspace_id, name, template_type, content, variables)
  VALUES (
    p_workspace_id,
    'Announcement / Anunsyo',
    'announcement',
    'ANUNSYO mula sa {workspace_name}: ',
    '["workspace_name"]'
  );
END;
$$;
