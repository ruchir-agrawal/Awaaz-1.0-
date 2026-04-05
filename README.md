# Awaaz 

Awaaz is an AI voice agent which provides telephony services for businesses. It answers inbound calls, speaks with customers, captures booking details, logs outcomes, and gives owners and admins a simple dashboard to manage operations.

The product combines a React frontend, a Node telephony service, Supabase, Twilio, Google Sheets, and AI voice/model providers into one flow.

## What It Does

- Answers business calls with an AI agent
- Captures appointment requests and customer details
- Logs calls and outcomes to Supabase
- Syncs records to Google Sheets
- Gives owners views for calls, appointments, analytics, and settings
- Gives admins visibility into owners, platform health, and billing

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express
- Data: Supabase
- Telephony: Twilio
- AI: Gemini, Groq
- Voice: Sarvam
- Sync: Google Apps Script + Google Sheets

## How It Works

```text
Caller -> Twilio -> Awaaz telephony server -> AI response -> voice playback
                                 |
                                 -> Supabase
                                 -> Google Sheets
                                 -> Owner/Admin dashboards
```

The main voice logic lives in `server/inbound-agent.js`, and the web app lives in `src/`.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/your-script-id/exec

APP_BASE_URL=https://your-public-url.ngrok-free.app
TELEPHONY_PORT=8787

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/your-script-id/exec
SARVAM_API_KEY=your-sarvam-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
GEMINI_MODEL=gemini-2.5-flash

TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_TRANSFER_NUMBER=+91XXXXXXXXXX
TWILIO_NUMBER_TO_BUSINESS_MAP={"+14788125680":"your-business-slug"}
```

### 3. Set up Supabase

Run these SQL files in order:

1. `supabase_schema.sql`
2. `supabase_migration_add_business_sheet_fields.sql`
3. `supabase_migration_add_cal_user_id.sql`

### 4. Start the app

Frontend:

```bash
npm run dev
```

Telephony server:

```bash
npm run telephony:dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run telephony:dev
```

## Main Routes

- `/` landing page
- `/login` login
- `/signup` signup
- `/owner` owner dashboard
- `/admin` admin dashboard
- `/call/:slug` public business call flow

## Telephony Setup

For full telephony details, see [TELEPHONY_SETUP.md](./TELEPHONY_SETUP.md).

Basic local flow:

1. Run `npm run telephony:dev`
2. Check `http://localhost:8787/health`
3. Expose it with `ngrok http 8787`
4. Set `APP_BASE_URL` to the ngrok HTTPS URL
5. Point Twilio webhook to `https://your-public-url/voice/incoming`

## Project Structure

```text
src/        frontend app
server/     telephony and calendar logic
public/     static assets
```

Key files:

- `server/inbound-agent.js`
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/Settings.tsx`
- `supabase_schema.sql`

## Deployment Notes

- Deploy the frontend as a Vite production build
- Deploy the telephony server on a public HTTPS backend
- Keep all server secrets off the client
- Point Twilio to the deployed telephony service

## Security

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend
- Treat all `VITE_*` values as public
- Keep Twilio and provider secrets server-side
- Rotate any keys that were shared accidentally

## Troubleshooting

- If auth fails, check Supabase URL, anon key, and schema setup
- If calls fail, check `APP_BASE_URL`, Twilio webhook config, and public reachability
- If logging fails, check Supabase server credentials and `GOOGLE_BRIDGE_URL`
- If voice fails, check `SARVAM_API_KEY`

## Demo Flow

The cleanest way to present Awaaz:

1. Show the landing page
2. Log in as an owner
3. Show calls, appointments, analytics, and settings
4. Explain the flow from Twilio to AI to Supabase
5. Show telephony setup or a live webhook demo
