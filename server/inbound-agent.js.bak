import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

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

const ACTION_REGEX = /\[\[ACTION:\s*(\w+)\s*\|(.*?)\]\]/g;
const TAG_REGEX = /\[\[.*?\]\]/g;
const MAX_HISTORY_MESSAGES = 8;

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

        const aiResponse = await generateAssistantReply(session);
        const actions = extractActions(aiResponse);
        const cleanResponse = stripTags(aiResponse).trim() || "I am here. Please continue.";

        session.messages.push({ role: "assistant", content: cleanResponse });
        session.transcript.push(`AGENT: ${cleanResponse}`);

        let shouldClose = false;

        for (const action of actions) {
            mergeCapturedData(session, action.type, action.params);

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

        const responseAudioUrl = await synthesizeSpeech(cleanResponse, session.callSid, `turn-${session.turns}`);

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

    const appointmentContext = await fetchAppointmentsForPrompt(business.name);

    return [
        prompt,
        "[TECHNICAL INSTRUCTIONS]",
        "Use these exact actions when appropriate.",
        `[[ACTION: check_calendar_availability | reason: <reason>]]`,
        `[[ACTION: book_appointment | patient_name: <name> | phone_number: <phone> | appointment_datetime: <datetime> | service_reason: <service> | new_or_returning: <status>]]`,
        `[[ACTION: log_call_data | session_uid: ${sessionUid} | patient_name: <name> | phone_number: <phone> | new_or_returning: <status> | service_reason: <reason> | appointment_datetime: <datetime>]]`,
        `[[ACTION: transfer_call | reason: <reason>]]`,
        "Latency rule: keep every spoken reply short, ideally under 25 words and one question at a time.",
        "Always gather the caller name, phone number, reason, and preferred slot before confirming a booking.",
        "If the caller sounds uncertain, repeat the appointment date and time clearly before closing.",
        "Never say the action tags aloud.",
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
            .slice(-12)
            .map((appointment) =>
                `- ${appointment.callTime}: ${appointment.patientName} (${appointment.mobile}) - ${appointment.reason} - Status: ${appointment.status}`
            )
            .join("\n");

        return `[EXISTING APPOINTMENTS - DO NOT DOUBLE BOOK THESE SLOTS]\n${lines}`;
    } catch {
        return "";
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
                    maxOutputTokens: 140,
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
            max_tokens: 140,
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
    return text.replace(TAG_REGEX, "").replace(/\s{2,}/g, " ").trim();
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
    if (session.hasLogged || !googleBridgeUrl) {
        return;
    }

    const transcript = session.transcript.join("\n\n");
    if (!transcript.trim()) {
        return;
    }

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

    const response = await fetch(googleBridgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google bridge log failed: ${response.status} ${errText}`);
    }

    session.hasLogged = true;
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
            enable_preprocessing: true,
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
