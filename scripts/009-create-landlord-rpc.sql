-- =====================================================
-- CREATE LANDLORD PROFILE
-- Rental Management Ecosystem - Superadmin helper
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_landlord_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update existing profile or insert new one
  UPDATE public.profiles
  SET 
    email = p_email,
    full_name = p_full_name,
    phone = COALESCE(p_phone, phone),
    role = 'landlord',
    is_active = true,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- If no rows were updated, insert a new profile
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, full_name, phone, role, is_active)
    VALUES (p_user_id, p_email, p_full_name, p_phone, 'landlord', true);
  END IF;
  
  RETURN QUERY SELECT 
    true as success,
    'Landlord profile created successfully'::TEXT as message,
    p_user_id as user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_landlord_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
