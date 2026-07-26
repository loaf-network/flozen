import { reactive, ref, watch } from "vue"
import { ncmSongUrl, ncmLyric, type SearchSong } from "./api"
import { parseLrc, getCurrentLine, type LyricLine } from "./lyrics"
import { loadConfig } from "./store"
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
    quality: "standard" | "higher" | "exhigh" | "lossless" | "hires"
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
    repeatMode: "none",
    shuffle: false,
    lyrics: [],
    currentLyricIndex: -1,
    loading: false,
})

// ── 持久化：播放历史 + 队列快照 ──
export const playHistory = reactive<HistoryEntry[]>([])
export const historyLoaded = ref(false)

let resumeTime = 0
let pendingSeek = 0
let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastTimeSave = 0

// ── 下一首预加载 + 智能随机 ──
const playedShuffleIds = new Set<number>()
let plannedNextIndex = -1
let plannedNextId = -1
let preloaded: { songId: number; url: string; lyrics: LyricLine[] } | null = null
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
        const config = await loadConfig()
        const [urlRes, lyricRes] = await Promise.all([
            ncmSongUrl(song.id, player.quality, config.ncmCookie),
            ncmLyric(song.id),
        ])
        const url = urlRes.data?.[0]?.url
        if (url) {
            preloaded = { songId: song.id, url, lyrics: parseLrc(lyricRes.lrc?.lyric ?? "") }
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
    try {
        const cached = preloaded?.songId === song.id ? preloaded : null
        if (cached) {
            preloaded = null
            audio.src = cached.url
            audio.play().catch(() => {})
            syncMediaMetadata(song)
            setWindowTitle(song)
            recordHistory(song)
            player.lyrics = cached.lyrics
            player.currentLyricIndex = getCurrentLine(player.lyrics, 0)
            return
        }
        const config = await loadConfig()
        const urlRes = await ncmSongUrl(song.id, player.quality, config.ncmCookie)
        const url = urlRes.data?.[0]?.url
        if (!url) {
            console.warn("No URL for song:", song.name)
            return
        }
        audio.src = url
        audio.play().catch(() => {})
        syncMediaMetadata(song)
        setWindowTitle(song)
        recordHistory(song)

        const lyricRes = await ncmLyric(song.id)
        const lrc = lyricRes.lrc?.lyric ?? ""
        player.lyrics = parseLrc(lrc)
        player.currentLyricIndex = getCurrentLine(player.lyrics, 0)
    } catch (err) {
        console.error("Load failed:", err)
    } finally {
        player.loading = false
    }
}

export function play(song?: SearchSong) {
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
    preloaded = null
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
