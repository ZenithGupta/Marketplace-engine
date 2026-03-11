-- =============================================
-- FIX VENDOR SIGNUP TRIGGER
-- Updates the handle_new_user trigger to properly set the role
-- and store name right when the account is created.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, store_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'vendor' THEN COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '''s Store'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
