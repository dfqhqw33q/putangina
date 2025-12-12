-- =====================================================
-- SEED SUPER ADMIN ACCOUNT
-- Rental Management Ecosystem
-- =====================================================
-- 
-- INSTRUCTIONS:
-- 1. Run this script AFTER creating the auth user in Supabase
-- 2. First, create a user in Supabase Auth with:
--    - Email: admin@rentalmanagement.com (change as needed)
--    - Password: your secure password
-- 3. Copy the UUID from the created auth user
-- 4. Replace 'YOUR_AUTH_USER_UUID_HERE' below with that UUID
-- 5. Run this script
-- 
-- ALTERNATIVE: Use the Supabase Dashboard to:
-- 1. Go to Authentication > Users
-- 2. Click "Add User" 
-- 3. Enter email and password
-- 4. Copy the user's UUID
-- 5. Update and run this script
-- =====================================================

-- IMPORTANT: Replace this UUID with your actual auth user UUID
-- Example: '12345678-1234-1234-1234-123456789012'

DO $$
DECLARE
  v_superadmin_id UUID := 'YOUR_AUTH_USER_UUID_HERE'; -- <-- REPLACE THIS
  v_email TEXT := 'admin@rentalmanagement.com'; -- <-- REPLACE THIS
BEGIN
  -- Check if UUID is still placeholder
  IF v_superadmin_id = 'YOUR_AUTH_USER_UUID_HERE' THEN
    RAISE EXCEPTION 'Please replace YOUR_AUTH_USER_UUID_HERE with the actual auth user UUID';
  END IF;

  -- Create the superadmin profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_superadmin_id,
    v_email,
    'System Administrator',
    '+63 900 000 0000',
    'superadmin',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Super Admin profile created/updated successfully for: %', v_email;
END;
$$;

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify the superadmin was created
-- =====================================================
-- SELECT id, email, full_name, role, is_active 
-- FROM public.profiles 
-- WHERE role = 'superadmin';
