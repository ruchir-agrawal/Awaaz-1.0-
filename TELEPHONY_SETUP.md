# Awaaz Inbound Telephony Setup

This setup gives you a low-cost inbound AI receptionist for appointment booking.

## Architecture

- Twilio receives the phone call.
- Twilio `Gather` captures the caller speech each turn.
- `server/inbound-agent.js` runs the agent logic.
- Gemini handles the LLM step first because it is the cheapest dev option.
- Sarvam generates the Indian-accent voice that the caller hears.
- Google Apps Script logs the booking or inquiry into your sheet.
- Cal.com can optionally act as the real scheduling layer for availability and booking creation.

This is not full-duplex real-time audio. It is turn-based voice AI. For development, that is the best tradeoff between cost, quality, and build speed.

## Why this path is cheap

- Twilio trial gives a free trial balance and one trial phone number.
- ngrok free plan is enough for a public webhook URL during development.
- Gemini API has a free tier that is usually enough for early testing.
- Groq can be kept as a backup model if Gemini rate-limits.
- Google Apps Script and Google Sheets are free for light usage.
- Supabase free tier is enough for the current project stage.

## Before you test

Move telephony and model secrets to server-side env vars. Do not rely on browser `VITE_*` keys for production calling.

Suggested `.env.local` additions:

```env
APP_BASE_URL=https://your-ngrok-subdomain.ngrok-free.app
TELEPHONY_PORT=8787

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

SARVAM_API_KEY=your-sarvam-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key

GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/your-script-id/exec

CAL_COM_API_KEY=cal_live_xxxxx
CAL_COM_EVENT_TYPE_ID=123456
# Optional per-business overrides:
# CAL_COM_EVENT_TYPE_ID_MAP={"+14788125680":123456}
# CAL_COM_EVENT_TYPE_SLUG_MAP={"your-business-slug":"consultation"}
# CAL_COM_USERNAME_MAP={"your-business-slug":"clinic-owner"}
# CAL_COM_ORGANIZATION_SLUG_MAP={"your-business-slug":"your-org"}
# CAL_COM_TIMEZONE=Asia/Kolkata

TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_TRANSFER_NUMBER=+91XXXXXXXXXX

TWILIO_NUMBER_TO_BUSINESS_MAP={"+14788125680":"your-business-slug"}
```

Notes:

- `APP_BASE_URL` must be your public HTTPS URL, usually ngrok while developing.
- `TWILIO_NUMBER_TO_BUSINESS_MAP` maps the inbound Twilio number to a business in Supabase.
- If you do not want transfer yet, leave `TWILIO_TRANSFER_NUMBER` empty.

## Start the server

```bash
npm run telephony:dev
```

Check health:

```bash
curl http://localhost:8787/health
```

## Expose it publicly

Use ngrok free:

```bash
ngrok http 8787
```

Copy the HTTPS forwarding URL into `APP_BASE_URL`, then restart the server.

## Twilio console setup

Buy or use the trial number, then set:

- Voice webhook: `https://your-public-url/voice/incoming`
- Method: `POST`
- Status callback: `https://your-public-url/voice/status`
- Status callback events: completed

## What the call flow does

1. Caller dials your Twilio number.
2. Awaaz greets them in an Indian English voice.
3. Twilio transcribes the caller turn using speech input.
4. Gemini generates the next response.
5. Sarvam turns that reply into Indian-accent audio.
6. The agent repeats until it books the appointment or ends the inquiry.
7. Confirmed bookings are written into your `appointments` table.
8. If Cal.com is configured, availability and booking creation use Cal.com.
9. The conversation is still logged to your Google Sheet through the existing bridge.

## Current limitations

- Sessions are stored in memory, which is fine for dev and small tests.
- If Cal.com is not configured, scheduling falls back to sheet-derived availability.
- Business lookup depends on `phone` matching or `TWILIO_NUMBER_TO_BUSINESS_MAP`.
- Transfer is single-number only right now.

## Cheapest dev stack recommendation

- Telephony: Twilio trial
- Public tunnel: ngrok free
- LLM: Gemini free tier
- Voice: Sarvam
- Data: Google Sheets + Supabase free tier

## When you upgrade later

Upgrade only after the flow works:

- Move from ngrok to a deployed server.
- Add a dedicated `telephony_number` column in Supabase.
- Add Cal.com webhooks so cancellations and reschedules sync back automatically.
- Replace in-memory sessions with Redis or Supabase.
