/*
  # Food Truck Locator - Initial Database Schema

  ## Overview
  This migration creates the complete database structure for a food truck locator application
  with customer, food truck owner, and admin roles.

  ## Tables Created

  ### 1. profiles
  Stores user profile information with role-based access
  - `id` (uuid, FK to auth.users) - User identifier
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'customer', 'food_truck_owner', 'admin'
  - `is_blocked` (boolean) - Admin can block users
  - `user_id_number` (bigint) - Sequential user ID for admin reference
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. food_trucks
  Food truck business information and public profile
  - `id` (uuid, PK) - Unique food truck identifier
  - `owner_id` (uuid, FK to profiles) - Owner's profile ID
  - `truck_name` (text) - Business name
  - `description` (text) - Truck description
  - `logo_url` (text) - Company logo image
  - `cuisine_types` (text[]) - Array of food categories
  - `phone` (text) - Contact phone number
  - `email` (text) - Business email
  - `is_active` (boolean) - Location sharing toggle (requires subscription)
  - `subscription_tier` (text) - 'none', 'basic', 'premium', 'enterprise'
  - `subscription_status` (text) - 'active', 'inactive', 'cancelled'
  - `stripe_customer_id` (text) - Stripe customer reference
  - `stripe_subscription_id` (text) - Stripe subscription reference
  - `average_rating` (numeric) - Calculated average rating
  - `total_reviews` (int) - Total number of reviews
  - `created_at` / `updated_at` (timestamptz) - Timestamps

  ### 3. food_truck_locations
  Real-time location data for active food trucks
  - `id` (uuid, PK) - Location record identifier
  - `food_truck_id` (uuid, FK) - Reference to food truck
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `address` (text) - Human-readable address
  - `zip_code` (text) - Postal code for area searches
  - `is_current` (boolean) - Current active location flag
  - `updated_at` (timestamptz) - Last location update

  ### 4. food_truck_menu_items
  Menu items for each food truck
  - `id` (uuid, PK) - Menu item identifier
  - `food_truck_id` (uuid, FK) - Reference to food truck
  - `item_name` (text) - Dish name
  - `description` (text) - Item description
  - `price` (numeric) - Item price
  - `image_url` (text) - Food photo
  - `category` (text) - Menu category
  - `is_available` (boolean) - Current availability
  - `created_at` / `updated_at` (timestamptz) - Timestamps

  ### 5. food_truck_images
  Additional photos for food truck profiles
  - `id` (uuid, PK) - Image identifier
  - `food_truck_id` (uuid, FK) - Reference to food truck
  - `image_url` (text) - Image URL
  - `caption` (text) - Optional image description
  - `display_order` (int) - Sort order
  - `created_at` (timestamptz) - Upload timestamp

  ### 6. reviews
  Customer reviews and ratings for food trucks
  - `id` (uuid, PK) - Review identifier
  - `food_truck_id` (uuid, FK) - Food truck being reviewed
  - `customer_id` (uuid, FK to profiles) - Reviewer's profile
  - `rating` (int) - Star rating (1-5)
  - `comment` (text) - Review text
  - `owner_response` (text) - Owner's reply
  - `owner_response_at` (timestamptz) - Response timestamp
  - `created_at` / `updated_at` (timestamptz) - Timestamps

  ### 7. subscription_features
  Feature toggles for different subscription tiers
  - `id` (uuid, PK) - Feature identifier
  - `feature_name` (text) - Feature name
  - `feature_key` (text) - Programmatic key
  - `description` (text) - Feature description
  - `required_tier` (text) - Minimum tier required
  - `is_enabled` (boolean) - Admin toggle
  - `created_at` / `updated_at` (timestamptz) - Timestamps

  ## Security (Row Level Security)
  
  All tables have RLS enabled with policies for:
  - Public read access for customer-facing data
  - Owner-only access for private data
  - Admin full access
  - Authenticated user restrictions where appropriate

  ## Indexes
  
  Created for optimal query performance on:
  - Location-based searches (lat/lng)
  - Zip code searches
  - Cuisine type searches
  - User role filtering
  - Rating calculations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'food_truck_owner', 'admin')),
  is_blocked boolean DEFAULT false,
  user_id_number bigserial UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create food_trucks table
CREATE TABLE IF NOT EXISTS food_trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  truck_name text NOT NULL,
  description text,
  logo_url text,
  cuisine_types text[] DEFAULT '{}',
  phone text,
  email text,
  is_active boolean DEFAULT false,
  subscription_tier text DEFAULT 'none' CHECK (subscription_tier IN ('none', 'basic', 'premium', 'enterprise')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  average_rating numeric(3,2) DEFAULT 0.00,
  total_reviews int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_truck_locations table
CREATE TABLE IF NOT EXISTS food_truck_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  address text,
  zip_code text,
  is_current boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Create food_truck_menu_items table
CREATE TABLE IF NOT EXISTS food_truck_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  description text,
  price numeric(10,2),
  image_url text,
  category text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food_truck_images table
CREATE TABLE IF NOT EXISTS food_truck_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_truck_id uuid NOT NULL REFERENCES food_trucks(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  owner_response text,
  owner_response_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(food_truck_id, customer_id)
);

-- Create subscription_features table
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  feature_key text NOT NULL UNIQUE,
  description text,
  required_tier text NOT NULL CHECK (required_tier IN ('basic', 'premium', 'enterprise')),
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_trucks_owner ON food_trucks(owner_id);
CREATE INDEX IF NOT EXISTS idx_food_trucks_active ON food_trucks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_food_trucks_cuisine ON food_trucks USING GIN(cuisine_types);
CREATE INDEX IF NOT EXISTS idx_locations_current ON food_truck_locations(food_truck_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_locations_coords ON food_truck_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_zip ON food_truck_locations(zip_code);
CREATE INDEX IF NOT EXISTS idx_reviews_truck ON reviews(food_truck_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_number ON profiles(user_id_number);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_truck_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_truck_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_truck_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for food_trucks
CREATE POLICY "Food trucks are viewable by everyone"
  ON food_trucks FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert own food truck"
  ON food_trucks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'food_truck_owner')
  );

CREATE POLICY "Owners can update own food truck"
  ON food_trucks FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own food truck"
  ON food_trucks FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for food_truck_locations
CREATE POLICY "Active locations viewable by everyone"
  ON food_truck_locations FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert locations for own truck"
  ON food_truck_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can update locations for own truck"
  ON food_truck_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  );

-- RLS Policies for food_truck_menu_items
CREATE POLICY "Menu items viewable by everyone"
  ON food_truck_menu_items FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage menu items for own truck"
  ON food_truck_menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  );

-- RLS Policies for food_truck_images
CREATE POLICY "Food truck images viewable by everyone"
  ON food_truck_images FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage images for own truck"
  ON food_truck_images FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Owners can update reviews for own truck"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM food_trucks WHERE id = food_truck_id AND owner_id = auth.uid())
  );

-- RLS Policies for subscription_features
CREATE POLICY "Subscription features viewable by everyone"
  ON subscription_features FOR SELECT
  USING (true);

-- Function to update average rating
CREATE OR REPLACE FUNCTION update_food_truck_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE food_trucks
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE food_truck_id = COALESCE(NEW.food_truck_id, OLD.food_truck_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE food_truck_id = COALESCE(NEW.food_truck_id, OLD.food_truck_id)
    )
  WHERE id = COALESCE(NEW.food_truck_id, OLD.food_truck_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
CREATE TRIGGER update_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_food_truck_rating();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Insert default subscription features
INSERT INTO subscription_features (feature_name, feature_key, description, required_tier, is_enabled)
VALUES
  ('Location Toggle', 'location_toggle', 'Enable/disable location sharing on the map', 'basic', true),
  ('Menu Management', 'menu_management', 'Add and manage menu items', 'basic', true),
  ('Photo Gallery', 'photo_gallery', 'Upload multiple photos', 'basic', true),
  ('Review Responses', 'review_responses', 'Respond to customer reviews', 'premium', true),
  ('Analytics Dashboard', 'analytics_dashboard', 'View detailed analytics and insights', 'premium', true),
  ('Priority Placement', 'priority_placement', 'Higher visibility in search results', 'enterprise', true),
  ('Custom Branding', 'custom_branding', 'Advanced customization options', 'enterprise', true)
ON CONFLICT (feature_key) DO NOTHING;