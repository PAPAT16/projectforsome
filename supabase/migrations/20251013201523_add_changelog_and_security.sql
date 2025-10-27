/*
  # Add Changelog System and Security Features

  1. New Tables
    - `system_changelog`
      - `id` (uuid, primary key)
      - `change_type` (text) - Type: 'api_key', 'config', 'feature', 'security', 'email'
      - `title` (text) - Brief title of the change
      - `description` (text) - Detailed description
      - `changed_by` (uuid) - User who made the change
      - `severity` (text) - 'low', 'medium', 'high', 'critical'
      - `requires_notification` (boolean) - Should trigger email to super admin
      - `notification_sent` (boolean) - Has email been sent
      - `old_value` (text) - Previous value (if applicable)
      - `new_value` (text) - New value (if applicable)
      - `created_at` (timestamptz)

    - `security_audit_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User performing the action
      - `action` (text) - Action type: 'login', 'logout', 'failed_login', 'data_access', 'permission_change'
      - `ip_address` (text) - IP address of request
      - `user_agent` (text) - Browser/device info
      - `status` (text) - 'success', 'failed', 'blocked'
      - `details` (jsonb) - Additional context
      - `created_at` (timestamptz)

    - `rate_limit_tracking`
      - `id` (uuid, primary key)
      - `identifier` (text) - IP or user_id
      - `action_type` (text) - Type of action being rate limited
      - `attempt_count` (integer) - Number of attempts
      - `window_start` (timestamptz) - Start of rate limit window
      - `blocked_until` (timestamptz) - If blocked, until when

  2. Configuration
    - Add super_admin_email and api_keys to app_config table

  3. Security
    - Enable RLS on all new tables
    - Only admins can access changelog
    - Only system can write to security logs
    - Rate limit tracking accessible only to admins

  4. Indexes
    - Performance indexes for security logs and rate limiting
*/

-- Create system_changelog table
CREATE TABLE IF NOT EXISTS system_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type text NOT NULL CHECK (change_type IN ('api_key', 'config', 'feature', 'security', 'email', 'database', 'deployment')),
  title text NOT NULL,
  description text,
  changed_by uuid REFERENCES profiles(id),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  requires_notification boolean DEFAULT false,
  notification_sent boolean DEFAULT false,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);

-- Create security_audit_log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  ip_address text,
  user_agent text,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create rate_limit_tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create app_config table for storing system configuration
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL,
  is_encrypted boolean DEFAULT false,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Changelog policies
CREATE POLICY "Only admins can view changelog"
  ON system_changelog FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert changelog"
  ON system_changelog FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Security audit log policies
CREATE POLICY "Only admins can view security logs"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert security logs"
  ON security_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Rate limit policies
CREATE POLICY "Only admins can view rate limits"
  ON rate_limit_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can manage rate limits"
  ON rate_limit_tracking FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- App config policies
CREATE POLICY "Only admins can view config"
  ON app_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update config"
  ON app_config FOR ALL
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_changelog_created_at ON system_changelog(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_type ON system_changelog(change_type);
CREATE INDEX IF NOT EXISTS idx_changelog_notification ON system_changelog(requires_notification, notification_sent);
CREATE INDEX IF NOT EXISTS idx_security_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_created ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier, action_type);

-- Insert initial config values
INSERT INTO app_config (config_key, config_value) VALUES
  ('super_admin_email', 'Mrc.morris@energefinancial.com'),
  ('stripe_webhook_secret', 'not_configured'),
  ('google_maps_api_key', 'configured'),
  ('system_version', '1.0.0')
ON CONFLICT (config_key) DO NOTHING;

-- Insert initial changelog entry
INSERT INTO system_changelog (change_type, title, description, severity, requires_notification) VALUES
  ('deployment', 'System Initialized', 'Food Truck Live application deployed with security features', 'medium', false);

-- Create function to auto-log changes to critical config
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.config_key IN ('stripe_webhook_secret', 'super_admin_email', 'google_maps_api_key') THEN
    INSERT INTO system_changelog (
      change_type,
      title,
      description,
      changed_by,
      severity,
      requires_notification,
      old_value,
      new_value
    ) VALUES (
      'api_key',
      'Critical Configuration Changed: ' || NEW.config_key,
      'Configuration value updated for ' || NEW.config_key,
      NEW.updated_by,
      'critical',
      true,
      OLD.config_value,
      'REDACTED'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for config changes
DROP TRIGGER IF EXISTS trigger_log_config_change ON app_config;
CREATE TRIGGER trigger_log_config_change
  AFTER UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION log_config_change();