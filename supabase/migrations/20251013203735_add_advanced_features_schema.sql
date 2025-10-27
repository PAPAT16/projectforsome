/*
  # Advanced Features Complete Implementation
  
  This migration adds comprehensive features for enhanced Food Truck Live platform including
  push notifications, wait times, verification, announcements ticker, heatmap, A/B testing,
  API system, friends, challenges, gamification, weather, exports, and preferences.
*/

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs" ON push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SMS Preferences
CREATE TABLE IF NOT EXISTS sms_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  phone_number text NOT NULL,
  is_verified boolean DEFAULT false,
  verification_code text,
  verification_expires_at timestamptz,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sms_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SMS" ON sms_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  delivery_methods text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view queue" ON notification_queue FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Wait Times
CREATE TABLE IF NOT EXISTS truck_wait_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE UNIQUE,
  estimated_wait_minutes integer NOT NULL,
  queue_length integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_manual_override boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE truck_wait_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views wait times" ON truck_wait_times FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners manage wait times" ON truck_wait_times FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = truck_wait_times.food_truck_id AND food_trucks.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = truck_wait_times.food_truck_id AND food_trucks.owner_id = auth.uid()));

-- Wait Time History
CREATE TABLE IF NOT EXISTS wait_time_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  wait_minutes integer NOT NULL,
  queue_length integer DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE wait_time_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view wait history" ON wait_time_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = wait_time_history.food_truck_id AND food_trucks.owner_id = auth.uid()));

-- Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  business_license_number text,
  health_permit_number text,
  insurance_policy_number text,
  additional_info text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  verification_tier text DEFAULT 'basic'
);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own requests" ON verification_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = verification_requests.food_truck_id AND food_trucks.owner_id = auth.uid()));

CREATE POLICY "Owners create requests" ON verification_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = verification_requests.food_truck_id AND food_trucks.owner_id = auth.uid()));

CREATE POLICY "Admins manage requests" ON verification_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Verification Documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id uuid NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage docs" ON verification_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM verification_requests vr JOIN food_trucks ft ON ft.id = vr.food_truck_id 
    WHERE vr.id = verification_documents.verification_request_id AND ft.owner_id = auth.uid()));

CREATE POLICY "Admins view docs" ON verification_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Platform Announcements
CREATE TABLE IF NOT EXISTS platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'general',
  priority integer DEFAULT 1,
  color_scheme text DEFAULT 'blue',
  link_url text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active announcements" ON platform_announcements FOR SELECT TO authenticated
  USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins manage announcements" ON platform_announcements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Announcement Views
CREATE TABLE IF NOT EXISTS announcement_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES platform_announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  clicked boolean DEFAULT false,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create views" ON announcement_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view analytics" ON announcement_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Location Analytics
CREATE TABLE IF NOT EXISTS location_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  event_type text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE location_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System inserts analytics" ON location_analytics FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins view analytics" ON location_analytics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Heatmap Cache
CREATE TABLE IF NOT EXISTS heatmap_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_lat numeric(10, 7) NOT NULL,
  grid_lng numeric(10, 7) NOT NULL,
  intensity integer NOT NULL,
  date_range text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  UNIQUE(grid_lat, grid_lng, date_range)
);

ALTER TABLE heatmap_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view heatmap" ON heatmap_cache FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Continued in next part due to length
