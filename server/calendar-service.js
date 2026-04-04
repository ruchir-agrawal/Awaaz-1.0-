function getCalendarEnv() {
    return {
        apiBaseUrl: (process.env.CAL_COM_API_BASE_URL || "https://api.cal.com").replace(/\/$/, ""),
        apiVersion: process.env.CAL_COM_API_VERSION || "2024-08-13",
        apiKey: process.env.CAL_COM_API_KEY || "",
        defaultTimeZone: process.env.CAL_COM_TIMEZONE || "Asia/Kolkata",
        defaultEventTypeId: process.env.CAL_COM_EVENT_TYPE_ID || "",
        defaultEventTypeSlug: process.env.CAL_COM_EVENT_TYPE_SLUG || "",
        defaultUsername: process.env.CAL_COM_USERNAME || "",
        defaultOrganizationSlug: process.env.CAL_COM_ORGANIZATION_SLUG || "",
        defaultEventLengthMinutes: Number(process.env.CAL_COM_EVENT_LENGTH_MINUTES || 30),
        eventTypeIdMap: parseJson(process.env.CAL_COM_EVENT_TYPE_ID_MAP || "{}"),
        eventTypeSlugMap: parseJson(process.env.CAL_COM_EVENT_TYPE_SLUG_MAP || "{}"),
        usernameMap: parseJson(process.env.CAL_COM_USERNAME_MAP || "{}"),
        organizationSlugMap: parseJson(process.env.CAL_COM_ORGANIZATION_SLUG_MAP || "{}"),
        timeZoneMap: parseJson(process.env.CAL_COM_TIMEZONE_MAP || "{}"),
    };
}

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
    const env = getCalendarEnv();
    const eventTypeIdRaw = pickMappedValue(env.eventTypeIdMap, business) || env.defaultEventTypeId;
    const eventTypeId = eventTypeIdRaw ? Number(eventTypeIdRaw) : null;
    const eventTypeSlug = pickMappedValue(env.eventTypeSlugMap, business) || env.defaultEventTypeSlug || "";
    const username = pickMappedValue(env.usernameMap, business) || env.defaultUsername || "";
    const organizationSlug = pickMappedValue(env.organizationSlugMap, business) || env.defaultOrganizationSlug || "";
    const timeZone = pickMappedValue(env.timeZoneMap, business) || env.defaultTimeZone;

    return {
        eventTypeId: Number.isFinite(eventTypeId) ? eventTypeId : null,
        eventTypeSlug,
        username,
        organizationSlug,
        timeZone,
        lengthInMinutes: env.defaultEventLengthMinutes,
    };
}

function hasResolvableConfig(config) {
    const env = getCalendarEnv();
    return Boolean(
        env.apiKey
        && (
            config.eventTypeId
            || (config.eventTypeSlug && config.username)
        )
    );
}

function buildSlotsUrl(config, startTime, endTime) {
    const env = getCalendarEnv();
    const url = new URL(`${env.apiBaseUrl}/v1/slots`);
    url.searchParams.set("apiKey", env.apiKey);
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

    const env = getCalendarEnv();
    const response = await fetch(`${env.apiBaseUrl}/v2/bookings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.apiKey}`,
            "Content-Type": "application/json",
            "cal-api-version": env.apiVersion,
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
    return getCalendarEnv().apiKey ? "cal.com" : "sheet-fallback";
}
