/*
  # Add Rewards, Badges, and Contests System

  1. New Tables
    
    ## Badges Table
    - `id` (uuid, primary key)
    - `name` (text) - Badge name
    - `description` (text) - Badge description
    - `icon` (text) - Icon/emoji for badge
    - `badge_type` (text) - 'visits', 'cuisine', 'reviews', 'streak', 'special'
    - `requirement_value` (integer) - Number needed to unlock
    - `requirement_type` (text) - 'truck_visits', 'cuisine_types', 'reviews_written', 'consecutive_days', 'special_event'
    - `points_value` (integer) - Points awarded for earning badge
    - `is_active` (boolean)
    - `created_at` (timestamptz)
    
    ## User Badges Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles.id)
    - `badge_id` (uuid, references badges.id)
    - `earned_at` (timestamptz)
    - `progress` (integer) - Current progress toward badge
    
    ## User Points Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles.id)
    - `total_points` (integer)
    - `current_streak` (integer) - Days streak
    - `longest_streak` (integer)
    - `last_activity_date` (date)
    - `level` (integer)
    - `updated_at` (timestamptz)
    
    ## Contests Table
    - `id` (uuid, primary key)
    - `title` (text)
    - `description` (text)
    - `contest_type` (text) - 'most_visits', 'cuisine_explorer', 'review_champion', 'custom'
    - `start_date` (timestamptz)
    - `end_date` (timestamptz)
    - `prize_description` (text)
    - `status` (text) - 'upcoming', 'active', 'completed'
    - `rules` (jsonb)
    - `is_active` (boolean)
    - `created_at` (timestamptz)
    
    ## Contest Participants Table
    - `id` (uuid, primary key)
    - `contest_id` (uuid, references contests.id)
    - `user_id` (uuid, references profiles.id)
    - `score` (integer)
    - `rank` (integer)
    - `metadata` (jsonb) - Additional data
    - `joined_at` (timestamptz)
    - `updated_at` (timestamptz)
    
    ## User Activities Table (for tracking)
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles.id)
    - `activity_type` (text) - 'truck_visit', 'review_posted', 'check_in'
    - `food_truck_id` (uuid, references food_trucks.id)
    - `points_earned` (integer)
    - `metadata` (jsonb)
    - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on all tables
    - Users can view their own badges and points
    - Users can participate in contests
    - Admins can manage badges and contests
*/

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('visits', 'cuisine', 'reviews', 'streak', 'special')),
  requirement_value integer NOT NULL DEFAULT 1,
  requirement_type text NOT NULL CHECK (requirement_type IN ('truck_visits', 'cuisine_types', 'reviews_written', 'consecutive_days', 'special_event')),
  points_value integer NOT NULL DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  level integer DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  contest_type text NOT NULL CHECK (contest_type IN ('most_visits', 'cuisine_explorer', 'review_champion', 'custom')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  prize_description text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  rules jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create contest_participants table
CREATE TABLE IF NOT EXISTS contest_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0,
  rank integer,
  metadata jsonb DEFAULT '{}',
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('truck_visit', 'review_posted', 'check_in', 'cuisine_tried')),
  food_truck_id uuid REFERENCES food_trucks(id) ON DELETE SET NULL,
  points_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user ON contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Badges Policies
CREATE POLICY "Anyone can view active badges"
  ON badges FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
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

-- User Badges Policies
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can award badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update badge progress"
  ON user_badges FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Points Policies
CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view all points for leaderboard"
  ON user_points FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage user points"
  ON user_points FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contests Policies
CREATE POLICY "Users can view active contests"
  ON contests FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage contests"
  ON contests FOR ALL
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

-- Contest Participants Policies
CREATE POLICY "Users can view contest participants"
  ON contest_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join contests"
  ON contest_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update contest scores"
  ON contest_participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User Activities Policies
CREATE POLICY "Users can view their activities"
  ON user_activities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can log activities"
  ON user_activities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to initialize user points
CREATE OR REPLACE FUNCTION initialize_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_points (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to initialize points for new users
DROP TRIGGER IF EXISTS trigger_initialize_user_points ON profiles;
CREATE TRIGGER trigger_initialize_user_points
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_points();

-- Function to award points and update level
CREATE OR REPLACE FUNCTION award_points(
  p_user_id uuid,
  p_points integer,
  p_activity_type text,
  p_food_truck_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_total integer;
  v_new_level integer;
BEGIN
  -- Log the activity
  INSERT INTO user_activities (user_id, activity_type, food_truck_id, points_earned, metadata)
  VALUES (p_user_id, p_activity_type, p_food_truck_id, p_points, p_metadata);
  
  -- Update user points
  INSERT INTO user_points (user_id, total_points, level)
  VALUES (p_user_id, p_points, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = user_points.total_points + p_points,
    updated_at = now()
  RETURNING total_points INTO v_new_total;
  
  -- Calculate new level (every 100 points = 1 level)
  v_new_level := FLOOR(v_new_total / 100.0) + 1;
  
  -- Update level
  UPDATE user_points
  SET level = v_new_level
  WHERE user_id = p_user_id;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_date date;
  v_current_streak integer;
  v_longest_streak integer;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_points
  WHERE user_id = p_user_id;
  
  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE THEN
    -- First activity or new day
    IF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day
      v_current_streak := v_current_streak + 1;
    ELSIF v_last_date < CURRENT_DATE - INTERVAL '1 day' THEN
      -- Streak broken
      v_current_streak := 1;
    END IF;
    
    -- Update longest streak if needed
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
    
    -- Update the record
    UPDATE user_points
    SET 
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Insert default badges
INSERT INTO badges (name, description, icon, badge_type, requirement_value, requirement_type, points_value) VALUES
('First Timer', 'Visit your first food truck', '🌟', 'visits', 1, 'truck_visits', 10),
('Truck Explorer', 'Visit 5 different food trucks', '🚚', 'visits', 5, 'truck_visits', 25),
('Truck Enthusiast', 'Visit 10 different food trucks', '🎯', 'visits', 10, 'truck_visits', 50),
('Truck Master', 'Visit 25 different food trucks', '👑', 'visits', 25, 'truck_visits', 100),
('Taste Tester', 'Try 3 different cuisine types', '🍜', 'cuisine', 3, 'cuisine_types', 20),
('Culinary Explorer', 'Try 5 different cuisine types', '🌮', 'cuisine', 5, 'cuisine_types', 40),
('Foodie', 'Try 10 different cuisine types', '🍱', 'cuisine', 10, 'cuisine_types', 75),
('Review Writer', 'Write your first review', '✍️', 'reviews', 1, 'reviews_written', 15),
('Critic', 'Write 5 reviews', '📝', 'reviews', 5, 'reviews_written', 35),
('Food Blogger', 'Write 10 reviews', '📰', 'reviews', 10, 'reviews_written', 60),
('3-Day Streak', 'Check in 3 days in a row', '🔥', 'streak', 3, 'consecutive_days', 20),
('Week Warrior', 'Check in 7 days in a row', '⚡', 'streak', 7, 'consecutive_days', 50),
('Month Master', 'Check in 30 days in a row', '💎', 'streak', 30, 'consecutive_days', 150)
ON CONFLICT DO NOTHING;
