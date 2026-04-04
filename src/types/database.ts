export type UserRole = 'admin' | 'owner'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  cal_user_id: string | null
  google_sheet_id: string | null
  google_sheet_url: string | null
  google_sheet_tab_name: string | null
  industry: string
  phone: string | null
  address: string | null
  city: string | null
  hours_opening: string
  hours_closing: string
  working_days: string[]
  services: string[]
  languages: string[]
  agent_name: string
  agent_voice: string
  system_prompt: string | null
  is_active: boolean
  plan: 'trial' | 'starter' | 'pro' | 'enterprise'
  plan_started_at: string | null
  plan_ends_at: string | null
  monthly_call_limit: number
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  business_id: string
  customer_phone: string | null
  duration_seconds: number
  outcome: 'in-progress' | 'booked' | 'transferred' | 'failed' | 'missed' | 'completed'
  transcript: string | null
  recording_url: string | null
  language_detected: string | null
  call_source: 'web' | 'phone' | 'demo'
  created_at: string
  ended_at: string | null
}

export interface Appointment {
  id: string
  business_id: string
  call_id: string | null
  customer_name: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  reason: string | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

export interface ApiUsage {
  id: string
  business_id: string
  call_id: string | null
  service: 'sarvam_stt' | 'sarvam_tts' | 'groq_llm' | 'twilio'
  tokens_used: number
  duration_seconds: number
  cost_inr: number
  created_at: string
}

export interface Billing {
  id: string
  business_id: string
  plan: string
  amount_inr: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: string | null
  invoice_url: string | null
  billing_period_start: string | null
  billing_period_end: string | null
  created_at: string
}
