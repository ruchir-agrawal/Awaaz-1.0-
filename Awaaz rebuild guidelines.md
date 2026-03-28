PROJECT: Awaaz — AI Voice Receptionist Platform
REBUILD FROM: Existing React + TypeScript + Supabase + Vite codebase
GOAL: Add dual-portal architecture (Admin + Owner), rebuild schema, clean up all demo/mock data, make everything production-ready for hackathon demo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: TECH STACK (DO NOT CHANGE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* Frontend: React 18 + TypeScript + Vite
* Styling: Tailwind CSS (keep existing theme/variables)
* UI Components: Keep existing /components/ui/ (Button, Card, Table, Badge, Input, Label, Select, Tooltip)
* Auth + DB: Supabase (supabase-js)
* Routing: React Router v6
* Charts: Recharts
* Icons: Lucide React
* Toasts: Sonner
* Voice: Sarvam AI (STT + TTS), Groq (LLM) — keep existing lib/sarvam.ts and lib/groq.ts
* Date: date-fns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: SUPABASE SCHEMA (FULL REBUILD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace supabase\_schema.sql with this complete schema:

\-- ENUM for user roles
CREATE TYPE user\_role AS ENUM ('admin', 'owner');

\-- PROFILES table (extends Supabase auth.users)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
role user\_role NOT NULL DEFAULT 'owner',
full\_name TEXT,
email TEXT,
avatar\_url TEXT,
created\_at TIMESTAMPTZ DEFAULT NOW(),
updated\_at TIMESTAMPTZ DEFAULT NOW()
);

\-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle\_new\_user()
RETURNS trigger AS $$
BEGIN
INSERT INTO profiles (id, email, full\_name, role)
VALUES (new.id, new.email, new.raw\_user\_meta\_data->>'full\_name', 'owner');
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on\_auth\_user\_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle\_new\_user();

\-- BUSINESSES table
CREATE TABLE businesses (
id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,
owner\_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL, -- used for /call/:slug route
industry TEXT NOT NULL DEFAULT 'general',
phone TEXT,
address TEXT,
city TEXT,
hours\_opening TIME DEFAULT '09:00',
hours\_closing TIME DEFAULT '21:00',
working\_days TEXT\[] DEFAULT ARRAY\['monday','tuesday','wednesday','thursday','friday','saturday'],
services TEXT\[],
languages TEXT\[] DEFAULT ARRAY\['hindi','english'],
agent\_name TEXT DEFAULT 'Awaaz',
agent\_voice TEXT DEFAULT 'shubh',
system\_prompt TEXT,
is\_active BOOLEAN DEFAULT true,
plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
plan\_started\_at TIMESTAMPTZ,
plan\_ends\_at TIMESTAMPTZ,
monthly\_call\_limit INTEGER DEFAULT 50,
created\_at TIMESTAMPTZ DEFAULT NOW(),
updated\_at TIMESTAMPTZ DEFAULT NOW()
);

\-- CALLS table
CREATE TABLE calls (
id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,
business\_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
customer\_phone TEXT,
duration\_seconds INTEGER DEFAULT 0,
outcome TEXT DEFAULT 'in-progress' CHECK (outcome IN ('in-progress', 'booked', 'transferred', 'failed', 'missed', 'completed')),
transcript TEXT,
recording\_url TEXT,
language\_detected TEXT,
call\_source TEXT DEFAULT 'web' CHECK (call\_source IN ('web', 'phone', 'demo')),
created\_at TIMESTAMPTZ DEFAULT NOW(),
ended\_at TIMESTAMPTZ
);

\-- APPOINTMENTS table
CREATE TABLE appointments (
id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,
business\_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
call\_id UUID REFERENCES calls(id) ON DELETE SET NULL,
customer\_name TEXT NOT NULL,
customer\_phone TEXT NOT NULL,
appointment\_date DATE NOT NULL,
appointment\_time TIME NOT NULL,
reason TEXT,
notes TEXT,
status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
reminder\_sent BOOLEAN DEFAULT false,
created\_at TIMESTAMPTZ DEFAULT NOW(),
updated\_at TIMESTAMPTZ DEFAULT NOW()
);

\-- API\_USAGE table (for admin monitoring)
CREATE TABLE api\_usage (
id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,
business\_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
call\_id UUID REFERENCES calls(id) ON DELETE SET NULL,
service TEXT NOT NULL CHECK (service IN ('sarvam\_stt', 'sarvam\_tts', 'groq\_llm', 'twilio')),
tokens\_used INTEGER DEFAULT 0,
duration\_seconds NUMERIC DEFAULT 0,
cost\_inr NUMERIC(10,4) DEFAULT 0,
created\_at TIMESTAMPTZ DEFAULT NOW()
);

\-- BILLING table
CREATE TABLE billing (
id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,
business\_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
plan TEXT NOT NULL,
amount\_inr NUMERIC(10,2) NOT NULL,
status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
payment\_method TEXT,
invoice\_url TEXT,
billing\_period\_start DATE,
billing\_period\_end DATE,
created\_at TIMESTAMPTZ DEFAULT NOW()
);

\-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api\_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

\-- Profiles: users see own profile; admins see all
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

\-- Businesses: owners see own; admins see all
CREATE POLICY "Owners view own business" ON businesses FOR SELECT USING (owner\_id = auth.uid());
CREATE POLICY "Admins view all businesses" ON businesses FOR SELECT USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Owners manage own business" ON businesses FOR ALL USING (owner\_id = auth.uid());
CREATE POLICY "Admins manage all businesses" ON businesses FOR ALL USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

\-- Calls, Appointments, API Usage, Billing: same pattern
CREATE POLICY "Owner access calls" ON calls FOR ALL USING (
EXISTS (SELECT 1 FROM businesses WHERE id = calls.business\_id AND owner\_id = auth.uid())
);
CREATE POLICY "Admin access all calls" ON calls FOR ALL USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Owner access appointments" ON appointments FOR ALL USING (
EXISTS (SELECT 1 FROM businesses WHERE id = appointments.business\_id AND owner\_id = auth.uid())
);
CREATE POLICY "Admin access all appointments" ON appointments FOR ALL USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Owner access api\_usage" ON api\_usage FOR SELECT USING (
EXISTS (SELECT 1 FROM businesses WHERE id = api\_usage.business\_id AND owner\_id = auth.uid())
);
CREATE POLICY "Admin access all api\_usage" ON api\_usage FOR ALL USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Owner access billing" ON billing FOR SELECT USING (
EXISTS (SELECT 1 FROM businesses WHERE id = billing.business\_id AND owner\_id = auth.uid())
);
CREATE POLICY "Admin access all billing" ON billing FOR ALL USING (
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: AUTH CONTEXT \& ROLE ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rebuild src/contexts/AuthContext.tsx to include:

* session, user, profile (fetched from profiles table), loading
* userRole: 'admin' | 'owner' | null
* isAdmin: boolean helper
* signOut function

After login, fetch the user's profile from the profiles table to get their role.
Export: useAuth() hook.

Rebuild src/components/ProtectedRoute.tsx to accept optional requiredRole prop:

* If no role required: just check auth
* If requiredRole='admin': redirect to /owner if user is an owner
* If requiredRole='owner': redirect to /admin if user is an admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: ROUTING STRUCTURE (App.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Routes:
/login                    → Login page (single, shared)
/signup                   → SignUp page (owners only; admin created manually)
/call/:slug               → PublicCall page (no auth needed)

/owner/\*                  → Owner portal (ProtectedRoute requiredRole='owner')
/owner/                 → Owner Dashboard
/owner/calls            → Call History
/owner/appointments     → Appointments
/owner/analytics        → Analytics
/owner/playground       → Agent Playground (browser voice test)
/owner/settings         → Settings

/admin/\*                  → Admin portal (ProtectedRoute requiredRole='admin')
/admin/                 → Admin Dashboard
/admin/owners           → All Owners list
/admin/owners/:id       → Owner Detail (calls, appointments, usage)
/admin/system           → System Health (API status, latency)
/admin/billing          → Billing overview
/admin/apis             → API Keys \& Usage

After login, redirect based on role:

* admin → /admin
* owner → /owner

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: OWNER PORTAL PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All owner pages live under /owner/ with OwnerLayout (left sidebar, same pattern as existing DashboardLayout but with /owner/ routes).

\[A] OWNER DASHBOARD (/owner/)
Metric cards (all from live Supabase data, zero mock data):

* Total Calls Today
* Appointments Booked Today
* Call Success Rate (%)
* Estimated Revenue Captured (₹)

Agent status indicator (active / offline — based on business.is\_active)
Live active calls section (Supabase Realtime subscription on calls table where outcome='in-progress')
Call Volume Area Chart — last 7 days (real data from calls table grouped by date)
Web Voice Link card (shows /call/{business.slug}, copy button)

\[B] CALL HISTORY (/owner/calls)
Keep existing CallHistory page but:

* Remove all mock data / DemoContext usage
* Pull only from Supabase calls table WHERE business\_id = owner's business
* Add outcome filter dropdown (All / Booked / Transferred / Failed / Missed)
* Add date range filter
* Show language\_detected column
* Show call\_source badge (web / phone / demo)
* Transcript viewer: click row → slide-in panel showing full transcript

\[C] APPOINTMENTS (/owner/appointments)
Keep existing Appointments page but:

* Remove all mock data
* Pull from Supabase appointments table for owner's business
* Add status filter (All / Confirmed / Completed / Cancelled / No-show)
* Add calendar view toggle (list vs simple month grid using date-fns)
* Status change dropdown per row (owner can mark completed/cancelled/no-show)
* Appointment count summary at top (Upcoming / Today / This Week)

\[D] ANALYTICS (/owner/analytics)
Real charts from Supabase data:

* Daily call volume — AreaChart (last 30 days)
* Booking conversion funnel — calls → bookings ratio as BarChart
* Peak call hours heatmap — simple grid showing call counts by hour (0-23) as colored cells
* Language breakdown — PieChart (Hindi / English / Gujarati / Other)
* Top reasons for call — BarChart (parse from transcript/reason field)
Time range selector: 7D / 30D / 90D

\[E] AGENT PLAYGROUND (/owner/playground)
Keep existing Playground.tsx mostly intact but:

* Remove the LLM provider selector (lock to Groq, Sarvam STT/TTS — no Ollama/xAI/Gemini in owner view)
* Auto-load the system prompt from their business settings in Supabase
* Add a "Save this prompt to my settings" button
* Remove the demo/debug controls that expose internals
* Keep the voice orb UI and continuous mode

\[F] SETTINGS (/owner/settings)
Tabbed settings page. Tabs: Business Info | Agent Config | Notifications

Business Info tab:

* Form fields: Business Name, Slug (read-only after creation), Industry, Phone, Address, City
* Working hours: Opening time, Closing time
* Working days: Multi-select checkbox (Mon-Sun)
* Services: tag input (add/remove service strings)
* Languages: multi-select (Hindi, English, Gujarati)
* Save button → upsert to businesses table

Agent Config tab:

* Agent Name (what the AI calls itself)
* Agent Voice dropdown (shubh, nisha, etc. from Sarvam voices)
* System Prompt textarea (large, monospace font)
* Language behavior: dropdown (Mirror customer / Always Hindi / Always English)
* Save button

Notifications tab:

* Toggle: WhatsApp confirmation on new booking
* Toggle: WhatsApp reminder 1 hour before appointment
* Phone number for notifications
* Save button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: ADMIN PORTAL PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All admin pages live under /admin/ with AdminLayout (left sidebar, slightly different visual treatment — darker/more technical feel).

AdminLayout sidebar nav items:

* Dashboard (LayoutDashboard icon)
* All Owners (Users icon)
* System Health (Activity icon)
* API Monitor (Cpu icon)
* Billing (CreditCard icon)
* Settings (Settings icon)

\[A] ADMIN DASHBOARD (/admin/)
Platform-wide metrics (aggregate across ALL businesses):

* Total Registered Owners (count from profiles WHERE role='owner')
* Active Businesses (count from businesses WHERE is\_active=true)
* Total Calls Today (aggregate)
* Total Appointments Today (aggregate)
* Total API Cost Today ₹ (sum from api\_usage WHERE date=today)
* Platform Revenue Today ₹ (sum of active subscriptions / 30)

Recent signups table (last 5 owners with business name, plan, joined date)
System status row: Sarvam STT ● | Sarvam TTS ● | Groq LLM ● | Supabase ● (green/red indicators, ping check)

\[B] ALL OWNERS (/admin/owners)
Table of all owner accounts:
Columns: Owner Name, Email, Business Name, Industry, Plan, Calls This Month, Joined Date, Status (active/inactive), Actions

Actions per row:

* View Details → /admin/owners/:id
* Toggle active/inactive
* Change plan

Search by name/email/business.
Filter by plan (Trial / Starter / Pro / Enterprise).
Filter by industry.

\[C] OWNER DETAIL (/admin/owners/:id)
Full detail page for one owner. Top section: business card with all info.

Tabs:

1. Overview: metric cards + 7-day call chart for this owner
2. Call History: same as owner's call history but admin can see everything including full phone numbers
3. Appointments: all appointments for this owner
4. API Usage: table showing api\_usage rows for this business (service, cost, timestamp, call\_id)

   * total cost this month broken down by service (Sarvam STT / Sarvam TTS / Groq)
5. Billing: billing history table + plan change button

\[D] SYSTEM HEALTH (/admin/system)
Four status cards:

* Sarvam AI (STT): last ping latency, status, calls processed today
* Sarvam AI (TTS): last ping latency, status, characters synthesized today
* Groq (LLM): last ping latency, model in use (llama-3.3-70b-versatile), tokens today
* Supabase: connection status, active subscriptions, DB size

Live call monitor: table of all calls currently outcome='in-progress' across ALL businesses
(business name, customer phone masked, duration, language detected, source)

Recent errors log (last 20 rows from a future error\_logs table, or just a placeholder UI for now)

\[E] API MONITOR (/admin/apis)
This page shows the API integrations in use. Three cards:

Card 1 — Sarvam AI

* API key: ••••••••\[last 4 chars] (masked, no reveal button)
* STT model: saaras:v3
* TTS model: bulbul:v3
* Total calls today / this month
* Estimated cost this month (₹)
* Usage bar (against estimated budget)

Card 2 — Groq

* API key: ••••••••\[last 4 chars]
* Model: llama-3.3-70b-versatile
* Total tokens today / this month
* Estimated cost this month (₹)
* Usage bar

Card 3 — Twilio (placeholder — to be connected later)

* Status: "Not connected" badge
* Fields greyed out: Account SID, Auth Token, Phone Number
* Button: "Connect Twilio" (no action yet, just visual)

NOTE: API keys are never exposed in the UI. They are stored as Supabase secrets / environment variables on the backend.

\[F] BILLING (/admin/billing)
Table of all billing records across all owners.
Columns: Owner, Business, Plan, Amount (₹), Status, Period, Created
Filter by status (All / Paid / Pending / Failed)
Summary cards: Total MRR (₹), Active Paid Accounts, Trial Accounts, Churned This Month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: SHARED PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\[LOGIN PAGE] (/login)
Single login page for both admin and owner.
Fields: Email, Password
After login: check profiles.role → redirect to /admin or /owner
No signup link shown if admin (admin accounts created manually via Supabase dashboard)

\[SIGNUP PAGE] (/signup)
Owner signup only.
Fields: Full Name, Email, Password, Business Name, Industry (dropdown), City
On submit:

1. Create Supabase auth user
2. Profile auto-created by trigger (role='owner')
3. Insert into businesses table with generated slug (lowercase business name, spaces→hyphens)
4. Redirect to /owner

\[PUBLIC CALL PAGE] (/call/:slug)
Keep existing PublicCall page. Improvements:

* Fetch business info by slug from businesses table (business name, agent name, industry)
* Display business name + "AI Receptionist" at top
* Show the voice orb UI (keep existing)
* Use business's system\_prompt from DB (not hardcoded)
* Log the call to calls table (call\_source='web')

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: DATA CONTEXTS \& HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELETE: DemoContext.tsx (remove all demo mode / mock data from the entire app)
DELETE: LiveContext.tsx (replace with proper hooks)

CREATE: src/hooks/useBusinessData.ts

* Fetch authenticated owner's business from businesses table
* Returns: business, loading, error, refetch

CREATE: src/hooks/useCallsData.ts

* Fetch calls for a business\_id with optional filters
* Supabase Realtime subscription for live updates
* Returns: calls, loading, activeCalls (outcome='in-progress')

CREATE: src/hooks/useAppointmentsData.ts

* Fetch appointments for a business\_id with optional filters
* Returns: appointments, loading, todayCount, upcomingCount

CREATE: src/hooks/useAdminData.ts

* Fetch all businesses + profiles for admin views
* Returns: owners, totalCallsToday, totalAppointmentsToday, totalCostToday

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9: TYPES (database.ts rebuild)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rebuild src/types/database.ts to match the new schema exactly:

export type UserRole = 'admin' | 'owner'

export interface Profile {
id: string
role: UserRole
full\_name: string | null
email: string | null
avatar\_url: string | null
created\_at: string
updated\_at: string
}

export interface Business {
id: string
owner\_id: string
name: string
slug: string
industry: string
phone: string | null
address: string | null
city: string | null
hours\_opening: string
hours\_closing: string
working\_days: string\[]
services: string\[]
languages: string\[]
agent\_name: string
agent\_voice: string
system\_prompt: string | null
is\_active: boolean
plan: 'trial' | 'starter' | 'pro' | 'enterprise'
plan\_started\_at: string | null
plan\_ends\_at: string | null
monthly\_call\_limit: number
created\_at: string
updated\_at: string
}

export interface Call {
id: string
business\_id: string
customer\_phone: string | null
duration\_seconds: number
outcome: 'in-progress' | 'booked' | 'transferred' | 'failed' | 'missed' | 'completed'
transcript: string | null
recording\_url: string | null
language\_detected: string | null
call\_source: 'web' | 'phone' | 'demo'
created\_at: string
ended\_at: string | null
}

export interface Appointment {
id: string
business\_id: string
call\_id: string | null
customer\_name: string
customer\_phone: string
appointment\_date: string
appointment\_time: string
reason: string | null
notes: string | null
status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
reminder\_sent: boolean
created\_at: string
updated\_at: string
}

export interface ApiUsage {
id: string
business\_id: string
call\_id: string | null
service: 'sarvam\_stt' | 'sarvam\_tts' | 'groq\_llm' | 'twilio'
tokens\_used: number
duration\_seconds: number
cost\_inr: number
created\_at: string
}

export interface Billing {
id: string
business\_id: string
plan: string
amount\_inr: number
status: 'pending' | 'paid' | 'failed' | 'refunded'
payment\_method: string | null
invoice\_url: string | null
billing\_period\_start: string | null
billing\_period\_end: string | null
created\_at: string
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10: THINGS TO NOT TOUCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep these files exactly as they are (only update imports if needed):

* src/lib/sarvam.ts
* src/lib/groq.ts
* src/lib/supabase.ts
* src/lib/utils.ts
* src/hooks/useVoiceAgent.ts
* src/components/ui/\* (all UI primitives)
* vite.config.ts
* tailwind.config (keep existing colors/theme)
* index.css (keep existing CSS variables)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11: VISUAL DESIGN NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Owner Portal: Keep the existing clean look. Sidebar with Sparkles + "Awaaz" branding.
Primary color: existing primary-600. White/light cards on light bg.

Admin Portal: Give it a slightly more technical/dense feel to distinguish from owner portal.
Use a darker sidebar (bg-gray-900 text-gray-100) for AdminLayout to visually separate it.
Admin pages should feel like a control panel, not a marketing dashboard.

Both portals:

* No mock/fake/demo data anywhere in the UI
* Loading skeletons on all data-fetching components (use a simple Skeleton component)
* Empty states with helpful messages (e.g. "No calls yet — share your voice link to get started")
* Error states with retry buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12: WHAT THIS DOES NOT INCLUDE (NEXT PHASE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are OUT OF SCOPE for this rebuild — do not add or stub:

* Twilio phone number integration (separate backend work)
* Razorpay payment processing
* Email notifications
* Mobile app
* Voice cloning
* WhatsApp Business API (keep existing Google Bridge as-is)

These will be done after the frontend rebuild is stable.

