# Awaaz

Awaaz is an AI voice telephony service provider platform for businesses. It answers inbound calls, captures caller intent, books appointments, logs transcripts, and gives business owners and admins a dashboard to manage operations.

Built for Indian businesses, Awaaz combines a React web app, a Node-based telephony service, Supabase for auth and data, and integrations with Twilio, Google Sheets, and optional calendar scheduling.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [Telephony Setup](#telephony-setup)
- [Application Routes](#application-routes)
- [Operational Flows](#operational-flows)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## Overview

Awaaz is designed to help businesses avoid missed calls and missed bookings.

The platform has two main parts:

- A React frontend for the landing page, authentication, owner dashboard, and admin dashboard
- A Node/Express telephony service that handles inbound voice calls and appointment flows

At a high level, the system:

1. Receives inbound calls through Twilio
2. Uses AI to understand the caller's request
3. Replies with voice output
4. Books or logs the interaction
5. Syncs call outcomes to Supabase and Google Sheets
6. Shows the resulting data in owner and admin dashboards

## Core Features

### Customer-facing

- AI receptionist for inbound phone calls
- Natural conversational booking flow
- Speech-to-intent capture for appointments and inquiries
- Call transfer fallback support
- Public call route for business-specific calling flows

### Owner-facing

- Secure sign up and login
- Owner dashboard with business data
- Call history and appointment views
- Analytics page
- Settings to configure business details
- Google Sheet connection for dedicated business records

### Admin-facing

- Admin dashboard
- Owner management
- Platform health view
- Billing view
- Owner detail drill-down

### Platform integrations

- Supabase auth and data storage
- Twilio inbound voice webhook handling
- Gemini and Groq LLM support
- Sarvam voice synthesis
- Google Apps Script bridge for Google Sheets logging
- Optional calendar booking flow

## How It Works

```text
Caller
  -> Twilio inbound number
  -> Awaaz telephony server
  -> LLM response generation
  -> Voice synthesis
  -> Caller hears AI response

Meanwhile
  -> Supabase stores calls, appointments, business data, profiles
  -> Google Sheets receives call logs and outcomes
  -> Owner/Admin dashboards read from Supabase
```

### Voice flow summary

1. A caller phones a Twilio number linked to a business
2. Twilio sends the webhook to `server/inbound-agent.js`
3. The service resolves the business from the inbound number
4. The agent prompts the caller and captures speech input
5. Gemini or Groq generates the next response
6. Sarvam or Twilio voice renders the reply
7. Appointment details and transcripts are stored
8. Confirmed outcomes are written to Supabase and optionally to a dedicated Google Sheet

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Framer Motion
- Radix UI

### Backend and services

- Node.js
- Express
- Twilio
- Supabase
- Google Apps Script bridge

### AI and voice

- Gemini
- Groq
- Sarvam

### Data and scheduling

- Supabase Postgres
- Google Sheets
- Optional Cal.com integration

## Project Structure

```text
.
|-- public/
|-- server/
|   |-- inbound-agent.js
|   |-- calendar-service.js
|   `-- cal-oauth-service.js
|-- src/
|   |-- components/
|   |-- contexts/
|   |-- hooks/
|   |-- lib/
|   |-- pages/
|   `-- types/
|-- google_bridge_v2.js
|-- supabase_schema.sql
|-- supabase_migration_add_business_sheet_fields.sql
|-- supabase_migration_add_cal_user_id.sql
|-- TELEPHONY_SETUP.md
|-- package.json
`-- README.md
```

### Key files

- `src/App.tsx`: app routing for public, owner, and admin interfaces
- `src/contexts/AuthContext.tsx`: Supabase session and profile state
- `src/pages/Settings.tsx`: owner settings, business sheet setup, and connection flows
- `server/inbound-agent.js`: inbound telephony, voice turn handling, logging, and booking logic
- `supabase_schema.sql`: base database schema
- `TELEPHONY_SETUP.md`: focused telephony configuration guide

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or later
- npm
- A Supabase project
- A Twilio account and inbound number for telephony
- A Google Apps Script deployment for the Sheets bridge
- An ngrok tunnel or deployed public HTTPS URL for telephony testing

## Environment Variables

This project uses both frontend-exposed `VITE_*` variables and server-side variables.

Important rule:

- `VITE_*` variables are exposed to the browser at build time
- server-only secrets must never be stored as `VITE_*` values in production

### Frontend variables

Create a `.env.local` file in the project root and add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

VITE_GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/your-script-id/exec

# Optional client-side experimentation keys
VITE_SARVAM_API_KEY=your-client-side-sarvam-key
VITE_GROQ_API_KEY=your-client-side-groq-key
VITE_XAI_API_KEY=your-client-side-xai-key
VITE_GEMINI_API_KEY=your-client-side-gemini-key
```

### Server variables

The telephony server reads from standard environment variables and also loads `.env.local`.

```env
APP_BASE_URL=https://your-public-url.ngrok-free.app
TELEPHONY_PORT=8787

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/your-script-id/exec

SARVAM_API_KEY=your-sarvam-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
GEMINI_MODEL=gemini-2.5-flash

TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_TRANSFER_NUMBER=+91XXXXXXXXXX
TWILIO_NUMBER_TO_BUSINESS_MAP={"+14788125680":"your-business-slug"}
```

### Optional calendar variables

Use these only if calendar-based booking is enabled in your environment:

```env
CAL_COM_API_KEY=cal_live_xxxxx
CAL_COM_EVENT_TYPE_ID=123456
CAL_COM_EVENT_TYPE_ID_MAP={"+14788125680":123456}
CAL_COM_EVENT_TYPE_SLUG_MAP={"your-business-slug":"consultation"}
CAL_COM_USERNAME_MAP={"your-business-slug":"clinic-owner"}
CAL_COM_ORGANIZATION_SLUG_MAP={"your-business-slug":"your-org"}
CAL_COM_TIMEZONE=Asia/Kolkata
```

### Recommended production practice

- Use server-side secrets only on the server
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only
- Avoid shipping model provider secrets to the browser unless there is a deliberate product reason
- Rotate any keys that have been shared in chat, screenshots, or commits

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Awaaz-1.0--main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Create `.env.local` in the project root and add the required frontend and server values from the section above.

### 4. Set up Supabase

Run the SQL files in your Supabase SQL editor:

1. `supabase_schema.sql`
2. `supabase_migration_add_business_sheet_fields.sql`
3. `supabase_migration_add_cal_user_id.sql`

### 5. Start the frontend

```bash
npm run dev
```

The app will usually be available at `http://localhost:5173`.

### 6. Start the telephony server

In another terminal:

```bash
npm run telephony:dev
```

The telephony service will usually run on `http://localhost:8787`.

## Database Setup

The project depends on Supabase for authentication, roles, business records, call logs, and appointment data.

### Required SQL files

- `supabase_schema.sql`
- `supabase_migration_add_business_sheet_fields.sql`
- `supabase_migration_add_cal_user_id.sql`

### Expected data domains

The app expects data models around:

- `profiles`
- `businesses`
- `calls`
- `appointments`

The exact schema is defined in the SQL files and corresponding frontend types under `src/types`.

### Role model

The application supports at least two roles:

- `owner`
- `admin`

Routing behavior is role-based:

- owners are sent to `/owner`
- admins are sent to `/admin`

## Running the Project

### Available scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run telephony:dev
```

### What each script does

- `npm run dev`: starts the Vite development server
- `npm run build`: runs TypeScript build and creates a production frontend build
- `npm run lint`: runs ESLint
- `npm run preview`: previews the production frontend build locally
- `npm run telephony:dev`: starts the inbound telephony server

## Telephony Setup

For the full telephony guide, see [TELEPHONY_SETUP.md](./TELEPHONY_SETUP.md).

### Minimum local telephony flow

1. Start the telephony server with `npm run telephony:dev`
2. Confirm the health endpoint works:

```bash
curl http://localhost:8787/health
```

3. Expose the port publicly:

```bash
ngrok http 8787
```

4. Set `APP_BASE_URL` to the public HTTPS URL from ngrok
5. Restart the telephony server
6. Configure the Twilio number webhook to:

```text
POST https://your-public-url/voice/incoming
```

7. Optionally configure the Twilio status callback to:

```text
POST https://your-public-url/voice/status
```

### Telephony notes

- `APP_BASE_URL` must be a public HTTPS URL
- the server uses in-memory sessions by default
- inbound number to business mapping can be set with `TWILIO_NUMBER_TO_BUSINESS_MAP`
- call logging writes to Supabase and optionally to Google Sheets

## Application Routes

### Public

- `/`
- `/login`
- `/signup`
- `/call/:slug`

### Owner

- `/owner`
- `/owner/calls`
- `/owner/appointments`
- `/owner/sheet-records`
- `/owner/analytics`
- `/owner/settings`

### Admin

- `/admin`
- `/admin/owners`
- `/admin/owners/:id`
- `/admin/health`
- `/admin/billing`

## Operational Flows

### 1. Business owner onboarding

1. User signs up
2. Supabase auth session is created
3. User profile resolves to an `owner` or `admin`
4. Owner is redirected to the owner portal
5. Business details are configured in settings
6. Optional Google Sheet is connected for dedicated logging

### 2. Inbound call handling

1. Caller dials the Twilio number
2. Twilio sends the request to Awaaz
3. Awaaz resolves the business
4. Caller speaks with the voice agent
5. AI captures appointment or inquiry details
6. The result is logged to Supabase and optionally Google Sheets

### 3. Appointment booking

Depending on configuration, booking can use:

- business data and available slots derived from stored context
- calendar-backed availability
- a shared scheduling layer during early rollout

### 4. Admin oversight

Admins can monitor:

- owner list
- owner detail records
- platform health
- billing-related views

## Deployment

### Frontend deployment

Deploy the Vite frontend to any static hosting provider or app platform that supports modern frontend builds.

Typical flow:

1. Set production frontend environment variables
2. Run `npm run build`
3. Deploy the generated assets

### Backend deployment

Deploy the telephony server to a platform that supports:

- Node.js
- public HTTPS access
- long-running Express services

Production server requirements:

- valid `APP_BASE_URL`
- secure secret storage for server credentials
- Twilio webhook access to the deployed backend

### Recommended production architecture

- frontend hosted separately
- telephony server hosted on a stable backend platform
- Supabase as managed database and auth
- Google Apps Script bridge deployed independently
- Twilio pointed at the deployed telephony server

## Security Notes

This project touches telephony, auth, and multiple third-party APIs, so production hygiene matters.

### Critical rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Treat all `VITE_*` values as public
- Keep Twilio auth secrets server-only
- Avoid storing live secrets in README files, screenshots, or example commits
- Rotate any credential that was accidentally shared

### Repository hygiene

- add `.env.local` to `.gitignore`
- do not hardcode live credentials in source code
- prefer platform secret managers for production

### Telephony validation

If `TWILIO_AUTH_TOKEN` is set, the server validates Twilio request signatures. Keep this enabled in production.

## Troubleshooting

### Frontend loads but auth or data fails

- verify `VITE_SUPABASE_URL`
- verify `VITE_SUPABASE_ANON_KEY`
- confirm the Supabase schema and migrations were applied

### Telephony server starts but inbound calls fail

- confirm `APP_BASE_URL` points to a public HTTPS URL
- confirm Twilio webhook URLs are correct
- confirm the process is reachable from the internet

### Calls connect but logging fails

- verify Supabase server credentials
- verify `GOOGLE_BRIDGE_URL`
- confirm your bridge deployment accepts POST requests

### AI responds incorrectly or not at all

- verify `GEMINI_API_KEY` and `GROQ_API_KEY`
- confirm provider limits and quotas
- verify the configured model name

### Voice playback fails

- verify `SARVAM_API_KEY`
- confirm the server can generate and serve audio files

### Google Sheet connection fails in Settings

- run `supabase_migration_add_business_sheet_fields.sql`
- verify the Google Apps Script bridge is deployed and reachable
- use a real Google Sheet URL or spreadsheet ID, not a Docs URL

## Roadmap

- persistent session storage for telephony
- stronger production call transfer flows
- richer analytics and reporting
- per-business calendar ownership
- background jobs and retry handling
- better observability and audit logging
- stronger CI and automated environment validation

## Presentation Notes

If you are presenting this repository, the best live demo flow is:

1. Show the landing page
2. Log in as an owner and show dashboard, calls, appointments, analytics, and settings
3. Show the business sheet connection flow
4. Explain the Twilio -> AI -> Supabase -> dashboard architecture
5. Demo the telephony webhook flow with ngrok or screenshots

## Status

This repository is a working product foundation for an AI receptionist platform and is structured for further production hardening. The current implementation already supports the key business loop: answer calls, capture intent, book outcomes, and surface the data to operators.
