import { load } from "@tauri-apps/plugin-store"
import type { SearchSong } from "./api"

export interface PlayerSnapshot {
    queue: SearchSong[]
    queueIndex: number
    currentTime: number
    volume: number
    quality: "standard" | "higher" | "exhigh" | "lossless" | "hires"
    repeatMode: "none" | "all" | "one"
    shuffle: boolean
}

export interface HistoryEntry {
    song: SearchSong
    playedAt: number
}

let store: Awaited<ReturnType<typeof load>> | null = null

async function getStore() {
    if (!store) store = await load("flozen-player.json")
    return store
}

export async function loadPlayerSnapshot(): Promise<PlayerSnapshot | null> {
    try {
        const s = await getStore()
        return ((await s.get("snapshot")) as PlayerSnapshot | undefined) ?? null
    } catch {
        return null
    }
}

export async function savePlayerSnapshot(snap: PlayerSnapshot) {
    try {
        const s = await getStore()
        await s.set("snapshot", snap)
        await s.save()
    } catch {
        /* 非 Tauri 环境 */
    }
}

export async function loadHistory(): Promise<HistoryEntry[]> {
    try {
        const s = await getStore()
        return ((await s.get("history")) as HistoryEntry[] | undefined) ?? []
    } catch {
        return []
    }
}

export async function saveHistory(entries: HistoryEntry[]) {
    try {
        const s = await getStore()
        await s.set("history", entries)
        await s.save()
    } catch {
        /* 非 Tauri 环境 */
    }
}
