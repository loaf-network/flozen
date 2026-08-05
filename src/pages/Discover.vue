<script setup lang="ts">
import { ref, onMounted } from "vue"
import { TrendingUp, Flame, Zap, Play, RefreshCw } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ncmPlaylistDetail, type SearchSong } from "@/lib/api"
import { play } from "@/lib/player"
import { loadConfig } from "@/lib/store"
import { toast } from "vue-sonner"
import { getCachedDetail, setCachedDetail } from "@/lib/playlistCache"

const isLoggedIn = ref(false)
const loading = ref(true)
const hotPlaylist = ref<SearchSong[]>([])
const surgePlaylist = ref<SearchSong[]>([])
const newSongPlaylist = ref<SearchSong[]>([])

const HOT_PLAYLIST_ID = 3778678
const SURGE_PLAYLIST_ID = 19723756
const NEW_SONG_PLAYLIST_ID = 3779629

async function loadData(force = false) {
    loading.value = true
    try {
        const config = await loadConfig()
        isLoggedIn.value = !!config.ncmCookie
        const cookie = config.ncmCookie || undefined
        const ids = [HOT_PLAYLIST_ID, SURGE_PLAYLIST_ID, NEW_SONG_PLAYLIST_ID]

        if (!force) {
            const cached = ids.map((id) => getCachedDetail(id))
            if (cached.every((c) => c !== null)) {
                hotPlaylist.value = cached[0]!.songs.slice(0, 20)
                surgePlaylist.value = cached[1]!.songs.slice(0, 20)
                newSongPlaylist.value = cached[2]!.songs.slice(0, 20)
                loading.value = false
                return
            }
        }

        const [hotRes, surgeRes, newSongRes] = await Promise.all([
            ncmPlaylistDetail(HOT_PLAYLIST_ID, cookie),
            ncmPlaylistDetail(SURGE_PLAYLIST_ID, cookie),
            ncmPlaylistDetail(NEW_SONG_PLAYLIST_ID, cookie),
        ])

        hotPlaylist.value = hotRes.playlist?.tracks?.slice(0, 20) ?? []
        surgePlaylist.value = surgeRes.playlist?.tracks?.slice(0, 20) ?? []
        newSongPlaylist.value = newSongRes.playlist?.tracks?.slice(0, 20) ?? []

        if (hotRes.playlist) setCachedDetail(HOT_PLAYLIST_ID, hotRes.playlist, hotPlaylist.value)
        if (surgeRes.playlist)
            setCachedDetail(SURGE_PLAYLIST_ID, surgeRes.playlist, surgePlaylist.value)
        if (newSongRes.playlist)
            setCachedDetail(NEW_SONG_PLAYLIST_ID, newSongRes.playlist, newSongPlaylist.value)
    } catch {
        toast.error("数据加载失败，请稍后重试。")
    } finally {
        loading.value = false
    }
}

function onRefresh() {
    loadData(true)
}

function onPlay(song: SearchSong) {
    if (!isLoggedIn.value) {
        toast.error("请先登录网易云账号。")
        return
    }
    play(song)
}

onMounted(() => loadData())
</script>

<template>
    <div class="h-full overflow-auto no-scrollbar p-6">
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold tracking-normal">发现</h1>
                <p class="text-muted-foreground text-sm mt-1">探索最新热歌与榜单</p>
            </div>
            <Button variant="outline" size="icon" :disabled="loading" @click="onRefresh">
                <RefreshCw :size="18" :class="loading ? 'animate-spin' : ''" />
            </Button>
        </div>

        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="i in 3" :key="i">
                <Skeleton class="h-6 w-24 mb-4" />
                <div class="space-y-2">
                    <Skeleton v-for="j in 5" :key="j" class="h-16 rounded-xl" />
                </div>
            </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- 热歌榜 -->
            <section>
                <div class="flex items-center gap-2 mb-4">
                    <Flame :size="18" class="text-orange-500" />
                    <h2 class="text-lg font-bold tracking-normal">热歌榜</h2>
                    <Badge variant="secondary" class="text-xs">每日更新</Badge>
                </div>

                <div v-if="hotPlaylist.length === 0" class="text-center py-8 text-muted-foreground">
                    <p class="text-sm">暂无数据</p>
                </div>

                <div v-else class="space-y-2">
                    <button
                        v-for="(song, index) in hotPlaylist"
                        :key="song.id"
                        class="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors text-left group"
                        @click="onPlay(song)"
                    >
                        <span
                            :class="[
                                'text-sm font-bold w-6 text-center',
                                index < 3 ? 'text-primary' : 'text-muted-foreground',
                            ]"
                        >
                            {{ index + 1 }}
                        </span>
                        <div
                            class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                        >
                            <img
                                v-if="song.al?.picUrl"
                                :src="`${song.al.picUrl}?param=100y100`"
                                :alt="song.name"
                                class="w-full h-full object-cover"
                            />
                            <Play v-else :size="14" class="text-muted-foreground" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">
                                {{ song.name }}
                            </p>
                            <p class="text-xs text-muted-foreground truncate">
                                {{ song.ar?.map((a) => a.name).join(" / ") }}
                            </p>
                        </div>
                    </button>
                </div>
            </section>

            <!-- 飙升榜 -->
            <section>
                <div class="flex items-center gap-2 mb-4">
                    <Zap :size="18" class="text-yellow-500" />
                    <h2 class="text-lg font-bold tracking-normal">飙升榜</h2>
                    <Badge variant="secondary" class="text-xs">增速最快</Badge>
                </div>

                <div
                    v-if="surgePlaylist.length === 0"
                    class="text-center py-8 text-muted-foreground"
                >
                    <p class="text-sm">暂无数据</p>
                </div>

                <div v-else class="space-y-2">
                    <button
                        v-for="(song, index) in surgePlaylist"
                        :key="song.id"
                        class="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors text-left group"
                        @click="onPlay(song)"
                    >
                        <span
                            :class="[
                                'text-sm font-bold w-6 text-center',
                                index < 3 ? 'text-primary' : 'text-muted-foreground',
                            ]"
                        >
                            {{ index + 1 }}
                        </span>
                        <div
                            class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                        >
                            <img
                                v-if="song.al?.picUrl"
                                :src="`${song.al.picUrl}?param=100y100`"
                                :alt="song.name"
                                class="w-full h-full object-cover"
                            />
                            <Play v-else :size="14" class="text-muted-foreground" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">
                                {{ song.name }}
                            </p>
                            <p class="text-xs text-muted-foreground truncate">
                                {{ song.ar?.map((a) => a.name).join(" / ") }}
                            </p>
                        </div>
                    </button>
                </div>
            </section>

            <!-- 新歌榜 -->
            <section>
                <div class="flex items-center gap-2 mb-4">
                    <TrendingUp :size="18" class="text-primary" />
                    <h2 class="text-lg font-bold tracking-normal">新歌榜</h2>
                    <Badge variant="secondary" class="text-xs">最新发行</Badge>
                </div>

                <div
                    v-if="newSongPlaylist.length === 0"
                    class="text-center py-8 text-muted-foreground"
                >
                    <p class="text-sm">暂无数据</p>
                </div>

                <div v-else class="space-y-2">
                    <button
                        v-for="(song, index) in newSongPlaylist"
                        :key="song.id"
                        class="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors text-left group"
                        @click="onPlay(song)"
                    >
                        <span
                            :class="[
                                'text-sm font-bold w-6 text-center',
                                index < 3 ? 'text-primary' : 'text-muted-foreground',
                            ]"
                        >
                            {{ index + 1 }}
                        </span>
                        <div
                            class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
                        >
                            <img
                                v-if="song.al?.picUrl"
                                :src="`${song.al.picUrl}?param=100y100`"
                                :alt="song.name"
                                class="w-full h-full object-cover"
                            />
                            <Play v-else :size="14" class="text-muted-foreground" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium truncate">
                                {{ song.name }}
                            </p>
                            <p class="text-xs text-muted-foreground truncate">
                                {{ song.ar?.map((a) => a.name).join(" / ") }}
                            </p>
                        </div>
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>
