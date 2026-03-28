-- Create tables for Awaaz AI Voice Receptionist

-- Create businesses table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  industry TEXT,
  hours_opening TIME,
  hours_closing TIME,
  services TEXT,
  languages TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calls table
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  duration_seconds INTEGER,
  outcome TEXT CHECK (outcome IN ('booked', 'transferred', 'failed')),
  transcript TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own business
CREATE POLICY "Users can view own business" 
  ON businesses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business" 
  ON businesses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business" 
  ON businesses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to manage calls for their businesses only
CREATE POLICY "Users can view calls for own business" 
  ON calls FOR SELECT 
  USING (EXISTS (SELECT 1 FROM businesses WHERE id = calls.business_id AND user_id = auth.uid()));

-- Allow users to manage appointments for their businesses only
CREATE POLICY "Users can view appts for own business" 
  ON appointments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM businesses WHERE id = appointments.business_id AND user_id = auth.uid()));
