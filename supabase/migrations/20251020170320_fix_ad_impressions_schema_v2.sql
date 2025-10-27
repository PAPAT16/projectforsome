/*
  # Fix ad_impressions table schema

  1. Changes
    - Add missing columns to ad_impressions table
    - Add ad_unit_id column (text)
    - Add ad_network column (text with check constraint)
    - Add page_location column (text)
    - Add estimated_revenue column (numeric)
  
  2. Security
    - No RLS changes needed
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'ad_unit_id'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN ad_unit_id text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'ad_network'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN ad_network text NOT NULL DEFAULT 'adsense';
    ALTER TABLE ad_impressions ADD CONSTRAINT ad_impressions_ad_network_check CHECK (ad_network IN ('adsense', 'sponsored'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'page_location'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN page_location text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'estimated_revenue'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN estimated_revenue numeric(10,4) DEFAULT 0;
  END IF;
END $$;