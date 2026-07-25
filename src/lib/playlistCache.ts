import type { PlaylistSimple, SearchSong } from "./api"

const TTL = 10 * 60 * 1000

interface Entry<T> {
    data: T
    ts: number
}

const detailCache = new Map<number, Entry<{ detail: PlaylistSimple; songs: SearchSong[] }>>()
const listCache = new Map<number, Entry<PlaylistSimple[]>>()

export function getCachedDetail(id: number) {
    const e = detailCache.get(id)
    if (!e) return null
    if (Date.now() - e.ts > TTL) return null
    return e.data
}

export function setCachedDetail(id: number, detail: PlaylistSimple, songs: SearchSong[]) {
    detailCache.set(id, { data: { detail, songs }, ts: Date.now() })
}

export function getCachedList(userId: number): PlaylistSimple[] | null {
    const e = listCache.get(userId)
    if (!e) return null
    if (Date.now() - e.ts > TTL) return null
    return e.data
}

export function setCachedList(userId: number, list: PlaylistSimple[]) {
    listCache.set(userId, { data: list, ts: Date.now() })
}
