import { reactive, ref, watch } from "vue"
import { toast } from "vue-sonner"
import router from "@/router"
import {
    ncmSongUrl,
    ncmLyric,
    ncmScrobble,
    ncmSubmitPlayState,
    type SearchSong,
    type SongUrlRes,
} from "./api"
import { parseLrc, getCurrentLine, type LyricLine } from "./lyrics"
import { loadConfig } from "./store"
import { getVipLevel, type VipLevel } from "./ncmActions"
import { initMedia, updateMedia, clearMedia } from "./smtc"
import {
    loadPlayerSnapshot,
    savePlayerSnapshot,
    loadHistory,
    saveHistory,
    type PlayerSnapshot,
    type HistoryEntry,
} from "./playerPersist"

const audio = new Audio()
audio.volume = 0.7

initMedia()

function syncMediaMetadata(song: SearchSong) {
    updateMedia({
        title: song.name,
        artist: song.ar?.map((a) => a.name).join(" / "),
        album: song.al?.name,
        artworkUrl: song.al?.picUrl ? `${song.al.picUrl}?param=300y300` : undefined,
        duration: song.dt / 1000,
        position: 0,
        isPlaying: true,
        shuffle: player.shuffle,
        repeatMode: player.repeatMode,
    })
}

async function setWindowTitle(song: SearchSong | null) {
    try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window")
        const title = song
            ? `${song.name} - ${song.ar?.map((a) => a.name).join(" / ")} · Flozen`
            : "Flozen"
        await getCurrentWindow().setTitle(title)
    } catch {
        /* 非 Tauri 环境 */
    }
}

export interface PlayerState {
    audio: HTMLAudioElement
    currentSong: SearchSong | null
    queue: SearchSong[]
    queueIndex: number
    playing: boolean
    currentTime: number
    duration: number
    volume: number
    quality: "standard" | "higher" | "exhigh" | "lossless" | "hires" | "jymaster"
    actualQuality: PlayerState["quality"]
    repeatMode: "none" | "all" | "one"
    shuffle: boolean
    lyrics: LyricLine[]
    currentLyricIndex: number
    loading: boolean
}

export const player = reactive<PlayerState>({
    audio,
    currentSong: null,
    queue: [],
    queueIndex: -1,
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    quality: "exhigh",
    actualQuality: "exhigh",
    repeatMode: "none",
    shuffle: false,
    lyrics: [],
    currentLyricIndex: -1,
    loading: false,
})

// ── 音质等级 ──

export interface QualityOption {
    value: PlayerState["quality"]
    label: string
    desc: string
    vip?: VipLevel
}

// 音质由码率/封装区分，vip 字段标记该档位所需的最低会员等级（文案与网易云官方一致）
export const QUALITY_OPTIONS: QualityOption[] = [
    { value: "standard", label: "标准", desc: "128K" },
    { value: "higher", label: "较高", desc: "192K" },
    { value: "exhigh", label: "极高", desc: "320K" },
    { value: "lossless", label: "无损", desc: "FLAC", vip: "vip" },
    { value: "hires", label: "高清臻音", desc: "Hi-Res", vip: "svip" },
    { value: "jymaster", label: "超清母带", desc: "母带", vip: "svip" },
]

export function qualityIndex(q: PlayerState["quality"]): number {
    return QUALITY_OPTIONS.findIndex((o) => o.value === q)
}

// 各会员等级可用的最高音质
const VIP_QUALITY_LIMIT: Record<VipLevel, PlayerState["quality"]> = {
    none: "exhigh",
    vip: "lossless",
    svip: "jymaster",
}

// 已探测过可用音质的歌曲缓存（songId → 可用最高档位），避免反复降级请求
const qualityFallbackCache = new Map<number, PlayerState["quality"]>()

// 用户设置的音质不能突破会员限制：非会员最高 极高，黑胶 VIP 最高 无损，黑胶 SVIP 最高 超清母带
export async function resolveEffectiveQuality(): Promise<PlayerState["quality"]> {
    const pref = player.quality
    const level = await getVipLevel()
    const limit = VIP_QUALITY_LIMIT[level]
    return qualityIndex(pref) <= qualityIndex(limit) ? pref : limit
}

// 请求歌曲播放地址：按会员限制选择音质，服务器拒绝（无 url）时逐级降级并缓存
async function fetchSongUrl(songId: number): Promise<{
    url: string | null
    data?: SongUrlRes["data"]
    quality: PlayerState["quality"]
}> {
    const config = await loadConfig()
    let q = qualityFallbackCache.get(songId) ?? (await resolveEffectiveQuality())
    for (;;) {
        const res = await ncmSongUrl(songId, q, config.ncmCookie)
        const d = res.data?.[0]
        if (d?.url) {
            qualityFallbackCache.set(songId, q)
            return { url: d.url, data: res.data, quality: q }
        }
        // VIP/付费/无版权歌曲（fee 非 0）或返回为空时不值得继续降级
        if (d?.fee || !res.data?.length) {
            qualityFallbackCache.set(songId, q)
            return { url: null, data: res.data, quality: q }
        }
        const idx = qualityIndex(q)
        if (idx <= 0) {
            qualityFallbackCache.set(songId, q)
            return { url: null, data: res.data, quality: q }
        }
        q = QUALITY_OPTIONS[idx - 1].value
    }
}

// ── 持久化：播放历史 + 队列快照 ──
export const playHistory = reactive<HistoryEntry[]>([])
export const historyLoaded = ref(false)

let resumeTime = 0
let pendingSeek = 0
let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastTimeSave = 0

// ── 听歌打卡 & 提交播放状态 ──
let scrobbleTimer: ReturnType<typeof setTimeout> | null = null
let lastSubmitTime = 0
let currentSessionId = ""

function generateSessionId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

async function scrobbleSong(song: SearchSong, time: number) {
    try {
        const config = await loadConfig()
        if (!config.ncmCookie) return
        await ncmScrobble(song.id, song.al?.id ?? 0, time, config.ncmCookie)
    } catch {
        // 打卡失败不影响播放
    }
}

async function submitPlayState(song: SearchSong, progress: number) {
    try {
        const config = await loadConfig()
        if (!config.ncmCookie) return
        const now = Date.now()
        if (now - lastSubmitTime < 30000) return // 30秒内不重复提交
        lastSubmitTime = now
        if (!currentSessionId) {
            currentSessionId = generateSessionId()
        }
        await ncmSubmitPlayState(song.id, progress, "list_loop", currentSessionId, config.ncmCookie)
    } catch {
        // 提交失败不影响播放
    }
}

// ── 下一首预加载 + 智能随机 ──
const playedShuffleIds = new Set<number>()
let plannedNextIndex = -1
let plannedNextId = -1
let preloaded: {
    songId: number
    url: string
    lyrics: LyricLine[]
    prefQuality: PlayerState["quality"] // 预加载发起时用户设置的音质
    quality: PlayerState["quality"] // 实际生效（可能被降级）的音质
} | null = null
let preloadingId = -1
let preloadFailedId = -1
const preloadAudio = new Audio()
preloadAudio.preload = "auto"
preloadAudio.muted = true

function invalidatePlan() {
    plannedNextIndex = -1
    plannedNextId = -1
}

// 智能随机：优先从未播放过的歌中随机，全部播过则重置一轮
function pickNextIndex(): number {
    const n = player.queue.length
    if (n === 0) return -1
    if (player.shuffle) {
        if (n === 1) return 0
        let candidates = player.queue
            .map((_, i) => i)
            .filter((i) => i !== player.queueIndex && !playedShuffleIds.has(player.queue[i].id))
        if (candidates.length === 0) {
            playedShuffleIds.clear()
            if (player.currentSong) playedShuffleIds.add(player.currentSong.id)
            candidates = player.queue.map((_, i) => i).filter((i) => i !== player.queueIndex)
        }
        return candidates[Math.floor(Math.random() * candidates.length)]
    }
    const nextIdx = (player.queueIndex + 1) % n
    if (nextIdx === 0 && player.repeatMode === "none") return -1
    return nextIdx
}

async function preloadNext() {
    if (player.queue.length === 0 || player.repeatMode === "one") return
    // 计划失效（队列变动/尚未计划）时重新预选
    if (plannedNextIndex === -1 || player.queue[plannedNextIndex]?.id !== plannedNextId) {
        plannedNextIndex = pickNextIndex()
        plannedNextId = player.queue[plannedNextIndex]?.id ?? -1
    }
    if (plannedNextIndex === -1) return
    const song = player.queue[plannedNextIndex]
    if (!song) return
    if (preloaded?.songId === song.id || preloadingId === song.id || preloadFailedId === song.id)
        return
    preloadingId = song.id
    try {
        const [urlRes, lyricRes] = await Promise.all([fetchSongUrl(song.id), ncmLyric(song.id)])
        const url = urlRes.url
        if (url) {
            preloaded = {
                songId: song.id,
                url,
                lyrics: parseLrc(lyricRes.lrc?.lyric ?? ""),
                prefQuality: player.quality,
                quality: urlRes.quality,
            }
            // 预热音频缓冲，切歌时命中浏览器缓存
            preloadAudio.src = url
        } else {
            preloadFailedId = song.id
        }
    } catch {
        preloadFailedId = song.id
    } finally {
        preloadingId = -1
    }
}

function snapshot(): PlayerSnapshot {
    return {
        queue: [...player.queue],
        queueIndex: player.queueIndex,
        currentTime: player.currentTime,
        volume: player.volume,
        quality: player.quality,
        repeatMode: player.repeatMode,
        shuffle: player.shuffle,
    }
}

function schedulePersist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => savePlayerSnapshot(snapshot()), 800)
}

function recordHistory(song: SearchSong) {
    const idx = playHistory.findIndex((e) => e.song.id === song.id)
    if (idx !== -1) playHistory.splice(idx, 1)
    playHistory.unshift({ song, playedAt: Date.now() })
    if (playHistory.length > 100) playHistory.length = 100
    saveHistory([...playHistory])
}

export function clearHistory() {
    playHistory.length = 0
    saveHistory([])
}

async function restorePlayerState() {
    const [snap, hist] = await Promise.all([loadPlayerSnapshot(), loadHistory()])
    playHistory.push(...hist)
    historyLoaded.value = true
    if (snap && snap.queue.length > 0) {
        player.queue = snap.queue
        player.queueIndex = Math.min(Math.max(snap.queueIndex, 0), snap.queue.length - 1)
        player.currentSong = player.queue[player.queueIndex] ?? null
        player.volume = snap.volume
        audio.volume = snap.volume
        player.quality = snap.quality
        player.actualQuality = snap.quality
        player.repeatMode = snap.repeatMode
        player.shuffle = snap.shuffle
        player.currentTime = snap.currentTime
        resumeTime = snap.currentTime
        setWindowTitle(player.currentSong)
    }
    watch(
        () => [
            player.queue,
            player.queueIndex,
            player.volume,
            player.quality,
            player.repeatMode,
            player.shuffle,
        ],
        schedulePersist,
        { deep: true },
    )
}
restorePlayerState()

let animFrame = 0
let lastMediaSync = 0

function updateTime() {
    player.currentTime = audio.currentTime
    player.duration = audio.duration || 0
    if (player.lyrics.length > 0) {
        player.currentLyricIndex = getCurrentLine(player.lyrics, player.currentTime)
    }
    const now = performance.now()
    if (now - lastMediaSync > 2000) {
        lastMediaSync = now
        updateMedia({ position: player.currentTime })
    }
    if (now - lastTimeSave > 10000) {
        lastTimeSave = now
        savePlayerSnapshot(snapshot())
    }
    // 定期提交播放状态（每30秒）
    if (player.currentSong && player.playing && now - lastSubmitTime > 30000) {
        submitPlayState(player.currentSong, Math.floor(player.currentTime))
    }
    // 快结束时提前准备下一首（音频 + 歌词）
    if (player.duration > 0 && player.duration - player.currentTime < 20) {
        preloadNext()
    }
    animFrame = requestAnimationFrame(updateTime)
}

audio.addEventListener("loadedmetadata", () => {
    if (pendingSeek > 0) {
        audio.currentTime = pendingSeek
        player.currentTime = pendingSeek
        pendingSeek = 0
    }
})

audio.addEventListener("play", () => {
    player.playing = true
    animFrame = requestAnimationFrame(updateTime)
    updateMedia({ isPlaying: true })
})
audio.addEventListener("pause", () => {
    player.playing = false
    cancelAnimationFrame(animFrame)
    updateMedia({ isPlaying: false })
    savePlayerSnapshot(snapshot())
})
audio.addEventListener("ended", () => {
    player.playing = false
    cancelAnimationFrame(animFrame)
    next()
})
audio.addEventListener("error", () => {
    player.loading = false
})

async function loadAndPlay(song: SearchSong, seekTo = 0) {
    player.loading = true
    pendingSeek = seekTo
    playedShuffleIds.add(song.id)
    invalidatePlan()
    preloadFailedId = -1
    currentSessionId = generateSessionId()
    lastSubmitTime = 0

    // 清除之前的打卡定时器
    if (scrobbleTimer) {
        clearTimeout(scrobbleTimer)
        scrobbleTimer = null
    }

    try {
        // 预加载结果仅在音质设置未变时可用（防 setQuality 后旧音质缓存被误用）
        const cached =
            preloaded?.songId === song.id && preloaded.prefQuality === player.quality
                ? preloaded
                : null
        if (cached) {
            preloaded = null
            audio.src = cached.url
            player.actualQuality = cached.quality
            audio.play().catch(() => {})
            syncMediaMetadata(song)
            setWindowTitle(song)
            recordHistory(song)
            player.lyrics = cached.lyrics
            player.currentLyricIndex = getCurrentLine(player.lyrics, 0)
            // 开始打卡计时（播放30秒后打卡）
            startScrobbleTimer(song)
            return
        }
        const { url, data: urlData, quality } = await fetchSongUrl(song.id)
        if (!url) {
            // 检查是否为VIP歌曲或版权受限
            if (urlData?.[0]?.fee === 1) {
                toast.error("该歌曲为VIP专享，请开通VIP后播放。")
            } else if (urlData?.[0]?.fee === 4) {
                toast.error("该歌曲需要购买专辑后播放。")
            } else {
                toast.error("该歌曲暂无版权，请尝试其他音源。")
            }
            return
        }
        audio.src = url
        player.actualQuality = quality
        audio.play().catch(() => {})
        syncMediaMetadata(song)
        setWindowTitle(song)
        recordHistory(song)

        const lyricRes = await ncmLyric(song.id)
        const lrc = lyricRes.lrc?.lyric ?? ""
        player.lyrics = parseLrc(lrc)
        player.currentLyricIndex = getCurrentLine(player.lyrics, 0)
        // 开始打卡计时（播放30秒后打卡）
        startScrobbleTimer(song)
    } catch {
        /* 静默处理 */
    } finally {
        player.loading = false
    }
}

function startScrobbleTimer(song: SearchSong) {
    // 播放30秒后进行打卡
    scrobbleTimer = setTimeout(() => {
        if (player.currentSong?.id === song.id && player.playing) {
            scrobbleSong(song, Math.floor(song.dt / 1000))
        }
    }, 30000)
}

let loginRedirectTimer: ReturnType<typeof setTimeout> | null = null

async function checkLoginBeforePlay(): Promise<boolean> {
    try {
        const config = await loadConfig()
        if (!config.ncmCookie) {
            toast.error("请先登录网易云账号。")
            // 延迟跳转登录页，让用户看到提示
            if (loginRedirectTimer) clearTimeout(loginRedirectTimer)
            loginRedirectTimer = setTimeout(() => {
                router.push("/app/settings/ncm")
            }, 1500)
            return false
        }
        return true
    } catch {
        return false
    }
}

export async function play(song?: SearchSong) {
    // 未登录时禁止所有播放操作
    if (!(await checkLoginBeforePlay())) return

    if (song) {
        player.currentSong = song
        const inQueue = player.queue.findIndex((s) => s.id === song.id)
        if (inQueue === -1) {
            player.queue.push(song)
            player.queueIndex = player.queue.length - 1
        } else {
            player.queueIndex = inQueue
        }
        loadAndPlay(song)
    } else if (player.currentSong) {
        if (!audio.src) {
            // 重启恢复后的首次播放：从上次进度继续
            loadAndPlay(player.currentSong, resumeTime)
            resumeTime = 0
        } else {
            audio.play().catch(() => {})
        }
    }
}

export function pause() {
    audio.pause()
}

export function toggle() {
    if (player.playing) pause()
    else play()
}

export function next() {
    if (player.queue.length === 0) return
    if (player.repeatMode === "one" && player.currentSong) {
        loadAndPlay(player.currentSong)
        return
    }
    const idx =
        plannedNextIndex !== -1 && player.queue[plannedNextIndex]?.id === plannedNextId
            ? plannedNextIndex
            : pickNextIndex()
    if (idx === -1) {
        pause()
        return
    }
    player.queueIndex = idx
    const song = player.queue[idx]
    if (song) {
        player.currentSong = song
        loadAndPlay(song)
    }
}

export function prev() {
    if (player.queue.length === 0) return
    if (player.shuffle) {
        player.queueIndex = Math.floor(Math.random() * player.queue.length)
    } else {
        player.queueIndex = (player.queueIndex - 1 + player.queue.length) % player.queue.length
    }
    const song = player.queue[player.queueIndex]
    if (song) {
        player.currentSong = song
        loadAndPlay(song)
    }
}

export function seek(time: number) {
    audio.currentTime = time
    player.currentTime = time
}

export function setVolume(vol: number) {
    player.volume = Math.max(0, Math.min(1, vol))
    audio.volume = player.volume
}

export function setQuality(q: PlayerState["quality"]) {
    player.quality = q
    player.actualQuality = q
    preloaded = null
    qualityFallbackCache.clear() // 音质变更后重新探测可用档位
    if (player.currentSong) loadAndPlay(player.currentSong)
}

export function toggleRepeat() {
    const modes: PlayerState["repeatMode"][] = ["none", "all", "one"]
    const idx = modes.indexOf(player.repeatMode)
    player.repeatMode = modes[(idx + 1) % modes.length]
    invalidatePlan()
}

export function toggleShuffle() {
    player.shuffle = !player.shuffle
    invalidatePlan()
}

export function cyclePlayMode() {
    if (player.shuffle) {
        // shuffle → sequential
        player.shuffle = false
        player.repeatMode = "none"
    } else if (player.repeatMode === "none") {
        // sequential → list repeat
        player.repeatMode = "all"
    } else if (player.repeatMode === "all") {
        // list repeat → single repeat
        player.repeatMode = "one"
    } else {
        // single repeat → shuffle
        player.shuffle = true
        player.repeatMode = "none"
    }
    invalidatePlan()
}

export function addToQueue(song: SearchSong) {
    player.queue.push(song)
}

export function playFromQueue(index: number) {
    if (index < 0 || index >= player.queue.length) return
    player.queueIndex = index
    player.currentSong = player.queue[index]
    loadAndPlay(player.currentSong)
}

export function removeFromQueue(index: number) {
    if (index < 0 || index >= player.queue.length) return
    player.queue.splice(index, 1)
    if (player.queueIndex > index) player.queueIndex--
    else if (player.queueIndex === index) {
        if (player.queue.length === 0) {
            player.queueIndex = -1
            player.currentSong = null
            audio.pause()
            clearMedia()
            setWindowTitle(null)
            return
        }
        if (player.queueIndex >= player.queue.length) player.queueIndex = 0
        player.currentSong = player.queue[player.queueIndex]
        loadAndPlay(player.currentSong)
    }
}

export function moveQueueItem(from: number, to: number) {
    if (from < 0 || from >= player.queue.length) return
    if (to < 0 || to >= player.queue.length) return
    if (from === to) return
    const [item] = player.queue.splice(from, 1)
    player.queue.splice(to, 0, item)
    if (player.queueIndex === from) {
        player.queueIndex = to
    } else if (from < player.queueIndex && to >= player.queueIndex) {
        player.queueIndex--
    } else if (from > player.queueIndex && to <= player.queueIndex) {
        player.queueIndex++
    }
    invalidatePlan()
}

export function clearQueue() {
    player.queue = []
    player.queueIndex = -1
    player.currentSong = null
    player.lyrics = []
    player.currentLyricIndex = -1
    audio.pause()
    audio.src = ""
    clearMedia()
    setWindowTitle(null)
    playedShuffleIds.clear()
    invalidatePlan()
    preloaded = null
}

export function setQueue(songs: SearchSong[], startIndex = 0) {
    player.queue = songs
    player.queueIndex = startIndex
    playedShuffleIds.clear()
    invalidatePlan()
    if (songs.length > 0) {
        player.currentSong = songs[startIndex]
        loadAndPlay(songs[startIndex])
    }
}

export function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
}
