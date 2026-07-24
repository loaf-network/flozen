import { loadConfig, saveConfig } from "../store"

const BASE = import.meta.env.VITE_API_NCM_BASE as string

function ts() {
    return Date.now()
}

let cachedIP = ""

async function getRealIP(): Promise<string> {
    if (cachedIP) return cachedIP
    const config = await loadConfig()
    if (config.realIP) {
        cachedIP = config.realIP
        return cachedIP
    }
    try {
        const res = await fetch("http://myip.ipip.net")
        const text = await res.text()
        const match = text.match(/[\d.]+/)
        if (match) {
            cachedIP = match[0]
            await saveConfig("realIP", cachedIP)
            return cachedIP
        }
    } catch {
        // ignore
    }
    return ""
}

export async function post<T>(path: string, params?: Record<string, string>): Promise<T> {
    const realIP = await getRealIP()
    const searchParams = new URLSearchParams({ timestamp: String(ts()) })
    if (realIP) searchParams.set("realIP", realIP)
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            searchParams.set(k, v)
        }
    }
    const r = await fetch(`${BASE}${path}?${searchParams}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params ? new URLSearchParams(params) : undefined,
    })
    return r.json() as T
}
