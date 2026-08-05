import { loadConfig, saveConfig } from "../store"

// 去除 BASE 尾部的斜杠，拼接时统一为单斜杠，避免出现 `//path` 导致的重定向/CORS 问题
const BASE = (import.meta.env.VITE_API_NCM_BASE as string).replace(/\/+$/, "")

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
    const url = `${BASE}/${path.replace(/^\/+/, "")}?${query}`
    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    })
    return r.json() as T
}
