export type Business = {
    id: string
    user_id: string
    name: string
    phone: string
    industry: string
    hours_opening: string
    hours_closing: string
    services: string
    languages: string[]
    created_at: string
}

export type Call = {
    id: string
    business_id: string
    customer_phone: string
    duration_seconds: number
    outcome: 'booked' | 'transferred' | 'failed' | 'ringing' | 'connected' | 'in-progress'
    transcript: string
    recording_url: string
    created_at: string
}

export type Appointment = {
    id: string
    business_id: string
    call_id: string | null
    customer_name: string
    customer_phone: string
    appointment_date: string
    appointment_time: string
    reason: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    created_at: string
}
