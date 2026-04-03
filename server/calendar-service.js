const CAL_API_BASE_URL = (process.env.CAL_COM_API_BASE_URL || "https://api.cal.com").replace(/\/$/, "");
const CAL_API_VERSION = process.env.CAL_COM_API_VERSION || "2024-08-13";
const CAL_API_KEY = process.env.CAL_COM_API_KEY || "";
const DEFAULT_TIME_ZONE = process.env.CAL_COM_TIMEZONE || "Asia/Kolkata";
const DEFAULT_EVENT_TYPE_ID = process.env.CAL_COM_EVENT_TYPE_ID || "";
const DEFAULT_EVENT_TYPE_SLUG = process.env.CAL_COM_EVENT_TYPE_SLUG || "";
const DEFAULT_USERNAME = process.env.CAL_COM_USERNAME || "";
const DEFAULT_ORGANIZATION_SLUG = process.env.CAL_COM_ORGANIZATION_SLUG || "";
const DEFAULT_EVENT_LENGTH_MINUTES = Number(process.env.CAL_COM_EVENT_LENGTH_MINUTES || 30);
const EVENT_TYPE_ID_MAP = parseJson(process.env.CAL_COM_EVENT_TYPE_ID_MAP || "{}");
const EVENT_TYPE_SLUG_MAP = parseJson(process.env.CAL_COM_EVENT_TYPE_SLUG_MAP || "{}");
const USERNAME_MAP = parseJson(process.env.CAL_COM_USERNAME_MAP || "{}");
const ORGANIZATION_SLUG_MAP = parseJson(process.env.CAL_COM_ORGANIZATION_SLUG_MAP || "{}");
const TIME_ZONE_MAP = parseJson(process.env.CAL_COM_TIMEZONE_MAP || "{}");

function parseJson(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function pickMappedValue(map, business) {
    if (!business || !map || typeof map !== "object") {
        return "";
    }

    return (
        map[business.id]
        || map[business.slug]
        || map[business.name]
        || ""
    );
}

function resolveBusinessConfig(business) {
    const eventTypeIdRaw = pickMappedValue(EVENT_TYPE_ID_MAP, business) || DEFAULT_EVENT_TYPE_ID;
    const eventTypeId = eventTypeIdRaw ? Number(eventTypeIdRaw) : null;
    const eventTypeSlug = pickMappedValue(EVENT_TYPE_SLUG_MAP, business) || DEFAULT_EVENT_TYPE_SLUG || "";
    const username = pickMappedValue(USERNAME_MAP, business) || DEFAULT_USERNAME || "";
    const organizationSlug = pickMappedValue(ORGANIZATION_SLUG_MAP, business) || DEFAULT_ORGANIZATION_SLUG || "";
    const timeZone = pickMappedValue(TIME_ZONE_MAP, business) || DEFAULT_TIME_ZONE;

    return {
        eventTypeId: Number.isFinite(eventTypeId) ? eventTypeId : null,
        eventTypeSlug,
        username,
        organizationSlug,
        timeZone,
        lengthInMinutes: DEFAULT_EVENT_LENGTH_MINUTES,
    };
}

function hasResolvableConfig(config) {
    return Boolean(
        CAL_API_KEY
        && (
            config.eventTypeId
            || (config.eventTypeSlug && config.username)
        )
    );
}

function buildSlotsUrl(config, startTime, endTime) {
    const url = new URL(`${CAL_API_BASE_URL}/v1/slots`);
    url.searchParams.set("apiKey", CAL_API_KEY);
    url.searchParams.set("startTime", startTime.toISOString());
    url.searchParams.set("endTime", endTime.toISOString());
    url.searchParams.set("timeZone", config.timeZone);

    if (config.eventTypeId) {
        url.searchParams.set("eventTypeId", String(config.eventTypeId));
    } else {
        url.searchParams.set("eventTypeSlug", config.eventTypeSlug);
        url.searchParams.set("username", config.username);
        if (config.organizationSlug) {
            url.searchParams.set("orgSlug", config.organizationSlug);
        }
    }

    return url.toString();
}

function normalizeSlotDates(slotPayload) {
    if (!slotPayload || typeof slotPayload !== "object") {
        return [];
    }

    return Object.values(slotPayload)
        .flatMap((daySlots) => Array.isArray(daySlots) ? daySlots : [])
        .map((slot) => new Date(slot.time))
        .filter((slot) => !Number.isNaN(slot.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
}

export function isCalendarConfiguredForBusiness(business) {
    return hasResolvableConfig(resolveBusinessConfig(business));
}

export async function getCalendarSlots({ business, anchorDate, days = 7, limit = 3 }) {
    const config = resolveBusinessConfig(business);
    if (!hasResolvableConfig(config)) {
        return [];
    }

    const startTime = new Date(anchorDate || Date.now());
    const minimumStart = new Date(Date.now() + 30 * 60 * 1000);
    if (startTime < minimumStart) {
        startTime.setTime(minimumStart.getTime());
    }

    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + days);

    const response = await fetch(buildSlotsUrl(config, startTime, endTime));
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cal.com slots lookup failed: ${response.status} ${errText}`);
    }

    const json = await response.json();
    return normalizeSlotDates(json?.slots).slice(0, limit);
}

export async function createCalendarBooking({
    business,
    patientName,
    phoneNumber,
    start,
    notes,
    metadata = {},
}) {
    const config = resolveBusinessConfig(business);
    if (!hasResolvableConfig(config)) {
        return null;
    }

    const body = {
        start: start.toISOString(),
        attendee: {
            name: patientName || "Guest",
            timeZone: config.timeZone,
            phoneNumber: phoneNumber || undefined,
            email: "no-email@awaaz.local",
            language: "en",
        },
        metadata,
        lengthInMinutes: config.lengthInMinutes,
        bookingFieldsResponses: notes ? { notes } : {},
        location: { type: "address" },
        allowConflicts: false,
        allowBookingOutOfBounds: false,
    };

    if (config.eventTypeId) {
        body.eventTypeId = config.eventTypeId;
    } else {
        body.eventTypeSlug = config.eventTypeSlug;
        body.username = config.username;
        if (config.organizationSlug) {
            body.organizationSlug = config.organizationSlug;
        }
    }

    const response = await fetch(`${CAL_API_BASE_URL}/v2/bookings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${CAL_API_KEY}`,
            "Content-Type": "application/json",
            "cal-api-version": CAL_API_VERSION,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cal.com booking failed: ${response.status} ${errText}`);
    }

    const json = await response.json();
    return json?.data || null;
}

export function getCalendarProviderLabel() {
    return CAL_API_KEY ? "cal.com" : "sheet-fallback";
}
