/*
  # Add Messaging System, Affiliate Marketing, and Analytics

  1. New Tables
    
    ## Messages Table
    - `id` (uuid, primary key)
    - `sender_id` (uuid, references profiles.id) - Admin sender
    - `recipient_id` (uuid, nullable, references profiles.id) - Specific user recipient (null for site-wide)
    - `recipient_type` (text) - 'all', 'customers', 'food_truck_owners', 'individual'
    - `subject` (text)
    - `message` (text)
    - `is_read` (boolean, default false)
    - `read_at` (timestamptz, nullable)
    - `created_at` (timestamptz)
    
    ## Affiliates Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles.id) - Customer who becomes affiliate
    - `affiliate_code` (text, unique) - Unique referral code
    - `status` (text) - 'pending', 'active', 'suspended'
    - `commission_rate` (numeric) - Percentage commission (e.g., 10.00 for 10%)
    - `total_referrals` (integer, default 0)
    - `total_earnings` (numeric, default 0)
    - `pending_earnings` (numeric, default 0)
    - `paid_earnings` (numeric, default 0)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ## Affiliate Referrals Table
    - `id` (uuid, primary key)
    - `affiliate_id` (uuid, references affiliates.id)
    - `food_truck_id` (uuid, references food_trucks.id)
    - `status` (text) - 'pending', 'approved', 'paid', 'rejected'
    - `commission_amount` (numeric)
    - `created_at` (timestamptz)
    - `approved_at` (timestamptz, nullable)
    - `paid_at` (timestamptz, nullable)
    
    ## Analytics Events Table
    - `id` (uuid, primary key)
    - `event_type` (text) - 'truck_view', 'profile_view', 'menu_view', 'location_check', 'review_added'
    - `food_truck_id` (uuid, nullable, references food_trucks.id)
    - `user_id` (uuid, nullable, references profiles.id)
    - `metadata` (jsonb) - Additional event data
    - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on all new tables
    - Add policies for admin access to messages
    - Add policies for users to read their own messages
    - Add policies for affiliates to view their own data
    - Add policies for admin to manage affiliates and view analytics
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_type text NOT NULL DEFAULT 'individual' CHECK (recipient_type IN ('all', 'customers', 'food_truck_owners', 'individual')),
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  affiliate_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  commission_rate numeric NOT NULL DEFAULT 10.00,
  total_referrals integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  pending_earnings numeric DEFAULT 0,
  paid_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create affiliate_referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  commission_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('truck_view', 'profile_view', 'menu_view', 'location_check', 'review_added', 'page_view', 'search')),
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_truck ON affiliate_referrals(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_truck ON analytics_events(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Messages Policies

CREATE POLICY "Admins can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    (recipient_type = 'all') OR
    (recipient_type = 'customers' AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'customer'
    )) OR
    (recipient_type = 'food_truck_owners' AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'food_truck_owner'
    ))
  );

CREATE POLICY "Users can update their message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Affiliates Policies

CREATE POLICY "Users can create their own affiliate account"
  ON affiliates FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'customer'
    )
  );

CREATE POLICY "Users can view their own affiliate data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update affiliate data"
  ON affiliates FOR UPDATE
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

-- Affiliate Referrals Policies

CREATE POLICY "Affiliates can view their own referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = affiliate_referrals.affiliate_id
      AND affiliates.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert referrals"
  ON affiliate_referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update referrals"
  ON affiliate_referrals FOR UPDATE
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

-- Analytics Events Policies

CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Food truck owners can view their truck analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    food_truck_id IN (
      SELECT id FROM food_trucks
      WHERE owner_id = auth.uid()
    )
  );

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'FTL' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Function to update affiliate earnings when referral is approved
CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE affiliates
    SET 
      total_referrals = total_referrals + 1,
      pending_earnings = pending_earnings + NEW.commission_amount,
      updated_at = now()
    WHERE id = NEW.affiliate_id;
  ELSIF NEW.status = 'paid' AND OLD.status = 'approved' THEN
    UPDATE affiliates
    SET 
      pending_earnings = pending_earnings - NEW.commission_amount,
      paid_earnings = paid_earnings + NEW.commission_amount,
      total_earnings = total_earnings + NEW.commission_amount,
      updated_at = now()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for affiliate earnings
DROP TRIGGER IF EXISTS trigger_update_affiliate_earnings ON affiliate_referrals;
CREATE TRIGGER trigger_update_affiliate_earnings
  AFTER UPDATE ON affiliate_referrals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_affiliate_earnings();
