-- ==============================================================================
-- Migration: Multi-Tenant Sarvam Voice Agents, WhatsApp & Automated Provisioning
-- ==============================================================================

-- 1. Add Sarvam Voice Agent, Phone Number, and WhatsApp configuration columns
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS sarvam_agent_id TEXT,
ADD COLUMN IF NOT EXISTS assigned_phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS whatsapp_notification_phone TEXT,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- 2. Create index on assigned_phone_number and sarvam_agent_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_businesses_assigned_phone ON public.businesses(assigned_phone_number);
CREATE INDEX IF NOT EXISTS idx_businesses_sarvam_agent ON public.businesses(sarvam_agent_id);

-- 3. Add service types in api_usage for Sarvam Voice Agents if needed
COMMENT ON COLUMN public.businesses.sarvam_agent_id IS 'Indus Sarvam Samvaad Voice Agent identifier';
COMMENT ON COLUMN public.businesses.assigned_phone_number IS 'Dedicated telephony number allocated to this tenant';
COMMENT ON COLUMN public.businesses.whatsapp_notification_phone IS 'Clinic owner personal mobile number for instant WhatsApp booking alerts';
