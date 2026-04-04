import type { Business } from "@/types/database"

export const DEFAULT_BUSINESS_SHEET_TAB = "Records"

export interface BusinessSheetTarget {
    businessName?: string | null
    spreadsheetId?: string | null
    sheetName?: string | null
}

export interface BridgeAppointmentRow {
    callTime?: string
    patientName?: string
    mobile?: string
    newOrReturning?: string
    reason?: string
    appointmentDatetime?: string
    status?: string
    sessionUid?: string
    transcript?: string
    recordingLink?: string
}

export interface BridgeResponse {
    status: string
    message?: string
    appointments?: BridgeAppointmentRow[]
    spreadsheetId?: string
    spreadsheetUrl?: string
    sheetName?: string
}

export function parseSpreadsheetId(value: string | null | undefined) {
    const raw = value?.trim()
    if (!raw) return null

    const urlMatch = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (urlMatch?.[1]) {
        return urlMatch[1]
    }

    if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) {
        return raw
    }

    return null
}

export function getBusinessSheetTarget(
    business?: Pick<Business, "name" | "google_sheet_id" | "google_sheet_url" | "google_sheet_tab_name"> | null
): Required<BusinessSheetTarget> {
    return {
        businessName: business?.name || "",
        spreadsheetId: business?.google_sheet_id || parseSpreadsheetId(business?.google_sheet_url) || "",
        sheetName: business?.google_sheet_tab_name || DEFAULT_BUSINESS_SHEET_TAB,
    }
}

export function buildBridgeGetUrl(bridgeUrl: string, target: BusinessSheetTarget) {
    const url = new URL(
        bridgeUrl,
        typeof window !== "undefined" ? window.location.origin : "http://localhost"
    )

    if (target.businessName) {
        url.searchParams.set("businessName", target.businessName)
    }

    if (target.spreadsheetId) {
        url.searchParams.set("spreadsheetId", target.spreadsheetId)
    }

    if (target.sheetName) {
        url.searchParams.set("sheetName", target.sheetName)
    }

    return url.toString()
}

export function buildBridgePayload(
    type: string,
    target: BusinessSheetTarget,
    extras: Record<string, unknown> = {}
) {
    return {
        type,
        businessName: target.businessName || "",
        spreadsheetId: target.spreadsheetId || undefined,
        sheetName: target.sheetName || DEFAULT_BUSINESS_SHEET_TAB,
        ...extras,
    }
}

export async function postBridgeJson<T extends BridgeResponse>(bridgeUrl: string, payload: Record<string, unknown>) {
    const response = await fetch(bridgeUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`Bridge request failed with HTTP ${response.status}`)
    }

    return response.json() as Promise<T>
}

export async function provisionBusinessSheet(
    bridgeUrl: string,
    target: BusinessSheetTarget & { createDedicatedSpreadsheet?: boolean }
) {
    return postBridgeJson<BridgeResponse>(
        bridgeUrl,
        buildBridgePayload("INIT_OWNER", target, {
            createDedicatedSpreadsheet: target.createDedicatedSpreadsheet ?? !target.spreadsheetId,
        })
    )
}

export function isBusinessSheetSchemaMissing(message: string | null | undefined) {
    const value = (message || "").toLowerCase()
    return (
        value.includes("google_sheet_id") ||
        value.includes("google_sheet_url") ||
        value.includes("google_sheet_tab_name")
    ) && (
        value.includes("schema cache") ||
        value.includes("column")
    )
}
