-- Awaaz 1.0 Production Hardening Migration
-- Run this in Supabase SQL Editor to enable public web calling, reliable signups, and robust RLS policies.

-- 1. Ensure all columns exist
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS cal_user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_sheet_id TEXT,
ADD COLUMN IF NOT EXISTS google_sheet_url TEXT,
ADD COLUMN IF NOT EXISTS google_sheet_tab_name TEXT DEFAULT 'Records';

-- 2. Allow public/anonymous callers to view active businesses (needed for /call/:slug)
DROP POLICY IF EXISTS "Public view active businesses" ON businesses;
CREATE POLICY "Public view active businesses" ON businesses FOR SELECT USING (is_active = true);

-- 3. Allow public web calling to log calls safely
DROP POLICY IF EXISTS "Public insert web calls" ON calls;
CREATE POLICY "Public insert web calls" ON calls FOR INSERT WITH CHECK (call_source = 'web');

DROP POLICY IF EXISTS "Public update web calls" ON calls;
CREATE POLICY "Public update web calls" ON calls FOR UPDATE USING (call_source = 'web');

-- 4. Allow public callers to book appointments
DROP POLICY IF EXISTS "Public insert appointments" ON appointments;
CREATE POLICY "Public insert appointments" ON appointments FOR INSERT WITH CHECK (true);

-- 5. Allow inserting API usage records for telemetry & billing
DROP POLICY IF EXISTS "Allow insert api_usage" ON api_usage;
CREATE POLICY "Allow insert api_usage" ON api_usage FOR INSERT WITH CHECK (true);

-- 6. Atomic User & Business Provisioning Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
  v_full_name TEXT;
  v_biz_name TEXT;
  v_slug TEXT;
BEGIN
  -- Auto-promote founders to admin role based on emails
  IF new.email IN ('agrawalruchir7@gmail.com', 'shahhetav77@gmail.com') THEN
    v_role := 'admin';
  ELSE
    v_role := 'owner';
  END IF;

  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Business Owner');
  v_biz_name := COALESCE(new.raw_user_meta_data->>'business_name', v_full_name);
  v_slug := LOWER(REGEXP_REPLACE(v_biz_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || FLOOR(RANDOM() * 9000 + 1000)::TEXT;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (new.id, new.email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  -- Auto-create default business for owners if not already existing
  IF v_role = 'owner' THEN
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE owner_id = new.id) THEN
      INSERT INTO businesses (owner_id, name, slug, industry, agent_name, agent_voice, is_active)
      VALUES (new.id, v_biz_name, v_slug, 'Healthcare', 'Awaaz', 'shubh', true);
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
