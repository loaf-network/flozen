<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { ArrowLeft, Search } from "@lucide/vue"
import { useRouter, useRoute } from "vue-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ncmSearch, ncmSearchSuggest, ncmSearchHot, type SearchSong } from "@/lib/api"
import SongGrid from "@/components/SongGrid.vue"
import { play } from "@/lib/player"
import { searchState } from "@/lib/searchState"

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const loadingMore = ref(false)
const showSuggest = ref(false)
const contentEl = ref<HTMLElement>()
const COLS = 7
const LIMIT = COLS * 5

let debounceTimer: ReturnType<typeof setTimeout>
let searchSeq = 0 // doSearch 竞态防护：仅接受最新一次搜索的结果

function onInput() {
    if (!searchState.query.trim()) {
        searchState.suggests = []
        showSuggest.value = false
        return
    }
    showSuggest.value = true
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        const q = searchState.query.trim()
        if (!q) {
            searchState.suggests = []
            return
        }
        try {
            const res = await ncmSearchSuggest(q)
            // /search/suggest 的 songs 使用 artists/album/duration 字段，
            // 与 /cloudsearch 的 ar/al/dt 不同，这里归一化为标准 SearchSong
            searchState.suggests = (res.result?.songs ?? []).slice(0, 6).map((s) => ({
                id: s.id,
                name: s.name,
                ar: (s.artists ?? []).map((a) => ({ id: a.id, name: a.name })),
                al: s.album
                    ? { id: s.album.id, name: s.album.name, picUrl: s.album.picUrl ?? "" }
                    : { id: -1, name: "", picUrl: "" },
                dt: s.duration ?? 0,
            }))
        } catch {
            searchState.suggests = []
        }
    }, 300)
}

async function doSearch(keyword: string) {
    const seq = ++searchSeq
    searchState.query = keyword
    showSuggest.value = false
    searchState.searched = true
    loading.value = true
    searchState.results = []
    searchState.offset = 0
    searchState.hasMore = true
    try {
        const res = await ncmSearch(keyword, LIMIT, 0)
        if (seq !== searchSeq) return // 已有更新的搜索，丢弃本次结果
        searchState.results = res.result?.songs ?? []
        searchState.hasMore = searchState.results.length > 0
        searchState.offset = searchState.results.length
    } catch {
        if (seq !== searchSeq) return
        searchState.results = []
    } finally {
        if (seq === searchSeq) loading.value = false
    }
}

async function loadMore() {
    if (loadingMore.value || !searchState.hasMore || !searchState.query.trim()) return
    loadingMore.value = true
    try {
        const res = await ncmSearch(searchState.query.trim(), COLS * 2, searchState.offset)
        const more = res.result?.songs ?? []
        searchState.offset += more.length
        searchState.results = [...searchState.results, ...more]
        searchState.hasMore = more.length > 0
    } catch {
        // ignore
    } finally {
        loadingMore.value = false
    }
}

function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement
    searchState.scrollTop = el.scrollTop
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
        searchState.hotTags = res.result?.hots ?? []
    } catch {
        // ignore
    }
}

onMounted(() => {
    // 已有搜索历史时直接接续上次结果；否则加载热门搜索
    if (!searchState.searched && searchState.hotTags.length === 0) {
        loadHot()
    }
    const q = route.query.q as string
    const resumed = !(q && (q !== searchState.query || !searchState.searched))
    if (!resumed) {
        doSearch(q)
    } else if (searchState.scrollTop > 0) {
        // 接续上次结果时恢复滚动位置（新搜索则不恢复）
        nextTick(() => contentEl.value?.scrollTo(0, searchState.scrollTop))
    }
})
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
                    v-model="searchState.query"
                    placeholder="搜索音乐、歌手..."
                    class="pl-9 h-11 bg-muted/70 border-border/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                    @input="onInput"
                    @keydown.enter="searchState.query.trim() && doSearch(searchState.query.trim())"
                    @focus="onInput"
                    @blur="hideSuggest"
                />
            </div>

            <!-- Suggest dropdown -->
            <div
                v-if="showSuggest && searchState.suggests.length > 0"
                class="absolute left-6 right-6 mt-1 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
            >
                <button
                    v-for="s in searchState.suggests"
                    :key="s.id"
                    class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
                    @mousedown.prevent="pickSuggest(s)"
                >
                    <img
                        v-if="s.al.picUrl"
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

        <!-- Content area -->
        <div
            ref="contentEl"
            class="flex-1 overflow-auto px-6 pb-6 min-h-0"
            @scroll.passive="onScroll"
        >
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
            <template v-else-if="searchState.results.length > 0">
                <SongGrid
                    :songs="searchState.results"
                    :loading-more="loadingMore"
                    :has-more="searchState.hasMore"
                    @play="onPlay"
                />
            </template>

            <!-- No results -->
            <div v-else-if="searchState.searched" class="flex items-center justify-center h-40">
                <div class="rounded-full bg-muted/50 px-5 py-2 border border-border/40">
                    <span class="text-sm text-muted-foreground">没有找到相关结果</span>
                </div>
            </div>

            <!-- Hot tags (initial) -->
            <template v-else>
                <p class="text-sm text-muted-foreground mb-3">热门搜索</p>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="(tag, idx) in searchState.hotTags"
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
