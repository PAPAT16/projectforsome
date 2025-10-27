/*
  # Advanced Features Part 2
  
  Continuation of advanced features: A/B testing, API system, friends, 
  challenges, gamification, weather, exports, and preferences
*/

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL UNIQUE,
  description text,
  variants jsonb NOT NULL,
  traffic_allocation numeric(3, 2) DEFAULT 1.0,
  status text DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  winning_variant text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tests" ON ab_tests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- A/B Test Assignments
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(test_id, user_id)
);

ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own assignments" ON ab_test_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System assigns tests" ON ab_test_assignments FOR INSERT TO authenticated WITH CHECK (true);

-- A/B Test Metrics
CREATE TABLE IF NOT EXISTS ab_test_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  variant text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE ab_test_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view metrics" ON ab_test_metrics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"read": true, "write": false}'::jsonb,
  rate_limit_per_hour integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own API keys" ON api_keys FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- API Usage Logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer,
  requested_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Key owners view usage" ON api_usage_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM api_keys WHERE api_keys.id = api_usage_logs.api_key_id AND api_keys.owner_id = auth.uid()));

-- User Friends
CREATE TABLE IF NOT EXISTS user_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view friendships" ON user_friends FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users create requests" ON user_friends FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update friendships" ON user_friends FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users delete friendships" ON user_friends FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Activities
CREATE TABLE IF NOT EXISTS friend_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb,
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view friend activities" ON friend_activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_friends
      WHERE ((user_friends.user_id = auth.uid() AND user_friends.friend_id = friend_activities.user_id)
      OR (user_friends.friend_id = auth.uid() AND user_friends.user_id = friend_activities.user_id))
      AND user_friends.status = 'accepted'
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users create activities" ON friend_activities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Food Challenges
CREATE TABLE IF NOT EXISTS food_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_name text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL,
  requirements jsonb NOT NULL,
  points_reward integer DEFAULT 0,
  prize_description text,
  prize_value numeric(10, 2),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  max_participants integer,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views challenges" ON food_challenges FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage challenges" ON food_challenges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Challenge Participation
CREATE TABLE IF NOT EXISTS challenge_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES food_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress jsonb DEFAULT '{}'::jsonb,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  prize_claimed boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view participation" ON challenge_participation FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage participation" ON challenge_participation FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Challenge Prizes
CREATE TABLE IF NOT EXISTS challenge_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES food_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prize_code text UNIQUE,
  claimed_at timestamptz DEFAULT now(),
  redeemed_at timestamptz,
  redemption_location text
);

ALTER TABLE challenge_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view prizes" ON challenge_prizes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- User Points
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_points integer DEFAULT 0,
  lifetime_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_checkin_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own points" ON user_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone views leaderboard" ON user_points FOR SELECT TO authenticated
  USING (true);

-- Check-ins
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  points_earned integer DEFAULT 10,
  is_verified boolean DEFAULT false,
  checkin_at timestamptz DEFAULT now()
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view checkins" ON checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create checkins" ON checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Weather Cache
CREATE TABLE IF NOT EXISTS weather_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  weather_data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views weather" ON weather_cache FOR SELECT TO authenticated
  USING (expires_at > now());

-- Truck Weather Tags
CREATE TABLE IF NOT EXISTS truck_weather_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  weather_conditions text[] DEFAULT '{}',
  season_tags text[] DEFAULT '{}',
  temperature_preference text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(food_truck_id)
);

ALTER TABLE truck_weather_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views weather tags" ON truck_weather_tags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners manage tags" ON truck_weather_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = truck_weather_tags.food_truck_id AND food_trucks.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM food_trucks WHERE food_trucks.id = truck_weather_tags.food_truck_id AND food_trucks.owner_id = auth.uid()));

-- Export Requests
CREATE TABLE IF NOT EXISTS export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type text NOT NULL,
  parameters jsonb,
  status text DEFAULT 'pending',
  file_url text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view exports" ON export_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create exports" ON export_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  display_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage preferences" ON user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Translations
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  language text NOT NULL,
  value text NOT NULL,
  context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(key, language)
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views translations" ON translations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage translations" ON translations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Add columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_trucks' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_trucks' AND column_name = 'verification_tier'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN verification_tier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_trucks' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'food_trucks' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE food_trucks ADD COLUMN price_range text DEFAULT '$';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_wait_times_truck ON truck_wait_times(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_wait_history_truck ON wait_time_history(food_truck_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_verify_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON platform_announcements(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_location_analytics_coords ON location_analytics(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_heatmap_grid ON heatmap_cache(grid_lat, grid_lng, date_range);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage_logs(api_key_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_friends_user ON user_friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_activities_user ON friend_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON food_challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participation_user ON challenge_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_points_leaderboard ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id, checkin_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_coords ON weather_cache(latitude, longitude, expires_at);
CREATE INDEX IF NOT EXISTS idx_exports_user ON export_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prefs_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key, language);
