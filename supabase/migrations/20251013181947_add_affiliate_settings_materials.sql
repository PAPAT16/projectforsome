/*
  # Add Affiliate Settings and Marketing Materials

  1. New Tables
    
    ## Affiliate Settings Table
    - `id` (uuid, primary key)
    - `commission_rate_default` (numeric) - Default commission rate for new affiliates
    - `payment_terms` (text) - Payment terms description
    - `approval_required` (boolean) - Whether affiliates need approval
    - `minimum_payout` (numeric) - Minimum amount for payout
    - `payout_schedule` (text) - 'weekly', 'monthly', 'quarterly'
    - `terms_and_conditions` (text) - Terms and conditions text
    - `welcome_message` (text) - Message shown to new affiliates
    - `updated_at` (timestamptz)
    - `updated_by` (uuid, references profiles.id)
    
    ## Affiliate Materials Table
    - `id` (uuid, primary key)
    - `title` (text) - Material title
    - `description` (text) - Material description
    - `material_type` (text) - 'banner', 'email_template', 'social_post', 'guide', 'link'
    - `content` (text) - Material content (HTML, text, or URL)
    - `thumbnail_url` (text, nullable) - Preview image
    - `is_active` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    
  2. Security
    - Enable RLS on both tables
    - Only admins can modify settings and materials
    - Affiliates can view materials
*/

-- Create affiliate_settings table (single row configuration)
CREATE TABLE IF NOT EXISTS affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate_default numeric NOT NULL DEFAULT 10.00,
  payment_terms text DEFAULT 'Payments are processed monthly for approved referrals.',
  approval_required boolean DEFAULT true,
  minimum_payout numeric DEFAULT 50.00,
  payout_schedule text NOT NULL DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'monthly', 'quarterly')),
  terms_and_conditions text DEFAULT 'By joining our affiliate program, you agree to promote our services ethically and in compliance with all applicable laws.',
  welcome_message text DEFAULT 'Welcome to our affiliate program! Start sharing your referral link to earn commissions.',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create affiliate_materials table
CREATE TABLE IF NOT EXISTS affiliate_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  material_type text NOT NULL CHECK (material_type IN ('banner', 'email_template', 'social_post', 'guide', 'link', 'video')),
  content text NOT NULL,
  thumbnail_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings (only if table is empty)
INSERT INTO affiliate_settings (commission_rate_default, payment_terms, approval_required, minimum_payout, payout_schedule, terms_and_conditions, welcome_message)
SELECT 
  10.00,
  'Payments are processed monthly for approved referrals. Commission is earned when a referred food truck signs up for a paid subscription.',
  true,
  50.00,
  'monthly',
  E'AFFILIATE PROGRAM TERMS AND CONDITIONS\n\n1. COMMISSION STRUCTURE\n- Affiliates earn 10% commission on the first payment from referred food trucks\n- Commission is calculated based on the subscription tier selected by the referred business\n\n2. PAYMENT TERMS\n- Payments are processed monthly\n- Minimum payout threshold is $50\n- Payments are made via bank transfer or PayPal\n\n3. REFERRAL REQUIREMENTS\n- Referred food trucks must be new customers\n- The referred business must complete signup and make their first payment\n- Self-referrals are not permitted\n\n4. AFFILIATE CONDUCT\n- Promote services ethically and honestly\n- Do not use spam or misleading advertising\n- Comply with all applicable laws and regulations\n\n5. TERMINATION\n- We reserve the right to terminate affiliate accounts for violation of terms\n- Outstanding commissions will be paid upon termination if threshold is met',
  'Welcome to the Food Truck Live Affiliate Program! Share your unique referral link with food truck owners and earn commission when they sign up. Check out the marketing materials below to help you get started.'
WHERE NOT EXISTS (SELECT 1 FROM affiliate_settings);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_materials_type ON affiliate_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_materials_active ON affiliate_materials(is_active);

-- Enable RLS
ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_materials ENABLE ROW LEVEL SECURITY;

-- Affiliate Settings Policies

CREATE POLICY "Admins can view affiliate settings"
  ON affiliate_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update affiliate settings"
  ON affiliate_settings FOR UPDATE
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

-- Affiliate Materials Policies

CREATE POLICY "Admins can manage materials"
  ON affiliate_materials FOR ALL
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

CREATE POLICY "Affiliates can view active materials"
  ON affiliate_materials FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.user_id = auth.uid()
      AND affiliates.status = 'active'
    )
  );

-- Function to update affiliate settings timestamp
CREATE OR REPLACE FUNCTION update_affiliate_settings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Create trigger for affiliate settings
DROP TRIGGER IF EXISTS trigger_update_affiliate_settings_timestamp ON affiliate_settings;
CREATE TRIGGER trigger_update_affiliate_settings_timestamp
  BEFORE UPDATE ON affiliate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_settings_timestamp();

-- Function to update affiliate materials timestamp
CREATE OR REPLACE FUNCTION update_affiliate_materials_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for affiliate materials
DROP TRIGGER IF EXISTS trigger_update_affiliate_materials_timestamp ON affiliate_materials;
CREATE TRIGGER trigger_update_affiliate_materials_timestamp
  BEFORE UPDATE ON affiliate_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_materials_timestamp();
