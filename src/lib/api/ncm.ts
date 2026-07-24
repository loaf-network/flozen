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
    artists: { id: number; name: string }[]
    album: { id: number; name: string; picUrl: string }
    duration: number
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

export function ncmSearch(keywords: string, limit = 30, offset = 0) {
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

export function ncmSongUrl(id: number, level = "exhigh") {
    return post<SongUrlRes>("/song/url/v1", { id: String(id), level })
}
