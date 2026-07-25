import { post } from "./request"

// ─── Types ───

export interface QrKeyRes {
    code: number
    data: { code: number; unikey: string }
}

export interface QrCreateRes {
    code: number
    data: { qrurl: string; qrimg?: string }
}

export interface QrCheckRes {
    code: number
    message: string
    cookie?: string
}

export interface UserProfile {
    userId: number
    nickname: string
    avatarUrl: string
    vipType: number
    eventCount: number
    followeds: number
    follows: number
}

export interface UserAccountRes {
    code: number
    profile: UserProfile | null
}

export interface SearchRes {
    code: number
    result: {
        songs: SearchSong[]
        songCount: number
    }
}

export interface SearchSong {
    id: number
    name: string
    ar: { id: number; name: string }[]
    al: { id: number; name: string; picUrl: string }
    dt: number
}

export interface SearchSuggestRes {
    code: number
    result: {
        songs: SearchSong[]
    }
}

export interface SearchHotRes {
    code: number
    result: {
        hots: { first: string; second: number }[]
    }
}

export interface SongUrlRes {
    code: number
    data: { url: string | null; br: number }[]
}

export interface LyricRes {
    code: number
    lrc: { lyric: string }
    tlyric?: { lyric: string }
}

export interface SongDetailRes {
    code: number
    songs: SearchSong[]
}

export interface PlaylistSimple {
    id: number
    name: string
    coverImgUrl: string
    trackCount: number
    playCount: number
    creator?: { nickname: string; userId: number }
}

export interface PlaylistDetailRes {
    code: number
    playlist: PlaylistSimple & { tracks: SearchSong[] }
}

export interface UserPlaylistRes {
    code: number
    playlist: PlaylistSimple[]
}

export interface PlaylistCreateRes {
    code: number
    id: number
}

export interface LikeRes {
    code: number
    message: string
}

// ─── Auth ───

export function getQrKey() {
    return post<QrKeyRes>("/login/qr/key")
}

export function createQr(key: string) {
    return post<QrCreateRes>("/login/qr/create", { key, qrimg: "true" })
}

export function checkQr(key: string) {
    return post<QrCheckRes>("/login/qr/check", { key })
}

export function ncmLogout() {
    return post<void>("/logout")
}

export function getNcmAccount(cookie: string) {
    return post<UserAccountRes>("/user/account", { cookie })
}

// ─── Search ───

export function ncmSearch(keywords: string, limit = 60, offset = 0) {
    return post<SearchRes>("/cloudsearch", {
        keywords,
        limit: String(limit),
        offset: String(offset),
    })
}

export function ncmSearchSuggest(keywords: string) {
    return post<SearchSuggestRes>("/search/suggest", { keywords })
}

export function ncmSearchHot() {
    return post<SearchHotRes>("/search/hot/detail")
}

export function ncmSongUrl(id: number, level = "exhigh", cookie?: string) {
    const params: Record<string, string> = { id: String(id), level }
    if (cookie) params.cookie = cookie
    return post<SongUrlRes>("/song/url/v1", params)
}

// ─── Song & Lyrics ───

export function ncmLyric(id: number) {
    return post<LyricRes>("/lyric", { id: String(id) })
}

export function ncmSongDetail(ids: number[]) {
    return post<SongDetailRes>("/song/detail", { ids: ids.join(",") })
}

// ─── Like ───

export function ncmLikeSong(id: number, like: boolean, cookie?: string) {
    const params: Record<string, string> = { id: String(id), like: String(like) }
    if (cookie) params.cookie = cookie
    return post<LikeRes>("/like", params)
}

// ─── Playlist ───

export function ncmUserPlaylist(uid: number, cookie?: string) {
    const params: Record<string, string> = { uid: String(uid) }
    if (cookie) params.cookie = cookie
    return post<UserPlaylistRes>("/user/playlist", params)
}

export function ncmPlaylistDetail(id: number, cookie?: string) {
    const params: Record<string, string> = { id: String(id) }
    if (cookie) params.cookie = cookie
    return post<PlaylistDetailRes>("/playlist/detail", params)
}

export function ncmPlaylistTracks(id: number, cookie?: string, limit?: number, offset?: number) {
    const params: Record<string, string> = {
        id: String(id),
        limit: String(limit ?? 1000),
        offset: String(offset ?? 0),
    }
    if (cookie) params.cookie = cookie
    return post<{ code: number; songs: SearchSong[] }>("/playlist/track/all", params)
}

export function ncmCreatePlaylist(name: string, privacy?: string, cookie?: string) {
    const params: Record<string, string> = { name }
    if (privacy) params.privacy = privacy
    if (cookie) params.cookie = cookie
    return post<PlaylistCreateRes>("/playlist/create", params)
}

export function ncmDeletePlaylist(id: number, cookie?: string) {
    const params: Record<string, string> = { id: String(id) }
    if (cookie) params.cookie = cookie
    return post<PlaylistCreateRes>("/playlist/delete", params)
}

export function ncmPlaylistTracksOp(
    op: "add" | "del",
    pid: number,
    tracks: number[],
    cookie?: string,
) {
    const params: Record<string, string> = {
        op,
        pid: String(pid),
        tracks: tracks.join(","),
    }
    if (cookie) params.cookie = cookie
    return post<{ code: number }>("/playlist/tracks", params)
}
