function getCalOAuthConfig() {
    return {
        apiBaseUrl: (process.env.CAL_COM_API_BASE_URL || "https://api.cal.com").replace(/\/$/, ""),
        appBaseUrl: (process.env.CAL_COM_APP_BASE_URL || "https://app.cal.com").replace(/\/$/, ""),
        apiVersion: process.env.CAL_COM_API_VERSION || "2024-08-13",
        clientId: process.env.CAL_COM_OAUTH_CLIENT_ID || "",
        clientSecret: process.env.CAL_COM_OAUTH_CLIENT_SECRET || "",
        scopes: process.env.CAL_COM_OAUTH_SCOPES || "PROFILE_READ APPS_READ APPS_WRITE",
    };
}

export function isCalOAuthConfigured() {
    const config = getCalOAuthConfig();
    return Boolean(config.clientId && config.clientSecret);
}

export function buildCalAuthorizationUrl({ redirectUri, state }) {
    const config = getCalOAuthConfig();
    const url = new URL(`${config.appBaseUrl}/auth/oauth2/authorize`);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", config.scopes);
    url.searchParams.set("state", state);
    return url.toString();
}

export async function exchangeAuthorizationCode({ code, redirectUri }) {
    const config = getCalOAuthConfig();
    const response = await fetch(`${config.apiBaseUrl}/v2/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "cal-api-version": config.apiVersion,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });

    return handleCalResponse(response, "Cal.com OAuth token exchange failed");
}

export async function fetchCalProfile(accessToken) {
    const config = getCalOAuthConfig();
    const response = await fetch(`${config.apiBaseUrl}/v2/me`, {
        headers: buildAuthHeaders(accessToken),
    });

    const json = await handleCalResponse(response, "Cal.com profile lookup failed");
    return json?.data || json;
}

export async function fetchGoogleCalendarConnectUrl(accessToken, redirectUri) {
    const config = getCalOAuthConfig();
    const url = new URL(`${config.apiBaseUrl}/v2/calendars/google/connect`);
    url.searchParams.set("isDryRun", "false");
    url.searchParams.set("redir", redirectUri);

    const response = await fetch(url, {
        headers: buildAuthHeaders(accessToken),
    });

    const json = await handleCalResponse(response, "Cal.com Google calendar connect URL lookup failed");
    const connectUrl = json?.data?.url
        || json?.data?.connectUrl
        || json?.data?.authUrl
        || json?.url
        || json?.connectUrl
        || json?.authUrl;

    if (!connectUrl) {
        throw new Error("Cal.com calendar connect URL was missing from the response.");
    }

    return connectUrl;
}

export async function checkGoogleCalendarConnection(accessToken) {
    const config = getCalOAuthConfig();
    const response = await fetch(`${config.apiBaseUrl}/v2/calendars/google/check`, {
        headers: buildAuthHeaders(accessToken),
    });

    if (response.ok) {
        return true;
    }

    if (response.status === 404 || response.status === 400) {
        return false;
    }

    const text = await response.text();
    throw new Error(`Cal.com calendar connection check failed: ${response.status} ${text}`);
}

function buildAuthHeaders(accessToken) {
    const config = getCalOAuthConfig();
    return {
        Authorization: `Bearer ${accessToken}`,
        "cal-api-version": config.apiVersion,
    };
}

async function handleCalResponse(response, label) {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${label}: ${response.status} ${text}`);
    }

    return response.json().catch(() => ({}));
}
