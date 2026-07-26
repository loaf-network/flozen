<script setup lang="ts">
import { useRouter } from "vue-router"
import { Search, Settings, Music, Trash2 } from "@lucide/vue"
import { toast } from "vue-sonner"
import { playHistory, play, clearHistory } from "@/lib/player"

const router = useRouter()

function playFromHistory(index: number) {
    play(playHistory[index].song)
    router.push("/player")
}

function onClearHistory() {
    clearHistory()
    toast.success("已清除播放记录")
}
</script>

<template>
    <div class="p-6">
        <h1 class="text-3xl font-bold tracking-normal mb-6">👋 你好，欢迎使用 Flozen</h1>

        <!-- 快速操作 -->
        <div class="grid grid-cols-2 gap-3 mb-6">
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 hover:border-primary/15 border border-transparent transition-colors text-left"
                @click="router.push('/app/search')"
            >
                <div class="size-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Search :size="18" class="text-primary" />
                </div>
                <div>
                    <p class="text-sm font-medium">搜索</p>
                    <p class="text-xs text-muted-foreground">发现音乐</p>
                </div>
            </button>
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 hover:border-primary/15 border border-transparent transition-colors text-left"
                @click="router.push('/app/settings')"
            >
                <div class="size-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Settings :size="18" class="text-primary" />
                </div>
                <div>
                    <p class="text-sm font-medium">设置</p>
                    <p class="text-xs text-muted-foreground">个性化配置</p>
                </div>
            </button>
        </div>

        <!-- 最近播放 -->
        <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-medium text-muted-foreground">最近播放</p>
            <button
                v-if="playHistory.length"
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/40"
                title="清除播放记录"
                @click="onClearHistory"
            >
                <Trash2 :size="13" />
                清除
            </button>
        </div>
        <div v-if="playHistory.length" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            <button
                v-for="(entry, i) in playHistory.slice(0, 12)"
                :key="entry.song.id"
                class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/40 transition-colors text-left min-w-0"
                @click="playFromHistory(i)"
            >
                <img
                    v-if="entry.song.al?.picUrl"
                    :src="`${entry.song.al.picUrl}?param=80y80`"
                    referrerpolicy="no-referrer"
                    class="size-11 rounded-lg object-cover shrink-0"
                />
                <div
                    v-else
                    class="size-11 rounded-lg bg-muted flex items-center justify-center shrink-0"
                >
                    <Music :size="16" class="text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ entry.song.name }}</p>
                    <p class="text-xs text-muted-foreground truncate">
                        {{ entry.song.ar?.map((a) => a.name).join(" / ") }}
                    </p>
                </div>
            </button>
        </div>
        <div
            v-else
            class="flex items-center justify-center py-10 rounded-2xl border border-solid border-border/40 text-muted-foreground"
        >
            <div class="flex flex-col items-center gap-2">
                <Music :size="24" :stroke-width="1" />
                <p class="text-xs">暂无播放记录</p>
            </div>
        </div>
    </div>
</template>
