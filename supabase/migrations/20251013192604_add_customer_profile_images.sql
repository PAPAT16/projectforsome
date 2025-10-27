/*
  # Add Customer Profile Images

  1. Table Modifications
    - Add header_image_url column to profiles table
    - Add profile_image_url column to profiles table (if not exists)
    - Add bio text field for customer profiles
    - Add notification_opt_in boolean field

  2. Storage Setup
    - Note: Storage buckets for profile images should be created via Supabase dashboard
    - Recommended buckets: 'profile-images' and 'header-images'
    - These should be set to public read access

  3. Security
    - Users can only update their own profile images
    - RLS policies already handle profile access
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'header_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN header_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notification_opt_in'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_opt_in boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'push_notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_notifications_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;