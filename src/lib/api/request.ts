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
    const query = new URLSearchParams({ timestamp: String(ts()) })
    if (realIP) query.set("realIP", realIP)
    const body = new URLSearchParams(params)
    const r = await fetch(`${BASE}${path}?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    })
    return r.json() as T
}
