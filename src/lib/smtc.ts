import { invoke } from "@tauri-apps/api/core"

let platform: string | null = null

async function getPlatform(): Promise<string> {
    if (platform) return platform
    try {
        platform = await invoke<string>("get_platform")
    } catch {
        platform = "web"
    }
    return platform
}

function isMobile(p: string) {
    return p === "android" || p === "ios"
}

function hasMediaSession() {
    return typeof navigator !== "undefined" && "mediaSession" in navigator
}

let lastDuration = 0

export async function initMedia() {
    const p = await getPlatform()
    if (isMobile(p) || !hasMediaSession()) return
    const { play, pause, next, prev, clearQueue, seek } = await import("./player")
    const ms = navigator.mediaSession
    try {
        ms.setActionHandler("play", () => play())
        ms.setActionHandler("pause", () => pause())
        ms.setActionHandler("previoustrack", () => prev())
        ms.setActionHandler("nexttrack", () => next())
        ms.setActionHandler("stop", () => clearQueue())
        ms.setActionHandler("seekto", (details) => {
            if (details.seekTime != null) seek(details.seekTime)
        })
    } catch {
        /* 部分动作不受支持时忽略 */
    }
}

export async function updateMedia(info: {
    title?: string
    artist?: string
    album?: string
    artworkUrl?: string
    duration?: number
    position?: number
    isPlaying?: boolean
    shuffle?: boolean
    repeatMode?: "none" | "all" | "one"
}) {
    const p = await getPlatform()
    if (isMobile(p)) {
        try {
            await invoke("smtc_update", { payload: info })
        } catch {
            /* ignore */
        }
        return
    }
    if (!hasMediaSession()) return
    const ms = navigator.mediaSession
    try {
        if (info.title !== undefined) {
            ms.metadata = new MediaMetadata({
                title: info.title,
                artist: info.artist ?? "",
                album: info.album ?? "",
                artwork: info.artworkUrl
                    ? [{ src: info.artworkUrl, sizes: "300x300", type: "image/jpeg" }]
                    : [],
            })
            lastDuration = info.duration ?? 0
        }
        if (info.isPlaying !== undefined) {
            ms.playbackState = info.isPlaying ? "playing" : "paused"
        }
        if (info.position !== undefined && lastDuration > 0) {
            ms.setPositionState({
                duration: lastDuration,
                position: Math.min(info.position, lastDuration),
                playbackRate: 1,
            })
        }
    } catch {
        /* ignore */
    }
}

export async function clearMedia() {
    const p = await getPlatform()
    if (isMobile(p)) {
        try {
            await invoke("smtc_clear")
        } catch {
            /* ignore */
        }
        return
    }
    if (!hasMediaSession()) return
    try {
        navigator.mediaSession.metadata = null
        navigator.mediaSession.playbackState = "none"
        lastDuration = 0
    } catch {
        /* ignore */
    }
}
