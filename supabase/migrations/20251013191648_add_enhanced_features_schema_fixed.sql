/*
  # Enhanced Features Schema

  1. New Tables
    - `customer_favorites`
      - Links customers to their favorite food trucks
      - Tracks when favorited and notification preferences
    
    - `user_notifications`
      - Stores push notifications for users
      - Tracks read/unread status and notification type
    
    - `review_photos`
      - Photos attached to customer reviews
      - Stores image URLs and display order
    
    - `social_activities`
      - Activity feed entries (check-ins, reviews, badges earned)
      - Powers social feed on customer dashboard
    
    - `user_follows`
      - Tracks which users follow which food trucks
      - Enables following functionality
    
    - `featured_placements`
      - Paid featured placement slots for trucks
      - Includes start/end dates and pricing
    
    - `ad_campaigns`
      - Advertising campaigns created by truck owners
      - Tracks budget, targeting, and performance
    
    - `ad_impressions`
      - Individual ad views and clicks
      - Powers advertising analytics
    
    - `analytics_events`
      - Generic event tracking for platform analytics
      - Tracks user actions and behaviors
    
    - `customer_preferences`
      - Customer dietary restrictions and preferences
      - Notification settings and other preferences
    
    - `daily_challenges`
      - Daily rotating challenges for gamification
      - Admin-created challenges with rewards
    
    - `user_challenge_progress`
      - Tracks user progress on daily challenges
      - Links to daily_challenges table
    
    - `truck_analytics_summary`
      - Aggregated analytics for truck owners
      - Pre-calculated metrics for faster dashboard loading

  2. Table Modifications
    - Add dietary info columns to food_trucks table
    - Add referral tracking to profiles table
    - Add featured status to food_trucks

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
    - Restrict admin-only tables
*/

-- Customer Favorites
CREATE TABLE IF NOT EXISTS customer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  notify_when_online boolean DEFAULT true,
  notify_when_nearby boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, food_truck_id)
);

ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON customer_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON customer_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON customer_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON customer_favorites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  related_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Review Photos
CREATE TABLE IF NOT EXISTS review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved review photos"
  ON review_photos FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "Review authors can manage their photos"
  ON review_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_photos.review_id
      AND reviews.customer_id = auth.uid()
    )
  );

-- Social Activities
CREATE TABLE IF NOT EXISTS social_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE,
  related_id uuid,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public activities"
  ON social_activities FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create own activities"
  ON social_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Follows
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, food_truck_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows"
  ON user_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own follows"
  ON user_follows FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Featured Placements
CREATE TABLE IF NOT EXISTS featured_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  placement_type text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  price_paid decimal(10,2) NOT NULL,
  status text DEFAULT 'active',
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE featured_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Truck owners can view own placements"
  ON featured_placements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = featured_placements.food_truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- Ad Campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_type text NOT NULL,
  budget_amount decimal(10,2) NOT NULL,
  spent_amount decimal(10,2) DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  target_radius_miles integer DEFAULT 10,
  status text DEFAULT 'active',
  ad_content jsonb,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Truck owners can view own campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = ad_campaigns.food_truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

CREATE POLICY "Truck owners can manage own campaigns"
  ON ad_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = ad_campaigns.food_truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = ad_campaigns.food_truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- Ad Impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id uuid REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  placement_id uuid REFERENCES featured_placements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  impression_type text NOT NULL,
  clicked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign owners can view impressions"
  ON ad_impressions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      JOIN food_trucks ON food_trucks.id = ad_campaigns.food_truck_id
      WHERE ad_campaigns.id = ad_impressions.ad_campaign_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customer Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dietary_restrictions text[] DEFAULT '{}',
  favorite_cuisines text[] DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{"push_enabled": true, "email_enabled": true, "favorites_online": true, "nearby_trucks": true, "daily_challenges": true}'::jsonb,
  search_radius_default integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON customer_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON customer_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily Challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_name text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL,
  requirement_value integer NOT NULL,
  points_reward integer NOT NULL,
  badge_reward_id uuid REFERENCES badges(id) ON DELETE SET NULL,
  active_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON daily_challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON daily_challenges FOR ALL
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

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress"
  ON user_challenge_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
  ON user_challenge_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Truck Analytics Summary
CREATE TABLE IF NOT EXISTS truck_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  date date NOT NULL,
  profile_views integer DEFAULT 0,
  map_clicks integer DEFAULT 0,
  phone_clicks integer DEFAULT 0,
  direction_clicks integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  favorite_adds integer DEFAULT 0,
  favorite_removes integer DEFAULT 0,
  reviews_received integer DEFAULT 0,
  average_rating_for_day decimal(3,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(food_truck_id, date)
);

ALTER TABLE truck_analytics_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Truck owners can view own analytics"
  ON truck_analytics_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM food_trucks
      WHERE food_trucks.id = truck_analytics_summary.food_truck_id
      AND food_trucks.owner_id = auth.uid()
    )
  );

-- Add new columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_trucks' AND column_name = 'dietary_options'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN dietary_options text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_trucks' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_trucks' AND column_name = 'featured_until'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN featured_until timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_favorites_user ON customer_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_truck ON customer_favorites(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_social_activities_created ON social_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_activities_user ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_user ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_truck ON user_follows(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_featured_placements_dates ON featured_placements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_truck ON analytics_events(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_analytics_date ON truck_analytics_summary(food_truck_id, date DESC);