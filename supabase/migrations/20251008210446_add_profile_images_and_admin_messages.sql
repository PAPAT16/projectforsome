/*
  # Add Profile Images and Admin Messages System

  1. New Columns
    - `profiles.profile_image_url` - Personal profile picture for users
    - `food_trucks.truck_profile_image_url` - Truck profile/cover image separate from logo
  
  2. New Tables
    - `admin_messages`
      - `id` (uuid, primary key)
      - `message` (text) - The message content
      - `message_type` (text) - Type: 'info', 'warning', 'alert', 'success'
      - `is_active` (boolean) - Whether the message should be displayed
      - `target_audience` (text) - Who sees it: 'all', 'owners', 'customers'
      - `expires_at` (timestamptz) - Optional expiration date
      - `created_by` (uuid) - Admin who created the message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  3. Security
    - Enable RLS on `admin_messages` table
    - Add policies for reading messages (all users can read active messages)
    - Add policies for admins to manage messages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'food_trucks' AND column_name = 'truck_profile_image_url'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN truck_profile_image_url text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'info',
  is_active boolean DEFAULT true,
  target_audience text NOT NULL DEFAULT 'all',
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT message_type_check CHECK (message_type IN ('info', 'warning', 'alert', 'success')),
  CONSTRAINT target_audience_check CHECK (target_audience IN ('all', 'owners', 'customers'))
);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active messages" ON admin_messages;
CREATE POLICY "Anyone can read active messages"
  ON admin_messages
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

DROP POLICY IF EXISTS "Admins can insert messages" ON admin_messages;
CREATE POLICY "Admins can insert messages"
  ON admin_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update messages" ON admin_messages;
CREATE POLICY "Admins can update messages"
  ON admin_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete messages" ON admin_messages;
CREATE POLICY "Admins can delete messages"
  ON admin_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );