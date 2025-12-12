# Rental Management Ecosystem - Setup Guide

## Prerequisites
- Supabase project created
- All environment variables configured in your deployment platform

## Database Setup

### Step 1: Run SQL Scripts in Order

Execute these scripts in your Supabase SQL Editor in the following order:

1. **000-setup-instructions.sql** (read this first - contains all setup instructions)
2. **001-create-tables.sql** (creates all 24 database tables)
3. **002-rls-policies.sql** (sets up Row Level Security)
4. **003-rpc-functions.sql** (business logic functions)
5. **005-default-sms-templates.sql** (Filipino SMS templates)
6. **006-create-profile-trigger.sql** (auto-creates profiles on signup)

### Step 2: Create Super Admin Account

**If you get "banned_until" errors in the Supabase Dashboard:**

Your Supabase project is using an older version. Use the SQL method instead:

\`\`\`sql
-- Create auth user
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourdomain.com', -- CHANGE THIS
  crypt('YourSecurePassword123!', gen_salt('bf')), -- CHANGE THIS PASSWORD
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
RETURNING id; -- COPY THIS UUID!
\`\`\`

**Then update the profile to superadmin role:**

\`\`\`sql
-- Replace USER_UUID_HERE with the UUID from above
UPDATE public.profiles
SET 
  role = 'superadmin',
  full_name = 'Super Admin',
  is_active = true
WHERE id = 'USER_UUID_HERE';
\`\`\`

**Verify it worked:**

\`\`\`sql
SELECT p.id, p.email, p.role, p.full_name
FROM public.profiles p
WHERE p.role = 'superadmin';
\`\`\`

### Step 3: Login

Go to your deployed app's `/auth/login` page and login with:
- Email: admin@yourdomain.com (or whatever you set)
- Password: (the password you set in the SQL)

### Step 4: Remove Script 004

Once you've successfully created your Super Admin using the SQL method above, you can **delete script 004-seed-superadmin.sql** as it's no longer needed.

## User Creation Flow

- **Super Admin**: Creates landlord accounts via `/superadmin/workspaces`
- **Landlord**: Creates tenant accounts via `/landlord/tenants`
- **Tenant**: Only logs in (no self-registration)

## Workspace Types

- **Homes & Apartments**: Unit-based rental management
- **Dormitories**: Bed-level occupancy (Empire plan only)

## Plan Features

| Feature | Starter | Professional | Empire |
|---------|---------|--------------|--------|
| Data Retention | 30 days | Permanent | Permanent |
| Tenant Portal | No | Yes | Yes |
| Dorm Mode | No | No | Yes |
| Mass SMS | No | No | Yes |

## Troubleshooting

### "banned_until does not exist" error
- Your Supabase project is on an older version
- Use the SQL method above instead of the Dashboard to create users

### "Failed to create user: Unexpected token '<'" error
- This also indicates Dashboard compatibility issues
- Use the SQL method to create the Super Admin directly

### Profile not created after user signup
- Run script 006 again to ensure the trigger is installed
- Check if the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### Can't login after creating Super Admin
- Verify the profile role is 'superadmin': `SELECT role FROM profiles WHERE email = 'your-email';`
- If role is 'tenant', update it: `UPDATE profiles SET role = 'superadmin' WHERE email = 'your-email';`
