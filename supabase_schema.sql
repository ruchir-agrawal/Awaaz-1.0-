-- ENUM for user roles
CREATE TYPE user_role AS ENUM ('admin', 'owner');

-- PROFILES table (extends Supabase auth.users)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
role user_role NOT NULL DEFAULT 'owner',
full_name TEXT,
email TEXT,
avatar_url TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Auto-promote founders to admin role based on emails
  IF new.email IN ('agrawalruchir7@gmail.com', 'shahhetav77@gmail.com') THEN
    v_role := 'admin';
  ELSE
    v_role := 'owner';
  END IF;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', v_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- BUSINESSES table
CREATE TABLE businesses (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL, -- used for /call/:slug route
industry TEXT NOT NULL DEFAULT 'general',
phone TEXT,
address TEXT,
city TEXT,
hours_opening TIME DEFAULT '09:00',
hours_closing TIME DEFAULT '21:00',
working_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday'],
services TEXT[],
languages TEXT[] DEFAULT ARRAY['hindi','english'],
agent_name TEXT DEFAULT 'Awaaz',
agent_voice TEXT DEFAULT 'shubh',
system_prompt TEXT,
is_active BOOLEAN DEFAULT true,
plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
plan_started_at TIMESTAMPTZ,
plan_ends_at TIMESTAMPTZ,
monthly_call_limit INTEGER DEFAULT 50,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALLS table
CREATE TABLE calls (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
customer_phone TEXT,
duration_seconds INTEGER DEFAULT 0,
outcome TEXT DEFAULT 'in-progress' CHECK (outcome IN ('in-progress', 'booked', 'transferred', 'failed', 'missed', 'completed')),
transcript TEXT,
recording_url TEXT,
language_detected TEXT,
call_source TEXT DEFAULT 'web' CHECK (call_source IN ('web', 'phone', 'demo')),
created_at TIMESTAMPTZ DEFAULT NOW(),
ended_at TIMESTAMPTZ
);

-- APPOINTMENTS table
CREATE TABLE appointments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
customer_name TEXT NOT NULL,
customer_phone TEXT NOT NULL,
appointment_date DATE NOT NULL,
appointment_time TIME NOT NULL,
reason TEXT,
notes TEXT,
status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
reminder_sent BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API_USAGE table (for admin monitoring)
CREATE TABLE api_usage (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
service TEXT NOT NULL CHECK (service IN ('sarvam_stt', 'sarvam_tts', 'groq_llm', 'twilio')),
tokens_used INTEGER DEFAULT 0,
duration_seconds NUMERIC DEFAULT 0,
cost_inr NUMERIC(10,4) DEFAULT 0,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING table
CREATE TABLE billing (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
plan TEXT NOT NULL,
amount_inr NUMERIC(10,2) NOT NULL,
status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
payment_method TEXT,
invoice_url TEXT,
billing_period_start DATE,
billing_period_end DATE,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Function to safely check if current user is admin without catching RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users see own profile; admins see all
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Businesses: owners see own; admins see all
CREATE POLICY "Owners view own business" ON businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Admins view all businesses" ON businesses FOR SELECT USING (public.is_admin());
CREATE POLICY "Owners manage own business" ON businesses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins manage all businesses" ON businesses FOR ALL USING (public.is_admin());

-- Calls, Appointments, API Usage, Billing: same pattern
CREATE POLICY "Owner access calls" ON calls FOR ALL USING (
EXISTS (SELECT 1 FROM businesses WHERE id = calls.business_id AND owner_id = auth.uid())
);
CREATE POLICY "Admin access all calls" ON calls FOR ALL USING (public.is_admin());

CREATE POLICY "Owner access appointments" ON appointments FOR ALL USING (
EXISTS (SELECT 1 FROM businesses WHERE id = appointments.business_id AND owner_id = auth.uid())
);
CREATE POLICY "Admin access all appointments" ON appointments FOR ALL USING (public.is_admin());

CREATE POLICY "Owner access api_usage" ON api_usage FOR SELECT USING (
EXISTS (SELECT 1 FROM businesses WHERE id = api_usage.business_id AND owner_id = auth.uid())
);
CREATE POLICY "Admin access all api_usage" ON api_usage FOR ALL USING (public.is_admin());

CREATE POLICY "Owner access billing" ON billing FOR SELECT USING (
EXISTS (SELECT 1 FROM businesses WHERE id = billing.business_id AND owner_id = auth.uid())
);
CREATE POLICY "Admin access all billing" ON billing FOR ALL USING (public.is_admin());
