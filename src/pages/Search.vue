<script setup lang="ts">
import { ref } from "vue"
import { ArrowLeft, Search, Grid3x3, Box } from "@lucide/vue"
import { useRouter } from "vue-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ncmSearch, ncmSearchSuggest, ncmSearchHot, type SearchSong } from "@/lib/api"
import SongGrid from "@/components/SongGrid.vue"
import SongWall from "@/components/SongWall.vue"
import { play } from "@/lib/player"

const router = useRouter()
const query = ref("")
const results = ref<SearchSong[]>([])
const suggests = ref<SearchSong[]>([])
const hotTags = ref<{ first: string; second: number }[]>([])
const viewMode = ref<"flat" | "3d">("flat")
const loading = ref(false)
const loadingMore = ref(false)
const showSuggest = ref(false)
const searched = ref(false)
const offset = ref(0)
const hasMore = ref(true)
const COLS = 7
const LIMIT = COLS * 5

let debounceTimer: ReturnType<typeof setTimeout>

function onInput() {
    if (!query.value.trim()) {
        suggests.value = []
        showSuggest.value = false
        return
    }
    showSuggest.value = true
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        const q = query.value.trim()
        if (!q) {
            suggests.value = []
            return
        }
        try {
            const res = await ncmSearchSuggest(q)
            suggests.value = res.result?.songs?.slice(0, 6) ?? []
        } catch {
            suggests.value = []
        }
    }, 300)
}

async function doSearch(keyword: string) {
    query.value = keyword
    showSuggest.value = false
    searched.value = true
    loading.value = true
    results.value = []
    offset.value = 0
    hasMore.value = true
    try {
        const res = await ncmSearch(keyword, LIMIT, 0)
        results.value = res.result?.songs ?? []
        hasMore.value = results.value.length > 0
        offset.value = results.value.length
    } catch {
        results.value = []
    } finally {
        loading.value = false
    }
}

async function loadMore() {
    if (loadingMore.value || !hasMore.value || !query.value.trim()) return
    loadingMore.value = true
    try {
        const res = await ncmSearch(query.value.trim(), COLS * 2, offset.value)
        const more = res.result?.songs ?? []
        offset.value += more.length
        results.value = [...results.value, ...more]
        hasMore.value = more.length > 0
    } catch {
        // ignore
    } finally {
        loadingMore.value = false
    }
}

function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
        loadMore()
    }
}

function pickSuggest(song: SearchSong) {
    doSearch(song.name)
}

function onPlay(song: SearchSong) {
    play(song)
    router.push("/player")
}

function hideSuggest() {
    setTimeout(() => (showSuggest.value = false), 150)
}

async function loadHot() {
    try {
        const res = await ncmSearchHot()
        hotTags.value = res.result?.hots ?? []
    } catch {
        // ignore
    }
}

loadHot()
</script>

<template>
    <div class="flex flex-col h-full">
        <!-- Header -->
        <header class="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
            <Button variant="ghost" size="icon-sm" @click="router.back()">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-normal">搜索</h1>
        </header>

        <!-- Search bar -->
        <div class="relative px-6 mb-4 shrink-0">
            <div class="relative">
                <Search
                    :size="16"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    v-model="query"
                    placeholder="搜索音乐、歌手..."
                    class="pl-9 h-11 bg-muted/70 border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                    @input="onInput"
                    @keydown.enter="query.trim() && doSearch(query.trim())"
                    @focus="onInput"
                    @blur="hideSuggest"
                />
            </div>

            <!-- Suggest dropdown -->
            <div
                v-if="showSuggest && suggests.length > 0"
                class="absolute left-6 right-6 mt-1 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
            >
                <button
                    v-for="s in suggests"
                    :key="s.id"
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
                    @mousedown.prevent="pickSuggest(s)"
                >
                    <img
                        :src="`${s.al.picUrl}?param=64y64`"
                        referrerpolicy="no-referrer"
                        class="w-8 h-8 rounded-md object-cover"
                    />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm truncate">{{ s.name }}</p>
                        <p class="text-xs text-muted-foreground truncate">
                            {{ s.ar.map((a) => a.name).join(" / ") }}
                        </p>
                    </div>
                </button>
            </div>
        </div>

        <!-- View toggle -->
        <div v-if="searched && !loading" class="flex items-center gap-2 px-6 mb-4 shrink-0">
            <Button
                :variant="viewMode === 'flat' ? 'default' : 'ghost'"
                size="sm"
                class="gap-1.5"
                @click="viewMode = 'flat'"
            >
                <Grid3x3 :size="14" />
                平铺
            </Button>
            <Button
                :variant="viewMode === '3d' ? 'default' : 'ghost'"
                size="sm"
                class="gap-1.5"
                @click="viewMode = '3d'"
            >
                <Box :size="14" />
                3D
            </Button>
        </div>

        <!-- Content area -->
        <div class="flex-1 overflow-auto px-6 pb-6 min-h-0" @scroll.passive="onScroll">
            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center h-40">
                <div
                    class="flex items-center gap-3 rounded-full bg-primary/8 px-5 py-2.5 border border-primary/10"
                >
                    <div
                        class="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin"
                    />
                    <span class="text-sm text-primary/70">搜索中...</span>
                </div>
            </div>

            <!-- Results -->
            <template v-else-if="results.length > 0">
                <SongGrid
                    v-if="viewMode === 'flat'"
                    :songs="results"
                    :loading-more="loadingMore"
                    :has-more="hasMore"
                    @play="onPlay"
                />
                <SongWall
                    v-else
                    :songs="results"
                    :loading-more="loadingMore"
                    :has-more="hasMore"
                    @load-more="loadMore"
                    @play="onPlay"
                />
            </template>

            <!-- No results -->
            <div v-else-if="searched" class="flex items-center justify-center h-40">
                <div class="rounded-full bg-muted/50 px-5 py-2 border border-border/40">
                    <span class="text-sm text-muted-foreground">没有找到相关结果</span>
                </div>
            </div>

            <!-- Hot tags (initial) -->
            <template v-else>
                <p class="text-sm text-muted-foreground mb-3">热门搜索</p>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="(tag, idx) in hotTags"
                        :key="tag.first"
                        :class="[
                            'px-4 py-2 rounded-full text-sm transition-colors',
                            idx < 3
                                ? 'bg-primary/10 text-primary hover:bg-primary/15'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                        ]"
                        @click="doSearch(tag.first)"
                    >
                        {{ tag.first }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>
