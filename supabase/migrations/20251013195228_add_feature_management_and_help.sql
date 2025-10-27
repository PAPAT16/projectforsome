/*
  # Add Feature Management and User Subscription Tiers

  1. New Tables
    - `features`
      - `id` (uuid, primary key)
      - `name` (text) - Feature name
      - `description` (text) - What the feature does
      - `enabled` (boolean) - Whether feature is enabled globally
      - `tier` (text) - Which tier can access: 'free', 'basic', 'premium'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modify Profiles Table
    - Add `subscription_tier` column (text) - User's subscription level
    - Default to 'free'

  3. Security
    - Enable RLS on features table
    - All users can read features
    - Only admins can modify features
*/

-- Create features table
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add subscription tier to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for features
CREATE POLICY "Anyone can view features"
  ON features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert features"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update features"
  ON features FOR UPDATE
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

CREATE POLICY "Only admins can delete features"
  ON features FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default features
INSERT INTO features (name, description, enabled, tier) VALUES
  ('Map View', 'View food trucks on interactive map', true, 'free'),
  ('Favorite Trucks', 'Save and track your favorite food trucks', true, 'free'),
  ('Basic Search', 'Search for trucks by name and location', true, 'free'),
  ('Advanced Filters', 'Filter by cuisine, rating, price range', true, 'basic'),
  ('Push Notifications', 'Get real-time alerts about favorite trucks', true, 'basic'),
  ('Rewards Program', 'Earn points and redeem rewards', true, 'basic'),
  ('Affiliate Program', 'Earn commissions by referring trucks', true, 'premium'),
  ('Priority Support', '24/7 priority customer support', true, 'premium'),
  ('Analytics Dashboard', 'Detailed insights and analytics', true, 'premium'),
  ('Custom Branding', 'Customize your truck profile appearance', true, 'premium')
ON CONFLICT DO NOTHING;