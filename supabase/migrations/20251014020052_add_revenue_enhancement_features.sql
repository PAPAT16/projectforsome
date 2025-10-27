/*
  # Revenue Enhancement Features - Phase 1
  
  ## Overview
  This migration adds essential database structures for revenue enhancement including
  customer premium subscriptions, sponsored placements, enhanced analytics, and data products.
  
  ## New Tables
  
  ### 1. customer_subscriptions
  Premium subscription tiers for customers
  - `id` (uuid, PK) - Subscription identifier
  - `user_id` (uuid, FK to profiles) - Customer's profile
  - `subscription_tier` (text) - 'free', 'plus', 'premium'
  - `status` (text) - 'active', 'inactive', 'cancelled', 'trial'
  - `billing_cycle` (text) - 'monthly', 'annual'
  - `price_paid` (numeric) - Amount paid
  - `stripe_subscription_id` (text) - Stripe subscription reference
  - `stripe_customer_id` (text) - Stripe customer reference
  - `trial_ends_at` (timestamptz) - Trial expiration
  - `current_period_start` (timestamptz) - Billing period start
  - `current_period_end` (timestamptz) - Billing period end
  - `cancel_at_period_end` (boolean) - Cancel flag
  - `created_at` / `updated_at` (timestamptz) - Timestamps
  
  ### 2. sponsored_placements
  Paid promotional campaigns for food trucks
  - `id` (uuid, PK) - Campaign identifier
  - `food_truck_id` (uuid, FK) - Promoted truck
  - `placement_type` (text) - 'featured', 'boosted', 'map_premium'
  - `duration_hours` (integer) - Campaign duration
  - `price_paid` (numeric) - Cost of campaign
  - `status` (text) - 'active', 'scheduled', 'completed', 'cancelled'
  - `impressions` (integer) - View count
  - `clicks` (integer) - Click count
  - `starts_at` (timestamptz) - Campaign start
  - `ends_at` (timestamptz) - Campaign end
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. analytics_user_sessions
  Detailed user session tracking for data monetization
  - `id` (uuid, PK) - Session identifier
  - `user_id` (uuid, FK to profiles) - User (nullable for anonymous)
  - `session_id` (text) - Unique session identifier
  - `device_type` (text) - 'mobile', 'tablet', 'desktop'
  - `browser` (text) - Browser name
  - `os` (text) - Operating system
  - `referrer` (text) - Traffic source
  - `entry_page` (text) - Landing page
  - `exit_page` (text) - Last page viewed
  - `duration_seconds` (integer) - Session duration
  - `pages_viewed` (integer) - Page count
  - `location_lat` (numeric) - User location latitude
  - `location_lng` (numeric) - User location longitude
  - `created_at` (timestamptz) - Session start time
  
  ### 4. analytics_search_queries
  Search pattern tracking for market intelligence
  - `id` (uuid, PK) - Query identifier
  - `user_id` (uuid, FK to profiles) - User (nullable)
  - `search_query` (text) - Search text
  - `filters_used` (jsonb) - Applied filters
  - `results_count` (integer) - Number of results
  - `clicked_truck_id` (uuid, FK) - Selected truck (nullable)
  - `session_id` (text) - Related session
  - `created_at` (timestamptz) - Query timestamp
  
  ### 5. data_products
  Sold data reports and analytics products
  - `id` (uuid, PK) - Product identifier
  - `product_type` (text) - Report type
  - `title` (text) - Product title
  - `description` (text) - Product description
  - `price` (numeric) - Product price
  - `is_active` (boolean) - Availability status
  - `content_type` (text) - 'pdf', 'csv', 'json', 'dashboard'
  - `data_parameters` (jsonb) - Report parameters
  - `created_at` / `updated_at` (timestamptz) - Timestamps
  
  ### 6. data_product_sales
  Track data product purchases
  - `id` (uuid, PK) - Sale identifier
  - `product_id` (uuid, FK to data_products) - Product purchased
  - `buyer_email` (text) - Buyer contact
  - `buyer_organization` (text) - Buyer's company
  - `price_paid` (numeric) - Amount paid
  - `stripe_payment_id` (text) - Payment reference
  - `download_url` (text) - Product delivery link
  - `download_count` (integer) - Access count
  - `expires_at` (timestamptz) - Access expiration
  - `created_at` (timestamptz) - Purchase timestamp
  
  ### 7. promotional_campaigns
  Marketing blasts and notifications from truck owners
  - `id` (uuid, PK) - Campaign identifier
  - `food_truck_id` (uuid, FK) - Sending truck
  - `campaign_type` (text) - 'notification', 'deal', 'announcement'
  - `title` (text) - Campaign title
  - `message` (text) - Campaign message
  - `target_radius_miles` (numeric) - Geographic radius
  - `target_customer_tier` (text) - 'all', 'plus', 'premium'
  - `price_paid` (numeric) - Campaign cost
  - `status` (text) - 'draft', 'scheduled', 'sent', 'cancelled'
  - `recipients_count` (integer) - Target audience size
  - `opened_count` (integer) - Open rate
  - `clicked_count` (integer) - Click rate
  - `scheduled_for` (timestamptz) - Send time
  - `sent_at` (timestamptz) - Actual send time
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 8. ad_impressions
  Track ad views and clicks for revenue reporting
  - `id` (uuid, PK) - Impression identifier
  - `user_id` (uuid, FK) - Viewer (nullable)
  - `ad_unit_id` (text) - Ad placement identifier
  - `ad_network` (text) - 'adsense', 'sponsored'
  - `page_location` (text) - Where ad was shown
  - `impression_type` (text) - 'view', 'click'
  - `estimated_revenue` (numeric) - Revenue generated
  - `created_at` (timestamptz) - Event timestamp
  
  ## Security (Row Level Security)
  All tables have RLS enabled with appropriate policies for user privacy and admin access.
  
  ## Important Notes
  - Default values set for safe operation
  - Indexes created for query performance
  - Privacy-conscious design with nullable user_id for anonymous tracking
  - Comprehensive tracking for data monetization while respecting user privacy
*/

-- Create customer_subscriptions table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'premium')),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'trial')),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'annual')),
  price_paid numeric(10,2) DEFAULT 0,
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sponsored_placements table
CREATE TABLE IF NOT EXISTS sponsored_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE NOT NULL,
  placement_type text NOT NULL CHECK (placement_type IN ('featured', 'boosted', 'map_premium')),
  duration_hours integer NOT NULL DEFAULT 24,
  price_paid numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('active', 'scheduled', 'completed', 'cancelled')),
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_user_sessions table
CREATE TABLE IF NOT EXISTS analytics_user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  device_type text,
  browser text,
  os text,
  referrer text,
  entry_page text,
  exit_page text,
  duration_seconds integer DEFAULT 0,
  pages_viewed integer DEFAULT 1,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  created_at timestamptz DEFAULT now()
);

-- Create analytics_search_queries table
CREATE TABLE IF NOT EXISTS analytics_search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  search_query text NOT NULL,
  filters_used jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_truck_id uuid REFERENCES food_trucks(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Create data_products table
CREATE TABLE IF NOT EXISTS data_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL CHECK (product_type IN ('market_trends', 'location_intelligence', 'customer_insights', 'competition_analysis', 'custom_research')),
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  content_type text NOT NULL CHECK (content_type IN ('pdf', 'csv', 'json', 'dashboard')),
  data_parameters jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_product_sales table
CREATE TABLE IF NOT EXISTS data_product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES data_products(id) ON DELETE CASCADE NOT NULL,
  buyer_email text NOT NULL,
  buyer_organization text,
  price_paid numeric(10,2) NOT NULL,
  stripe_payment_id text,
  download_url text,
  download_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create promotional_campaigns table
CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('notification', 'deal', 'announcement')),
  title text NOT NULL,
  message text NOT NULL,
  target_radius_miles numeric(5,2) DEFAULT 5.0,
  target_customer_tier text DEFAULT 'all' CHECK (target_customer_tier IN ('all', 'plus', 'premium')),
  price_paid numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  recipients_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create ad_impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ad_unit_id text NOT NULL,
  ad_network text NOT NULL CHECK (ad_network IN ('adsense', 'sponsored')),
  page_location text NOT NULL,
  impression_type text NOT NULL CHECK (impression_type IN ('view', 'click')),
  estimated_revenue numeric(10,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_subs_user ON customer_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_subs_status ON customer_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_truck ON sponsored_placements(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_status ON sponsored_placements(status);
CREATE INDEX IF NOT EXISTS idx_sponsored_dates ON sponsored_placements(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON analytics_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session ON analytics_user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON analytics_user_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_user ON analytics_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_query ON analytics_search_queries(search_query);
CREATE INDEX IF NOT EXISTS idx_search_created ON analytics_search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_products_active ON data_products(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sales_product ON data_product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_truck ON promotional_campaigns(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_promo_status ON promotional_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at DESC);

-- Enable RLS
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Customer Subscriptions Policies

CREATE POLICY "Users can view their own subscription"
  ON customer_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON customer_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions"
  ON customer_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON customer_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sponsored Placements Policies

CREATE POLICY "Truck owners can create sponsored placements"
  ON sponsored_placements FOR INSERT
  TO authenticated
  WITH CHECK (
    food_truck_id IN (
      SELECT id FROM food_trucks WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Truck owners can view their placements"
  ON sponsored_placements FOR SELECT
  TO authenticated
  USING (
    food_truck_id IN (
      SELECT id FROM food_trucks WHERE owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active sponsored trucks"
  ON sponsored_placements FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all placements"
  ON sponsored_placements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Analytics Sessions Policies

CREATE POLICY "System can insert sessions"
  ON analytics_user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all sessions"
  ON analytics_user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Search Queries Policies

CREATE POLICY "System can insert search queries"
  ON analytics_search_queries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all searches"
  ON analytics_search_queries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Data Products Policies

CREATE POLICY "Anyone can view active products"
  ON data_products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage data products"
  ON data_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Data Product Sales Policies

CREATE POLICY "System can insert sales"
  ON data_product_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all sales"
  ON data_product_sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Promotional Campaigns Policies

CREATE POLICY "Truck owners can manage their campaigns"
  ON promotional_campaigns FOR ALL
  TO authenticated
  USING (
    food_truck_id IN (
      SELECT id FROM food_trucks WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all campaigns"
  ON promotional_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ad Impressions Policies

CREATE POLICY "System can insert ad impressions"
  ON ad_impressions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all ad data"
  ON ad_impressions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update sponsored placement status automatically
CREATE OR REPLACE FUNCTION update_sponsored_placement_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE sponsored_placements
  SET status = 'active'
  WHERE status = 'scheduled'
  AND starts_at <= now();
  
  UPDATE sponsored_placements
  SET status = 'completed'
  WHERE status = 'active'
  AND ends_at <= now();
END;
$$;

-- Function to track ad impression and revenue
CREATE OR REPLACE FUNCTION track_ad_impression(
  p_user_id uuid,
  p_ad_unit_id text,
  p_ad_network text,
  p_page_location text,
  p_impression_type text,
  p_estimated_revenue numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_impression_id uuid;
BEGIN
  INSERT INTO ad_impressions (
    user_id,
    ad_unit_id,
    ad_network,
    page_location,
    impression_type,
    estimated_revenue
  ) VALUES (
    p_user_id,
    p_ad_unit_id,
    p_ad_network,
    p_page_location,
    p_impression_type,
    p_estimated_revenue
  )
  RETURNING id INTO v_impression_id;
  
  RETURN v_impression_id;
END;
$$;