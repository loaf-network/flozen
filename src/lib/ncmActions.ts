import { loadConfig } from "./store"
import {
    ncmLikeSong,
    ncmLikelist,
    ncmVipInfo,
    ncmUserPlaylist,
    ncmCreatePlaylist,
    ncmPlaylistTracksOp,
    type PlaylistSimple,
    type SearchSong,
} from "./api"

// ── 会员等级 ──
// none：非会员（音质最高 极高 320K）
// vip：黑胶 VIP（音质最高 无损）
// svip：黑胶 SVIP（音质最高 超清母带）

export type VipLevel = "none" | "vip" | "svip"

let vipLevelCache: VipLevel = "none"
let vipFetchedAt = 0
let vipLoading: Promise<VipLevel> | null = null
const VIP_TTL = 5 * 60 * 1000 // 会员状态 5 分钟缓存

export async function getVipLevel(force = false): Promise<VipLevel> {
    if (!force && vipFetchedAt && Date.now() - vipFetchedAt < VIP_TTL) return vipLevelCache
    if (vipLoading) return vipLoading
    vipLoading = (async () => {
        const config = await loadConfig()
        if (!config.ncmCookie) {
            vipLevelCache = "none"
            return vipLevelCache
        }
        // 先以登录时缓存的 profile.vipType 兜底，再尝试 /vip/info 细分 VIP/SVIP
        let level: VipLevel = (config.ncmProfile?.vipType ?? 0) > 0 ? "vip" : "none"
        try {
            const res = await ncmVipInfo(config.ncmCookie)
            const d = res.data
            const redLevel = d?.redVipLevel ?? 0
            // 黑胶 SVIP 的可靠特征是 musicPackage（SVIP 音乐包）存在；
            // redVipLevel 为红钻等级，>=7 亦视为 SVIP（兜底）
            const hasSvipPackage = !!d?.musicPackage?.vipCode || !!d?.musicPackage?.id
            if (hasSvipPackage || redLevel >= 7) level = "svip"
            else if (redLevel > 0) level = "vip"
        } catch {
            // 失败不缓存时间戳，下次仍会重试；保持 profile.vipType 的兜底结果
            return level
        }
        vipLevelCache = level
        vipFetchedAt = Date.now()
        return level
    })()
    try {
        return await vipLoading
    } finally {
        vipLoading = null
    }
}

// ── 喜欢 ──

let likedIds: Set<number> | null = null
let likedLoading: Promise<void> | null = null

async function ensureLiked(): Promise<void> {
    if (likedIds) return
    if (likedLoading) return likedLoading
    likedLoading = (async () => {
        const config = await loadConfig()
        if (!config.ncmCookie || !config.ncmProfile) {
            likedIds = new Set()
            return
        }
        try {
            const res = await ncmLikelist(config.ncmProfile.userId, config.ncmCookie)
            likedIds = new Set(res.ids ?? [])
        } catch {
            likedIds = null // 失败不缓存，下次调用重新加载
        }
    })()
    return likedLoading
}

export async function isSongLiked(id: number): Promise<boolean> {
    await ensureLiked()
    return likedIds?.has(id) ?? false
}

export async function toggleLike(song: SearchSong): Promise<boolean> {
    const config = await loadConfig()
    if (!config.ncmCookie) throw new Error("not-logged-in")
    const current = await isSongLiked(song.id)
    const next = !current
    const res = await ncmLikeSong(song.id, next, config.ncmCookie)
    if (res.code !== 200) throw new Error("like-failed")
    likedIds ??= new Set()
    if (next) likedIds.add(song.id)
    else likedIds.delete(song.id)
    return next
}

// ── 歌单 ──

export async function getMyPlaylists(): Promise<PlaylistSimple[]> {
    const config = await loadConfig()
    if (!config.ncmCookie || !config.ncmProfile) throw new Error("not-logged-in")
    const res = await ncmUserPlaylist(config.ncmProfile.userId, config.ncmCookie)
    return res.playlist ?? []
}

export async function addSongToPlaylist(pid: number, songId: number): Promise<void> {
    const config = await loadConfig()
    if (!config.ncmCookie) throw new Error("not-logged-in")
    const res = await ncmPlaylistTracksOp("add", pid, [songId], config.ncmCookie)
    if (res.code !== 200) {
        // 透出服务端具体原因（如「歌曲已存在」等），避免笼统的「添加失败」
        const msg = res.message ?? res.msg
        throw new Error(msg && msg !== "系统错误" ? msg : "add-failed")
    }
}

export async function createPlaylistAndAdd(name: string, songId: number): Promise<void> {
    const config = await loadConfig()
    if (!config.ncmCookie) throw new Error("not-logged-in")
    const res = await ncmCreatePlaylist(name, undefined, config.ncmCookie)
    if (res.code !== 200 || !res.id) {
        const msg = (res as { message?: string }).message
        throw new Error(msg && msg !== "系统错误" ? msg : "create-failed")
    }
    await addSongToPlaylist(res.id, songId)
}
