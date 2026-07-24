<script setup lang="ts">
import { ref } from "vue"
import { Play } from "@lucide/vue"
import type { SearchSong } from "@/lib/api"

defineProps<{
    songs: SearchSong[]
    loadingMore?: boolean
    hasMore?: boolean
}>()

const emit = defineEmits<{ play: [song: SearchSong] }>()

const loaded = ref(new Set<number>())

function thumb(url: string) {
    return `${url}?param=240y240`
}

function onImageLoad(index: number) {
    loaded.value.add(index)
}

function formatDuration(ms: number) {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms / 1000) % 60)
    return `${m}:${String(s).padStart(2, "0")}`
}
</script>

<template>
    <div>
        <div
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4"
        >
            <div
                v-for="(song, index) in songs"
                :key="song.id"
                class="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/30"
                :style="{
                    opacity: loaded.has(index) ? 1 : 0,
                    transform: loaded.has(index)
                        ? 'translateY(0) scale(1)'
                        : 'translateY(16px) scale(0.95)',
                    transition: `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${(index % 7) * 50}ms, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${(index % 7) * 50}ms`,
                }"
            >
                <!-- Cover image -->
                <div class="relative aspect-square overflow-hidden">
                    <img
                        :src="thumb(song.al.picUrl)"
                        :alt="song.al.name"
                        referrerpolicy="no-referrer"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        @load="onImageLoad(index)"
                    />
                    <!-- Bottom gradient overlay with text -->
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                    />
                    <!-- Song info overlay -->
                    <div class="absolute bottom-0 left-0 right-0 p-3">
                        <p
                            class="font-semibold text-sm text-white truncate leading-tight drop-shadow-lg"
                        >
                            {{ song.name }}
                        </p>
                        <p class="text-[11px] text-white/70 truncate mt-0.5 drop-shadow">
                            {{ song.ar.map((a) => a.name).join(" / ") }}
                        </p>
                    </div>
                    <!-- Play button -->
                    <button
                        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 border border-white/15"
                        @click.stop="emit('play', song)"
                    >
                        <Play :size="22" fill="white" class="text-white ml-0.5" />
                    </button>
                    <!-- Duration -->
                    <div
                        class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/55 text-[10px] text-white/80 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                        {{ formatDuration(song.dt) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Load more -->
        <div v-if="loadingMore" class="flex justify-center py-8">
            <div
                class="flex items-center gap-3 rounded-full bg-muted/60 px-4 py-2 border border-border/40"
            >
                <div
                    class="w-4 h-4 border-2 border-white/25 border-t-white/70 rounded-full animate-spin"
                />
                <span class="text-xs text-white/50">加载更多...</span>
            </div>
        </div>
        <div v-else-if="hasMore === false" class="flex justify-center py-8">
            <div class="rounded-full bg-muted/40 px-4 py-1.5 border border-border/30">
                <span class="text-xs text-white/30">已加载全部</span>
            </div>
        </div>
    </div>
</template>
