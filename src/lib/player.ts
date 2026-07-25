import { reactive } from "vue"
import { ncmSongUrl, ncmLyric, type SearchSong } from "./api"
import { parseLrc, getCurrentLine, type LyricLine } from "./lyrics"
import { loadConfig } from "./store"
import { initMedia, updateMedia, clearMedia } from "./smtc"

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
    animFrame = requestAnimationFrame(updateTime)
}

audio.addEventListener("play", () => {
    player.playing = true
    animFrame = requestAnimationFrame(updateTime)
    updateMedia({ isPlaying: true })
})
audio.addEventListener("pause", () => {
    player.playing = false
    cancelAnimationFrame(animFrame)
    updateMedia({ isPlaying: false })
})
audio.addEventListener("ended", () => {
    player.playing = false
    cancelAnimationFrame(animFrame)
    next()
})
audio.addEventListener("error", () => {
    player.loading = false
})

async function loadAndPlay(song: SearchSong) {
    player.loading = true
    try {
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

        const lyricRes = await ncmLyric(song.id)
        const lrc = lyricRes.lrc?.lyric ?? ""
        console.log("Lyric raw:", lrc.slice(0, 200))
        player.lyrics = parseLrc(lrc)
        console.log("Lyric parsed lines:", player.lyrics.length)
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
        audio.play().catch(() => {})
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
    if (player.shuffle) {
        const nextIdx = Math.floor(Math.random() * player.queue.length)
        player.queueIndex = nextIdx
    } else {
        player.queueIndex = (player.queueIndex + 1) % player.queue.length
        if (player.queueIndex === 0 && player.repeatMode === "none") {
            pause()
            return
        }
    }
    const song = player.queue[player.queueIndex]
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
    if (player.currentSong) loadAndPlay(player.currentSong)
}

export function toggleRepeat() {
    const modes: PlayerState["repeatMode"][] = ["none", "all", "one"]
    const idx = modes.indexOf(player.repeatMode)
    player.repeatMode = modes[(idx + 1) % modes.length]
}

export function toggleShuffle() {
    player.shuffle = !player.shuffle
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
}

export function setQueue(songs: SearchSong[], startIndex = 0) {
    player.queue = songs
    player.queueIndex = startIndex
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
