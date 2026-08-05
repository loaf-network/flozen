import { loadConfig, saveConfig } from "../store"

// 去除 BASE 尾部的斜杠，拼接时统一为单斜杠，避免出现 `//path` 导致的重定向/CORS 问题
const BASE = (import.meta.env.VITE_API_NCM_BASE as string).replace(/\/+$/, "")

function ts() {
    return Date.now()
}

let cachedIP = ""
let ipLoading: Promise<string> | null = null

// IPv4 严格校验（含 0-255 段范围），避免缓存/解析到非 IP 内容
const IP_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

// 公网 IP 获取源（依次尝试，均为 JSON 结构，避免文本解析歧义）
const IP_SOURCES = [
    "https://api.ipify.org?format=json",
    "https://ipinfo.io/json",
    "https://myip.ipip.net/json",
]

// 获取公网 IP（force=true 时忽略缓存与已存配置，重新从数据源获取）
export async function getRealIP(force = false): Promise<string> {
    if (!force && cachedIP) return cachedIP
    if (ipLoading) return ipLoading // 并发去重：首轮多个请求共享同一次获取
    ipLoading = (async () => {
        const config = await loadConfig()
        // 复用已缓存 IP，但必须通过格式校验（旧版本可能存入了错误内容）
        if (!force && config.realIP && IP_RE.test(config.realIP)) {
            cachedIP = config.realIP
            return cachedIP
        }
        for (const src of IP_SOURCES) {
            try {
                const res = await fetch(src, { signal: AbortSignal.timeout(5000) })
                const data = await res.json()
                const ip = typeof data === "string" ? data : data?.ip
                if (typeof ip === "string" && IP_RE.test(ip)) {
                    cachedIP = ip
                    await saveConfig("realIP", cachedIP)
                    return cachedIP
                }
            } catch {
                // 尝试下一个数据源
            }
        }
        return ""
    })()
    try {
        return await ipLoading
    } finally {
        ipLoading = null
    }
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
    const raw = await r.json()
    // jelly 后端对部分接口（如歌单写操作、登录轮询）返回 {status, body, cookie} 包装结构。
    // 仅当同时存在 status 与 body 字段时判定为包装，避免误伤普通接口。
    if (
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        "status" in raw &&
        "body" in raw &&
        raw.body &&
        typeof raw.body === "object"
    ) {
        const bodyObj = raw.body as Record<string, unknown>
        // 登录等接口的 cookie 在包装外层，合并进 body 供上层使用
        if (raw.cookie && !("cookie" in bodyObj)) {
            bodyObj.cookie = Array.isArray(raw.cookie)
                ? (raw.cookie as string[]).map((c) => c.split(";")[0].trim()).join("; ")
                : raw.cookie
        }
        return bodyObj as T
    }
    return raw as T
}
