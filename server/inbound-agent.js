import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import {
    createCalendarBooking,
    getCalendarProviderLabel,
    getCalendarSlots,
    isCalendarConfiguredForBusiness,
} from "./calendar-service.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const audioDir = path.join(workspaceRoot, ".telephony-audio");

const app = express();
const { VoiceResponse } = twilio.twiml;

app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "5mb" }));
app.use("/generated-audio", express.static(audioDir, { maxAge: "1h" }));

const port = Number(process.env.TELEPHONY_PORT || 8787);
const appBaseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
const googleBridgeUrl = process.env.GOOGLE_BRIDGE_URL || process.env.VITE_GOOGLE_BRIDGE_URL || "";
const sarvamApiKey = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const voiceRenderer = (process.env.VOICE_RENDERER || "sarvam").toLowerCase();
const twilioVoice = process.env.TWILIO_VOICE || "Polly.Aditi";
const twilioLanguage = process.env.TWILIO_LANGUAGE || "en-IN";
const gatherSpeechTimeout = process.env.TWILIO_SPEECH_TIMEOUT || "auto";
const gatherInputTimeout = Number(process.env.TWILIO_INPUT_TIMEOUT || 4);
const llmPreference = (process.env.LLM_PROVIDER_PRIORITY || "groq,gemini")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseServerKey = supabaseServiceRoleKey || supabaseAnonKey;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
const transferFallbackNumber = process.env.TWILIO_TRANSFER_NUMBER || "";
const preferredSarvamSpeaker = process.env.SARVAM_SPEAKER || "shubh";
const inboundNumberMap = parseJson(process.env.TWILIO_NUMBER_TO_BUSINESS_MAP || "{}");
const sessions = new Map();

const supabase = supabaseUrl && supabaseServerKey
    ? createClient(supabaseUrl, supabaseServerKey, { auth: { persistSession: false } })
    : null;

const ACTION_REGEX = /\[\[ACTION:\s*(\w+)\s*\|(.*?)\]\]/gis;
const TAG_REGEX = /\[\[.*?\]\]/gis;
const MAX_HISTORY_MESSAGES = 8;
const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

await fs.mkdir(audioDir, { recursive: true });

app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "awaaz-telephony",
        time: new Date().toISOString(),
        appBaseUrlConfigured: Boolean(appBaseUrl),
        supabaseConfigured: Boolean(supabase),
        usingServiceRole: Boolean(supabaseServiceRoleKey),
        googleBridgeConfigured: Boolean(googleBridgeUrl),
        calendarProvider: getCalendarProviderLabel(),
        sarvamConfigured: Boolean(sarvamApiKey),
    });
});

app.post("/voice/incoming", optionalTwilioValidation, async (req, res) => {
    const callSid = req.body.CallSid || crypto.randomUUID();
    const customerPhone = normalizePhone(req.body.From);
    const inboundNumber = normalizePhone(req.body.To);

    try {
        const business = await resolveBusiness(inboundNumber);
        if (!business) {
            const twiml = new VoiceResponse();
            twiml.say({ voice: "Polly.Aditi" }, "Sorry, no active business is configured for this number yet.");
            twiml.hangup();
            return respondWithTwiml(res, twiml);
        }

        const session = await getOrCreateSession({ callSid, customerPhone, inboundNumber, business });
        
        // --- NEW: LOG TO SUPABASE ---
        if (supabase) {
            const { data: callData, error: callError } = await supabase
                .from('calls')
                .insert({
                    business_id: business.id,
                    customer_phone: customerPhone,
                    call_source: 'phone',
                    outcome: 'in-progress',
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (!callError && callData) {
                session.callId = callData.id;
                console.log(`[LOG] Call record created in Supabase: ${callData.id}`);
            } else {
                console.warn("[LOG] Failed to create call record in Supabase:", callError?.message);
            }
        }
        // ----------------------------

        const greeting = `Namaste, you have reached ${business.name}. I am ${business.agent_name || "Awaaz"}. How may I help you today?`;
        const audioUrl = await synthesizeSpeech(greeting, session.callSid, "welcome");

        const twiml = new VoiceResponse();
        appendGatherStep(twiml, audioUrl, "/voice/turn");
        respondWithTwiml(res, twiml);
    } catch (error) {
        console.error("Incoming call bootstrap failed:", error);
        const twiml = new VoiceResponse();
        twiml.say({ voice: "Polly.Aditi" }, "Sorry, the assistant is temporarily unavailable. Please try again shortly.");
        twiml.hangup();
        respondWithTwiml(res, twiml);
    }
});

app.post("/voice/turn", optionalTwilioValidation, async (req, res) => {
    const turnStart = performance.now();
    const callSid = req.body.CallSid;
    const session = sessions.get(callSid);
    const twiml = new VoiceResponse();

    if (!session) {
        twiml.say({ voice: "Polly.Aditi" }, "The session expired. Please call again.");
        twiml.hangup();
        return respondWithTwiml(res, twiml);
    }

    const speechText = (req.body.SpeechResult || "").trim();
    const digits = (req.body.Digits || "").trim();

    try {
        if (digits === "0") {
            await markSessionTransfer(session, "Caller pressed 0");
            appendTransferOrFallback(twiml, session, "Connecting you to the clinic team.");
            return respondWithTwiml(res, twiml);
        }

        if (!speechText) {
            session.noInputCount += 1;
            if (session.noInputCount >= 2) {
                await ensureCallLogged(session, "No speech captured before hangup");
                const goodbyeUrl = await synthesizeSpeech(
                    "I could not hear anything clearly. Please call again whenever you are ready. Dhanyavaad.",
                    session.callSid,
                    `no-input-${session.turns + 1}`
                );
                twiml.play(goodbyeUrl);
                twiml.hangup();
                return respondWithTwiml(res, twiml);
            }

            const retryUrl = await synthesizeSpeech(
                "I did not catch that. Please say your preferred appointment date, time, and reason for visiting.",
                session.callSid,
                `retry-${session.turns + 1}`
            );
            appendGatherStep(twiml, retryUrl, "/voice/turn");
            return respondWithTwiml(res, twiml);
        }

        session.noInputCount = 0;
        session.turns += 1;
        session.transcript.push(`CUSTOMER: ${speechText}`);
        session.messages.push({ role: "user", content: speechText });
        await syncSupabaseCall(session, {
            transcript: buildTranscript(session),
            customer_phone: session.captured.phone_number || session.customerPhone || null,
        });

        const llmStart = performance.now();
        const aiResponse = await generateAssistantReply(session);
        const llmEnd = performance.now();
        console.log(`[LATENCY] LLM Turnaround: ${(llmEnd - llmStart).toFixed(2)}ms`);

        const actions = extractActions(aiResponse);
        let cleanResponse = getSpokenResponse(aiResponse);

        let shouldClose = false;

        for (const action of actions) {
            mergeCapturedData(session, action.type, action.params);

            if (action.type === "check_calendar_availability") {
                cleanResponse = await buildCalendarAvailabilityResponseEnhanced(session, cleanResponse);
            }

            if (action.type === "book_appointment") {
                await handleBookedAppointment(session);
            }

            if (action.type === "log_call_data" || action.type === "LOG_CALL") {
                await ensureCallLogged(session, "Assistant requested explicit logging");
            }

            if (action.type === "transfer_call") {
                shouldClose = true;
                await markSessionTransfer(session, action.params.reason || "Assistant requested transfer");
            }
        }

        if (!shouldClose) {
            shouldClose = isClosingResponse(cleanResponse, actions);
        }

        session.messages.push({ role: "assistant", content: cleanResponse });
        session.transcript.push(`AGENT: ${cleanResponse}`);
        await syncSupabaseCall(session, {
            transcript: buildTranscript(session),
            customer_phone: session.captured.phone_number || session.customerPhone || null,
        });

        const ttsStart = performance.now();
        const responseAudioUrl = await synthesizeSpeech(cleanResponse, session.callSid, `turn-${session.turns}`);
        const ttsEnd = performance.now();
        console.log(`[LATENCY] TTS Turnaround: ${(ttsEnd - ttsStart).toFixed(2)}ms`);
        console.log(`[LATENCY] Total Turnaround (Server): ${(ttsEnd - turnStart).toFixed(2)}ms`);

        if (shouldClose && session.transferRequested) {
            await ensureCallLogged(session, "Transfer path");
            twiml.play(responseAudioUrl);
            appendTransferOrFallback(twiml, session);
            return respondWithTwiml(res, twiml);
        }

        if (shouldClose) {
            await ensureCallLogged(session, "Assistant closed conversation");
            twiml.play(responseAudioUrl);
            twiml.hangup();
            return respondWithTwiml(res, twiml);
        }

        appendGatherStep(twiml, responseAudioUrl, "/voice/turn");
        respondWithTwiml(res, twiml);
    } catch (error) {
        console.error("Voice turn failed:", error);
        await ensureCallLogged(session, "Unhandled voice turn error");
        twiml.say({ voice: "Polly.Aditi" }, "Something went wrong while processing your request. Please call again in a moment.");
        twiml.hangup();
        respondWithTwiml(res, twiml);
    }
});

app.post("/voice/status", optionalTwilioValidation, async (req, res) => {
    const callSid = req.body.CallSid;
    const callStatus = (req.body.CallStatus || "").toLowerCase();
    const session = sessions.get(callSid);

    if (session && ["completed", "busy", "failed", "no-answer", "canceled"].includes(callStatus)) {
        try {
            await ensureCallLogged(session, `Status callback: ${callStatus}`);
        } catch (error) {
            console.error("Status callback logging failed:", error);
        } finally {
            sessions.delete(callSid);
        }
    }

    res.status(204).end();
});

app.listen(port, () => {
    console.log(`Awaaz telephony server listening on http://localhost:${port}`);
});

function respondWithTwiml(res, twiml) {
    res.type("text/xml");
    res.send(twiml.toString());
}

function parseJson(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function normalizePhone(value) {
    return (value || "").replace(/[^\d+]/g, "");
}

async function resolveBusiness(inboundNumber) {
    if (!supabase) {
        return null;
    }

    const mappedValue = inboundNumberMap[inboundNumber] || inboundNumberMap[inboundNumber.replace(/^\+/, "")];
    if (mappedValue) {
        const business = await fetchBusinessByMappedValue(mappedValue);
        if (business) {
            return business;
        }
        console.warn(`Mapped business "${mappedValue}" was not accessible from Supabase for inbound number ${inboundNumber}.`);
    }

    const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("is_active", true);

    if (error) {
        throw new Error(`Supabase business lookup failed: ${error.message}`);
    }

    return (data || []).find((business) => normalizePhone(business.phone) === inboundNumber) || data?.[0] || null;
}

async function fetchBusinessByMappedValue(mappedValue) {
    if (!supabase) {
        return null;
    }

    const candidates = [
        supabase.from("businesses").select("*").eq("slug", mappedValue).maybeSingle(),
        supabase.from("businesses").select("*").eq("name", mappedValue).maybeSingle(),
        supabase.from("businesses").select("*").eq("id", mappedValue).maybeSingle(),
    ];

    for (const candidate of candidates) {
        const { data, error } = await candidate;
        if (error) {
            console.warn(`Business lookup warning for "${mappedValue}": ${error.message}`);
            continue;
        }
        if (data) {
            return data;
        }
    }

    return null;
}

async function getOrCreateSession({ callSid, customerPhone, inboundNumber, business }) {
    const existing = sessions.get(callSid);
    if (existing) {
        return existing;
    }

    const sessionUid = `${(business.slug || "AWZ").toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const systemPrompt = await buildSystemPrompt({ business, customerPhone, sessionUid });
    const session = {
        callSid,
        inboundNumber,
        customerPhone,
        business,
        sessionUid,
        systemPrompt,
        messages: [{ role: "system", content: systemPrompt }],
        transcript: [],
        captured: {
            session_uid: sessionUid,
            patient_name: null,
            phone_number: customerPhone || null,
            new_or_returning: null,
            service_reason: null,
            appointment_datetime: null,
        },
        hasLogged: false,
        noInputCount: 0,
        turns: 0,
        transferRequested: false,
        transferReason: "",
        callId: null,
        appointmentId: null,
        calendarBookingUid: null,
        startTime: Date.now(),
    };

    sessions.set(callSid, session);
    return session;
}

async function buildSystemPrompt({ business, customerPhone, sessionUid }) {
    const nowIst = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });

    const defaultPrompt = [
        `You are ${business.agent_name || "Awaaz"}, the AI voice receptionist for ${business.name}.`,
        "You handle inbound phone calls and help the caller book appointments smoothly.",
        "Keep answers concise, warm, and natural for an Indian customer service tone.",
        `Current time in India: ${nowIst}.`,
        business.city ? `Business city: ${business.city}.` : "",
        business.address ? `Business address: ${business.address}.` : "",
        business.hours_opening && business.hours_closing
            ? `Business hours: ${business.hours_opening} to ${business.hours_closing}.`
            : "",
        business.services?.length ? `Services offered: ${business.services.join(", ")}.` : "",
    ].filter(Boolean).join("\n");

    let prompt = business.system_prompt || defaultPrompt;
    prompt = prompt
        .replace(/{{SESSION_UID}}/g, sessionUid)
        .replace(/{{current_time_IST}}/g, nowIst)
        .replace(/{{user_number}}/g, customerPhone || "Unknown");

    const appointmentContext = await fetchAppointmentsForPromptEnhanced(business);

    // Build the action-format instructions.
    // CRITICAL: We do NOT show raw [[ACTION:...]] examples in the prompt.
    // The user's system_prompt already describes the functions (check_calendar_availability,
    // book_appointment, log_call_data, transfer_call). We only need to tell the LLM
    // the exact OUTPUT FORMAT to use, and that it must NEVER be spoken aloud.
    const actionInstructions = [
        "=== SILENT ACTION RULES ===",
        "You may optionally append one or more machine-only action tags after your spoken reply.",
        "The spoken reply must come first. Action tags must come after it, on a new line.",
        "Never mention tag names, field names, key:value pairs, or bracket syntax to the caller.",
        "Allowed action names are check_calendar_availability, book_appointment, log_call_data, transfer_call.",
        `When logging a call, always include session_uid: ${sessionUid}.`,
        "Whenever you emit book_appointment, set appointment_datetime in exact YYYY-MM-DD HH:mm format using India time.",
        "If you output an action tag, keep the spoken reply natural and separate from the tag.",
        "=== END SILENT ACTION RULES ===",
    ].join("\n");

    return [
        prompt,
        actionInstructions,
        appointmentContext,
    ].filter(Boolean).join("\n\n");
}

async function fetchAppointmentsForPrompt(businessName) {
    if (!googleBridgeUrl || !businessName) {
        return "";
    }

    try {
        const response = await fetch(`${googleBridgeUrl}?businessName=${encodeURIComponent(businessName)}`);
        if (!response.ok) {
            return "";
        }

        const json = await response.json();
        if (json.status !== "ok" || !Array.isArray(json.appointments) || json.appointments.length === 0) {
            return "";
        }

        const lines = json.appointments
            .slice(-15) // Get last 15 for better context
            .map((appointment) =>
                `- ${appointment.callTime}: ${appointment.patientName} (${appointment.mobile}) — ${appointment.reason} — Status: ${appointment.status}`
            )
            .join("\n");

        return `[EXISTING APPOINTMENTS - DO NOT DOUBLE BOOK THESE SLOTS]\nBefore confirming any new booking, check this list. If the requested time slot already has a confirmed appointment, say that slot is unavailable and suggest another one.\n\n${lines}`;
    } catch {
        return "";
    }
}

async function fetchBridgeAppointments(businessName) {
    if (!googleBridgeUrl || !businessName) {
        return [];
    }

    try {
        const response = await fetch(`${googleBridgeUrl}?businessName=${encodeURIComponent(businessName)}`);
        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        if (json.status !== "ok" || !Array.isArray(json.appointments)) {
            return [];
        }

        return json.appointments;
    } catch {
        return [];
    }
}

async function generateAssistantReply(session) {
    const systemMessage = session.messages.find((message) => message.role === "system");
    const nonSystemMessages = session.messages.filter((message) => message.role !== "system");
    const trimmedMessages = nonSystemMessages.slice(-MAX_HISTORY_MESSAGES);
    const currentHistory = systemMessage ? [systemMessage, ...trimmedMessages] : trimmedMessages;

    const lastErrorMessages = [];

    for (const provider of llmPreference) {
        if (provider === "groq" && groqApiKey) {
            try {
                return await callGroq(currentHistory);
            } catch (error) {
                console.warn(`Groq failed for call ${session.callSid}: ${error.message}`);
                lastErrorMessages.push(`groq: ${error.message}`);
            }
        }

        if (provider === "gemini" && geminiApiKey) {
            try {
                return await callGemini(currentHistory, session.systemPrompt);
            } catch (error) {
                console.warn(`Gemini failed for call ${session.callSid}: ${error.message}`);
                lastErrorMessages.push(`gemini: ${error.message}`);
            }
        }
    }

    if (groqApiKey && !llmPreference.includes("groq")) {
        return callGroq(currentHistory);
    }

    if (geminiApiKey && !llmPreference.includes("gemini")) {
        return callGemini(currentHistory, session.systemPrompt);
    }

    if (lastErrorMessages.length > 0) {
        throw new Error(`All configured LLM providers failed. ${lastErrorMessages.join(" | ")}`);
    }

    throw new Error("No server-side LLM key is configured. Add GROQ_API_KEY or GEMINI_API_KEY.");
}

async function callGemini(history, systemPrompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: history
                    .filter((message) => message.role !== "system")
                    .map((message) => ({
                        role: message.role === "assistant" ? "model" : "user",
                        parts: [{ text: message.content }],
                    })),
                generationConfig: {
                    temperature: 0.55,
                    maxOutputTokens: 300,
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini request failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
        throw new Error(`Gemini returned no text for model ${geminiModel}.`);
    }
    return text;
}

async function callGroq(history) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: history,
            temperature: 0.45,
            max_tokens: 300,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq request failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

function extractActions(text) {
    const actions = [];
    let match;

    while ((match = ACTION_REGEX.exec(text)) !== null) {
        const type = match[1];
        const params = {};

        match[2].split("|").forEach((part) => {
            const [key, ...rest] = part.split(":");
            if (!key || rest.length === 0) {
                return;
            }
            params[key.trim()] = rest.join(":").trim();
        });

        actions.push({ type, params });
    }

    ACTION_REGEX.lastIndex = 0;
    return actions;
}

function stripTags(text) {
    let cleaned = text.replace(TAG_REGEX, "");
    cleaned = cleaned.replace(/\[\[ACTION:[\s\S]*$/i, "");
    cleaned = cleaned.replace(/\[[^\]]*\]/g, "");
    cleaned = cleaned.replace(/\bACTION\s*:.*$/gim, "");
    cleaned = cleaned.replace(/\[\[|\]\]/g, "");
    cleaned = cleaned.replace(/\|\s*\w+:\s*[^|\n]*/g, "");
    cleaned = cleaned.replace(/<\w+>/g, "");
    cleaned = cleaned.replace(/\b(?:check_calendar_availability|book_appointment|log_call_data|transfer_call|session_uid|patient_name|phone_number|appointment_datetime|service_reason|new_or_returning)\b.*$/gim, "");
    // Clean up whitespace
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
    return cleaned || "I am here. Please continue.";
}

function getSpokenResponse(rawText) {
    const actionMarkerIndex = rawText.search(/\[\[ACTION:|\bACTION\s*:/i);
    const spokenCandidate = actionMarkerIndex >= 0 ? rawText.slice(0, actionMarkerIndex) : rawText;
    return stripTags(spokenCandidate);
}

function buildTranscript(session) {
    return session.transcript.join("\n\n");
}

async function buildCalendarAvailabilityResponse(session, existingResponse) {
    const bridgeRows = await fetchBridgeAppointments(session.business.name);
    const requestedAnchor = inferRequestedDateTime(session);
    const availableSlots = computeAvailableSlots(session.business, bridgeRows, requestedAnchor).slice(0, 3);

    if (availableSlots.length === 0) {
        return "I’m sorry, I do not see any open slots right now. I can suggest another day or arrange a callback."
    }

    return `I have ${availableSlots.map(formatSlotForSpeech).join(", ")} available. Which one works best for you?`
}

function inferRequestedDateTime(session) {
    const lastUserMessage = [...session.messages].reverse().find((message) => message.role === "user")?.content?.toLowerCase() || "";
    const anchor = new Date();
    anchor.setSeconds(0, 0);

    if (lastUserMessage.includes("tomorrow")) {
        anchor.setDate(anchor.getDate() + 1);
        return anchor;
    }

    const weekdayIndex = WEEKDAY_NAMES.findIndex((day) => lastUserMessage.includes(day));
    if (weekdayIndex >= 0) {
        const candidate = new Date(anchor);
        const offset = (weekdayIndex - candidate.getDay() + 7) % 7 || 7;
        candidate.setDate(candidate.getDate() + offset);
        return candidate;
    }

    return anchor;
}

function computeAvailableSlots(business, bridgeRows, anchorDate) {
    const startHour = parseHourValue(business.hours_opening, 9);
    const endHour = parseHourValue(business.hours_closing, 19);
    const workingDays = (business.working_days || []).map((day) => day.toLowerCase());
    const occupiedKeys = new Set(
        bridgeRows
            .filter((row) => (row.status || "").toLowerCase().includes("confirm"))
            .map((row) => normalizeAppointmentKey(row.appointmentDatetime))
            .filter(Boolean)
    );

    const slots = [];
    for (let dayOffset = 0; dayOffset < 7 && slots.length < 6; dayOffset += 1) {
        const candidateDay = new Date(anchorDate);
        candidateDay.setDate(anchorDate.getDate() + dayOffset);
        const weekday = WEEKDAY_NAMES[candidateDay.getDay()];
        if (workingDays.length > 0 && !workingDays.includes(weekday)) {
            continue;
        }

        for (let hour = Math.max(startHour, 10); hour < endHour && slots.length < 6; hour += 1) {
            const slot = new Date(candidateDay);
            slot.setHours(hour, 0, 0, 0);
            if (slot <= new Date(Date.now() + 30 * 60 * 1000)) {
                continue;
            }

            const slotKey = normalizeAppointmentKey(formatSlotForSpeech(slot));
            if (!occupiedKeys.has(slotKey)) {
                slots.push(slot);
            }
        }
    }

    return slots;
}

function parseHourValue(value, fallback) {
    if (!value) return fallback;
    const raw = String(value);
    const match = raw.match(/^(\d{1,2})/);
    return match ? Number(match[1]) : fallback;
}

function normalizeAppointmentKey(value) {
    return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function formatSlotForSpeech(slot) {
    return slot.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).replace(",", " at");
}

async function syncSupabaseCall(session, updates = {}) {
    if (!supabase || !session.callId) {
        return;
    }

    try {
        const { error } = await supabase
            .from("calls")
            .update(updates)
            .eq("id", session.callId);

        if (error) {
            console.warn(`[LOG] Incremental Supabase sync failed for ${session.callId}: ${error.message}`);
        }
    } catch (error) {
        console.warn(`[LOG] Incremental Supabase sync exception for ${session.callId}: ${error.message}`);
    }
}

function mergeCapturedData(session, actionType, params) {
    if (params.patient_name) {
        session.captured.patient_name = params.patient_name;
    }
    if (params.phone_number || params.mobile) {
        session.captured.phone_number = normalizePhone(params.phone_number || params.mobile);
    }
    if (params.new_or_returning) {
        session.captured.new_or_returning = params.new_or_returning;
    }
    if (params.service_reason || params.reason) {
        session.captured.service_reason = params.service_reason || params.reason;
    }
    if (params.appointment_datetime && params.appointment_datetime.toLowerCase() !== "null") {
        session.captured.appointment_datetime = params.appointment_datetime;
    }
    if (params.session_uid) {
        session.captured.session_uid = params.session_uid;
    }

    if (actionType === "transfer_call") {
        session.transferRequested = true;
        session.transferReason = params.reason || "Requested by assistant";
    }
}

async function ensureCallLogged(session, reason) {
    if (session.hasLogged) {
        return;
    }

    const transcript = buildTranscript(session);
    if (!transcript.trim()) {
        return;
    }

    const durationSeconds = Math.round((Date.now() - session.startTime) / 1000);
    const finalOutcome = session.transferRequested ? "transferred" : 
                        (session.captured.appointment_datetime ? "booked" : "completed");

    // 1. Log to Supabase (if callId exists)
    let bridgeRecordingUrl = null;
    await syncSupabaseCall(session, {
        transcript,
        duration_seconds: durationSeconds,
        outcome: finalOutcome,
        ended_at: new Date().toISOString(),
        customer_phone: session.captured.phone_number || session.customerPhone || null,
        language_detected: twilioLanguage,
    });

    // 2. Log to Google Sheet via Bridge
    if (googleBridgeUrl) {
        const payload = {
            type: "log_call_data",
            businessName: session.business.name,
            data: {
                ...session.captured,
                phone_number: session.captured.phone_number || session.customerPhone || null,
                service_reason: session.captured.service_reason || reason,
            },
            transcript,
        };

        try {
            const response = await fetch(googleBridgeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`[LOG] Google bridge log failed: ${response.status} ${errText}`);
            } else {
                const bridgeJson = await response.json().catch(() => null);
                bridgeRecordingUrl = bridgeJson?.recordingUrl || null;
                console.log("[LOG] Google bridge log successful.");
            }
        } catch (e) {
            console.error("[LOG] Google bridge fetch exception:", e);
        }
    }

    if (bridgeRecordingUrl) {
        await syncSupabaseCall(session, { recording_url: bridgeRecordingUrl });
    }

    session.hasLogged = true;
}

async function buildCalendarAvailabilityResponseEnhanced(session, existingResponse) {
    const requestedAnchor = inferRequestedDateTime(session);
    let availableSlots = [];

    if (isCalendarConfiguredForBusiness(session.business)) {
        try {
            availableSlots = await getCalendarSlots({
                business: session.business,
                anchorDate: requestedAnchor,
                limit: 3,
            });
        } catch (error) {
            console.warn(`[CALENDAR] Falling back to sheet-derived slots: ${error.message}`);
        }
    }

    if (availableSlots.length === 0) {
        return buildCalendarAvailabilityResponse(session, existingResponse);
    }

    return `I have ${availableSlots.map(formatSlotForSpeech).join(", ")} available. Which one works best for you?`;
}

function parseAppointmentDateTime(value) {
    if (!value) {
        return null;
    }

    const normalized = String(value).trim();
    if (!normalized || normalized.toLowerCase() === "null") {
        return null;
    }

    const isoMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})[ t](\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
    if (isoMatch) {
        let hour = Number(isoMatch[2]);
        const minute = Number(isoMatch[3]);
        const meridiem = (isoMatch[4] || "").toLowerCase();

        if (meridiem === "pm" && hour < 12) hour += 12;
        if (meridiem === "am" && hour === 12) hour = 0;

        const parsed = new Date(`${isoMatch[1]}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIstDate(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const get = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatIstTime(date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const get = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${get("hour")}:${get("minute")}`;
}

function formatIstSpokenDate(date) {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

async function syncSupabaseAppointment(session, bookingDate, bookingMeta = null) {
    if (!supabase || !bookingDate || !session.business?.id) {
        return null;
    }

    const payload = {
        business_id: session.business.id,
        call_id: session.callId || null,
        customer_name: session.captured.patient_name || "Unknown caller",
        customer_phone: session.captured.phone_number || session.customerPhone || "",
        appointment_date: formatIstDate(bookingDate),
        appointment_time: formatIstTime(bookingDate),
        reason: session.captured.service_reason || null,
        notes: bookingMeta?.uid
            ? `Booked via ${getCalendarProviderLabel()} (${bookingMeta.uid})`
            : "Booked by Awaaz voice agent",
        status: "confirmed",
        updated_at: new Date().toISOString(),
    };

    if (session.appointmentId) {
        const { error } = await supabase
            .from("appointments")
            .update(payload)
            .eq("id", session.appointmentId);

        if (error) {
            console.warn(`[APPOINTMENT] Failed to update appointment ${session.appointmentId}: ${error.message}`);
        }

        return session.appointmentId;
    }

    const { data, error } = await supabase
        .from("appointments")
        .insert(payload)
        .select("id")
        .single();

    if (error) {
        console.warn(`[APPOINTMENT] Failed to create appointment: ${error.message}`);
        return null;
    }

    session.appointmentId = data?.id || null;
    return session.appointmentId;
}

async function handleBookedAppointment(session) {
    const bookingDate = parseAppointmentDateTime(session.captured.appointment_datetime);
    if (!bookingDate) {
        console.warn(`[APPOINTMENT] Could not parse appointment_datetime "${session.captured.appointment_datetime}"`);
        return null;
    }

    if (session.calendarBookingUid) {
        await syncSupabaseAppointment(session, bookingDate, { uid: session.calendarBookingUid });
        session.captured.appointment_datetime = formatIstSpokenDate(bookingDate);
        return { uid: session.calendarBookingUid };
    }

    let calendarBooking = null;
    if (isCalendarConfiguredForBusiness(session.business)) {
        try {
            calendarBooking = await createCalendarBooking({
                business: session.business,
                patientName: session.captured.patient_name,
                phoneNumber: session.captured.phone_number || session.customerPhone,
                start: bookingDate,
                notes: session.captured.service_reason || "",
                metadata: {
                    sessionUid: session.sessionUid,
                    businessSlug: session.business.slug,
                    callId: session.callId || "",
                },
            });
        } catch (error) {
            console.error(`[CALENDAR] Booking creation failed: ${error.message}`);
        }
    }

    await syncSupabaseAppointment(session, bookingDate, calendarBooking);
    session.calendarBookingUid = calendarBooking?.uid || session.calendarBookingUid || null;
    session.captured.appointment_datetime = formatIstSpokenDate(bookingDate);
    return calendarBooking;
}

async function fetchAppointmentsForPromptEnhanced(business) {
    const lines = [];

    if (supabase && business?.id) {
        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("customer_name, customer_phone, appointment_date, appointment_time, reason, status")
                .eq("business_id", business.id)
                .in("status", ["confirmed", "pending"])
                .order("appointment_date", { ascending: true })
                .order("appointment_time", { ascending: true })
                .limit(15);

            if (!error && Array.isArray(data)) {
                for (const appointment of data) {
                    lines.push(
                        `- ${appointment.appointment_date} ${appointment.appointment_time}: ${appointment.customer_name} (${appointment.customer_phone}) â€” ${appointment.reason || "General inquiry"} â€” Status: ${appointment.status}`
                    );
                }
            }
        } catch (error) {
            console.warn(`[PROMPT] Supabase appointment context failed: ${error.message}`);
        }
    }

    if (lines.length === 0) {
        return fetchAppointmentsForPrompt(business?.name);
    }

    return `[EXISTING APPOINTMENTS - DO NOT DOUBLE BOOK THESE SLOTS]\nBefore confirming any new booking, check this list. If the requested time slot already has a confirmed appointment, say that slot is unavailable and suggest another one.\n\n${lines.join("\n")}`;
}

async function markSessionTransfer(session, reason) {
    session.transferRequested = true;
    session.transferReason = reason;
}

function appendTransferOrFallback(twiml, session, spokenLead) {
    const transferNumber = transferFallbackNumber || "";

    if (spokenLead) {
        twiml.say({ voice: "Polly.Aditi" }, spokenLead);
    }

    if (transferNumber) {
        twiml.dial(transferNumber);
        return;
    }

    twiml.say({ voice: "Polly.Aditi" }, "Our team will call you back shortly. Thank you.");
    twiml.hangup();
}

function appendGatherStep(twiml, audioUrl, actionPath) {
    const gather = twiml.gather({
        input: "speech dtmf",
        numDigits: 1,
        action: absoluteUrl(actionPath),
        method: "POST",
        timeout: gatherInputTimeout,
        speechTimeout: gatherSpeechTimeout,
        language: twilioLanguage,
        enhanced: true,
    });

    if (audioUrl.startsWith("say:")) {
        gather.say({ voice: twilioVoice, language: twilioLanguage }, audioUrl.slice(4));
    } else {
        gather.play(audioUrl);
    }
    twiml.redirect({ method: "POST" }, absoluteUrl(actionPath));
}

function isClosingResponse(text, actions) {
    const lowered = text.toLowerCase();
    const hasClosingLanguage = ["goodbye", "bye", "have a nice day", "dhanyavaad", "thank you for calling"]
        .some((phrase) => lowered.includes(phrase));
    const hasTerminalAction = actions.some((action) =>
        ["log_call_data", "LOG_CALL", "transfer_call", "book_appointment"].includes(action.type)
    );

    return hasClosingLanguage && hasTerminalAction;
}

async function synthesizeSpeech(text, callSid, stepLabel) {
    if (voiceRenderer === "twilio") {
        return `say:${text}`;
    }

    if (!sarvamApiKey) {
        throw new Error("SARVAM_API_KEY is required for telephony playback.");
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-subscription-key": sarvamApiKey,
        },
        body: JSON.stringify({
            inputs: [text],
            target_language_code: "en-IN",
            speaker: preferredSarvamSpeaker,
            pace: 1.03,
            speech_sample_rate: 8000,
            enable_preprocessing: false, // Disabled for performance (Save ~1.0s)
            model: "bulbul:v3",
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sarvam TTS failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const audioBase64 = data?.audios?.[0];

    if (!audioBase64) {
        throw new Error("Sarvam TTS returned no audio");
    }

    const fileName = `${callSid}-${stepLabel}-${Date.now()}.wav`;
    const filePath = path.join(audioDir, fileName);
    await fs.writeFile(filePath, Buffer.from(audioBase64, "base64"));
    return absoluteUrl(`/generated-audio/${fileName}`);
}

function absoluteUrl(routePath) {
    if (!appBaseUrl) {
        throw new Error("APP_BASE_URL must be set to your public ngrok or deployed URL.");
    }
    return `${appBaseUrl}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
}

function optionalTwilioValidation(req, res, next) {
    if (!twilioAuthToken) {
        return next();
    }

    const signature = req.header("x-twilio-signature");
    if (!signature) {
        return res.status(403).send("Missing Twilio signature");
    }

    const url = absoluteUrl(req.path);
    const isValid = twilio.validateRequest(twilioAuthToken, signature, url, req.body);
    if (!isValid) {
        return res.status(403).send("Invalid Twilio signature");
    }

    next();
}
