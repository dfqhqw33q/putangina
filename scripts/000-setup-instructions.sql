-- =====================================================
-- SETUP INSTRUCTIONS
-- Rental Management Ecosystem
-- =====================================================

-- STEP 1: Run all SQL scripts in order (001 through 006)
-- These will create the database schema, policies, functions, and triggers

-- STEP 2: Create Super Admin user manually
-- Option A: Using Supabase Dashboard (recommended if your project supports it)
--   1. Go to Authentication > Users in Supabase Dashboard
--   2. Click "Add User" and create with email/password
--   3. Copy the user UUID
--   4. Run the SQL below, replacing 'USER_UUID_HERE'

-- Option B: Using SQL (if Dashboard has issues)
-- Run this in the SQL Editor:

-- First, create the auth user (replace with your desired credentials)
-- NOTE: This creates the user directly in auth.users bypassing the Dashboard
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), -- or specify your own UUID
  'authenticated',
  'authenticated',
  'admin@yourdomain.com', -- CHANGE THIS
  crypt('YourSecurePassword123!', gen_salt('bf')), -- CHANGE THIS
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id; -- Copy this UUID!

-- STEP 3: After getting the UUID from above, update the profile to superadmin role
-- Replace 'USER_UUID_HERE' with the actual UUID from the previous query
UPDATE public.profiles
SET 
  role = 'superadmin',
  full_name = 'Super Admin',
  is_active = true
WHERE id = 'USER_UUID_HERE';

-- STEP 4: Verify the super admin was created correctly
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.is_active,
  p.created_at
FROM public.profiles p
WHERE p.role = 'superadmin';

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you get "banned_until does not exist" error:
-- This means your Supabase project is using an older version.
-- Solution: Use Option B above (SQL method) instead of the Dashboard.

-- If the trigger doesn't create a profile automatically:
-- Run script 006 again to ensure the trigger is installed.

-- To manually create a profile if needed:
-- INSERT INTO public.profiles (id, email, full_name, role, is_active)
-- VALUES ('USER_UUID_HERE', 'admin@yourdomain.com', 'Super Admin', 'superadmin', true);
