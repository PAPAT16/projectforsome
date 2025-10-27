/*
  # Fix ad_impressions RLS policy

  1. Changes
    - Update INSERT policy to allow both authenticated and anonymous users
    - This enables ad tracking for all visitors
  
  2. Security
    - Allow public to insert ad impressions
    - Keep SELECT policies restricted to admins and campaign owners
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "System can insert ad impressions" ON ad_impressions;

-- Create new policy that allows all users to insert ad impressions
CREATE POLICY "Anyone can insert ad impressions"
  ON ad_impressions
  FOR INSERT
  TO public
  WITH CHECK (true);