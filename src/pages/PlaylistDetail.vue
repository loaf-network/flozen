<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Play, Shuffle, List, Music, RefreshCw } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { ncmPlaylistDetail, ncmPlaylistTracks, type SearchSong } from "@/lib/api"
import { loadConfig } from "@/lib/store"
import { player, setQueue, play } from "@/lib/player"
import SongGrid from "@/components/SongGrid.vue"

const route = useRoute()
const router = useRouter()
const songs = ref<SearchSong[]>([])
const playlist = ref<{
    name: string
    coverImgUrl: string
    trackCount: number
    playCount: number
} | null>(null)
const loading = ref(true)
const viewMode = ref<"gallery" | "list">("gallery")
const galleryKey = ref(0)

async function loadPlaylist(id: number) {
    loading.value = true
    const config = await loadConfig()
    try {
        const [detailRes, tracksRes] = await Promise.all([
            ncmPlaylistDetail(id, config.ncmCookie),
            ncmPlaylistTracks(id, config.ncmCookie),
        ])
        if (detailRes.code === 200) playlist.value = detailRes.playlist
        if (tracksRes.code === 200) songs.value = tracksRes.songs
    } catch {
        /* ignore */
    }
    loading.value = false
    galleryKey.value++
}

onMounted(() => {
    const id = Number(route.params.id)
    if (id) loadPlaylist(id)
    else loading.value = false
})

watch(
    () => route.params.id,
    (newId) => {
        if (newId) loadPlaylist(Number(newId))
    },
)

function playAll() {
    setQueue(songs.value)
    router.push("/player")
}
function shuffleAll() {
    setQueue(songs.value.sort(() => Math.random() - 0.5))
    router.push("/player")
}
function onPlay(song: SearchSong) {
    play(song)
    router.push("/player")
}
function formatDuration(ms: number) {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms / 1000) % 60)
    return `${m}:${String(s).padStart(2, "0")}`
}
</script>

<template>
    <div class="h-full">
        <div v-if="loading" class="flex items-center justify-center h-full">
            <div
                class="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"
            />
        </div>

        <!-- No playlist selected -->
        <div
            v-else-if="!playlist"
            class="flex flex-col items-center justify-center h-full text-muted-foreground gap-3"
        >
            <Music :size="40" :stroke-width="1" />
            <p class="text-sm">请从左侧选择一个歌单</p>
        </div>

        <!-- Gallery mode -->
        <div v-else class="flex flex-col h-full">
            <!-- Hero -->
            <div class="hero">
                <img
                    :src="`${playlist.coverImgUrl}?param=320y320`"
                    referrerpolicy="no-referrer"
                    class="hero-cover"
                />
                <div class="hero-info">
                    <p class="text-xs text-muted-foreground mb-1">歌单</p>
                    <h1 class="text-2xl font-bold">{{ playlist.name }}</h1>
                    <p class="text-sm text-muted-foreground mt-2">
                        {{ playlist.trackCount }} 首 ·
                        {{ playlist.playCount.toLocaleString() }} 次播放
                    </p>
                    <div class="hero-actions">
                        <Button size="sm" class="gap-1.5" @click="playAll">
                            <Play :size="14" fill="currentColor" /> 播放全部
                        </Button>
                        <Button variant="outline" size="sm" class="gap-1.5" @click="shuffleAll">
                            <Shuffle :size="14" /> 随机播放
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            :class="viewMode === 'list' ? 'bg-accent' : ''"
                            @click="viewMode = viewMode === 'gallery' ? 'list' : 'gallery'"
                        >
                            <List :size="14" /> {{ viewMode === "gallery" ? "列表" : "画廊" }}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            :disabled="loading"
                            @click="loadPlaylist(Number(route.params.id))"
                        >
                            <RefreshCw :size="16" :class="loading && 'animate-spin'" />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Gallery -->
            <div v-if="viewMode === 'gallery'" class="flex-1 min-h-0 px-4 pb-4">
                <SongGrid :key="galleryKey" :songs="songs" :has-more="false" @play="onPlay" />
            </div>

            <!-- List -->
            <div v-else class="flex-1 overflow-auto px-4 pb-4">
                <div
                    v-for="(song, idx) in songs"
                    :key="song.id"
                    class="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer rounded-xl"
                    @click="onPlay(song)"
                >
                    <span class="text-xs text-muted-foreground w-5 text-right tabular-nums">{{
                        idx + 1
                    }}</span>
                    <img
                        :src="`${song.al.picUrl}?param=80y80`"
                        referrerpolicy="no-referrer"
                        class="w-10 h-10 rounded-lg object-cover"
                    />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ song.name }}</p>
                        <p class="text-xs text-muted-foreground truncate">
                            {{ song.ar.map((a) => a.name).join(" / ") }}
                        </p>
                    </div>
                    <span class="text-xs text-muted-foreground tabular-nums">{{
                        formatDuration(song.dt)
                    }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hero {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    padding: 24px 28px 16px;
    flex-shrink: 0;
}

.hero-cover {
    width: 160px;
    height: 160px;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    flex-shrink: 0;
}

.hero-info {
    flex: 1;
    min-width: 0;
    padding-bottom: 4px;
}

.hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
}

@media (max-width: 640px) {
    .hero {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .hero-cover {
        width: 120px;
        height: 120px;
    }
    .hero-actions {
        justify-content: center;
    }
}
</style>
