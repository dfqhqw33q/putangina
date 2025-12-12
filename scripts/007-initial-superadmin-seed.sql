
DO $$
DECLARE
  -- Configure these values before running the script
  v_email TEXT := 'admin@yourdomain.com';
  v_password TEXT := 'YourSecurePassword123!';
  v_full_name TEXT := 'Super Admin';
  v_phone TEXT := '+63 900 000 0000';
  v_new_uuid UUID;
BEGIN
  -- If a user with this email exists in auth.users, return its id
  SELECT id INTO v_new_uuid FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_new_uuid IS NULL THEN
    -- Build a compatible INSERT based on existing columns in auth.users
    DECLARE
      cols text[] := ARRAY[]::text[];
      vals text[] := ARRAY[]::text[];
      sql_stmt text;
      col_exists boolean;
      col text;
    BEGIN
      -- helper to check column existence
      -- Add columns/values only if they exist in the current auth.users table
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='instance_id') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['instance_id'];
        vals := vals || ARRAY[quote_literal('00000000-0000-0000-0000-000000000000')];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='id') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['id'];
        vals := vals || ARRAY['gen_random_uuid()'];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='aud') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['aud'];
        vals := vals || ARRAY[quote_literal('authenticated')];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='role') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['role'];
        vals := vals || ARRAY[quote_literal('authenticated')];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='email') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['email'];
        vals := vals || ARRAY[quote_literal(v_email)];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='encrypted_password') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['encrypted_password'];
        vals := vals || ARRAY[format('crypt(%L, gen_salt(''bf''))', v_password)];
      END IF;

      -- some Supabase versions may not have email_confirmed_at
      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='email_confirmed_at') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['email_confirmed_at'];
        vals := vals || ARRAY['NOW()'];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='raw_app_meta_data') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['raw_app_meta_data'];
        vals := vals || ARRAY[quote_literal('{"provider":"email","providers":["email"]}')];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='raw_user_meta_data') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['raw_user_meta_data'];
        vals := vals || ARRAY[quote_literal(format('{"full_name":"%s"}', v_full_name))];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='created_at') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['created_at'];
        vals := vals || ARRAY['NOW()'];
      END IF;

      SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name='updated_at') INTO col_exists;
      IF col_exists THEN
        cols := cols || ARRAY['updated_at'];
        vals := vals || ARRAY['NOW()'];
      END IF;

      -- optional columns: confirmation_token, email_change, email_change_token_new, recovery_token
      FOREACH col IN ARRAY ARRAY['confirmation_token','email_change','email_change_token_new','recovery_token'] LOOP
        SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='users' AND column_name=col) INTO col_exists;
        IF col_exists THEN
          cols := cols || ARRAY[col];
          vals := vals || ARRAY[quote_literal('')];
        END IF;
      END LOOP;

      IF array_length(cols,1) IS NULL THEN
        RAISE EXCEPTION 'No compatible columns found in auth.users to create a user. Create the auth user via the Dashboard and run this script again.';
      END IF;

      sql_stmt := format('INSERT INTO auth.users (%s) VALUES (%s) RETURNING id', array_to_string(cols, ','), array_to_string(vals, ','));
      EXECUTE sql_stmt INTO v_new_uuid;

      RAISE NOTICE 'Created auth user with email % and id %', v_email, v_new_uuid;
    END;
  ELSE
    RAISE NOTICE 'Auth user already exists for % with id %', v_email, v_new_uuid;
  END IF;

  -- Ensure a profile row exists and mark it as superadmin
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
    v_new_uuid,
    v_email,
    v_full_name,
    v_phone,
    'superadmin',
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = 'superadmin',
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Superadmin profile ensured for % (id: %)', v_email, v_new_uuid;
END;
$$;

-- Verification
-- SELECT id, email, full_name, role, is_active FROM public.profiles WHERE email = 'admin@yourdomain.com';

-- =====================================================