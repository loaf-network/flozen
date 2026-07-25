<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    ListMusic,
    Volume2,
    VolumeX,
    Heart,
} from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
    player,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    cyclePlayMode,
    formatTime,
} from "@/lib/player"

const bar = ref<HTMLDivElement>()
const pct = computed(() => (player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0))

function onSeek(e: MouseEvent) {
    if (!bar.value) return
    const r = bar.value.getBoundingClientRect()
    seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * player.duration)
}

const VolIcon = computed(() => (player.volume === 0 ? VolumeX : Volume2))

const ModeIcon = computed(() => {
    if (player.shuffle) return Shuffle
    if (player.repeatMode === "none") return Repeat
    if (player.repeatMode === "all") return Repeat
    return Repeat1
})
const isModeActive = computed(() => player.shuffle || player.repeatMode !== "none")

function onVolWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setVolume(Math.max(0, Math.min(1, player.volume + delta)))
}

const volRef = ref<HTMLDivElement>()
onMounted(() => {
    volRef.value?.addEventListener("wheel", onVolWheel, { passive: false })
})
</script>

<template>
    <div class="w-full flex flex-col gap-2">
        <!-- 进度条 -->
        <div class="flex items-center gap-3">
            <span class="text-xs tabular-nums text-white/35 min-w-[40px] text-right">{{
                formatTime(player.currentTime)
            }}</span>
            <div
                ref="bar"
                class="flex-1 h-[6px] rounded-full bg-white/12 relative cursor-pointer group"
                @click="onSeek"
            >
                <div
                    class="absolute inset-y-0 left-0 rounded-full bg-white/80 group-hover:bg-white"
                    :style="{ width: pct + '%' }"
                />
                <div
                    class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100"
                    :style="{ left: pct + '%' }"
                />
            </div>
            <span class="text-xs tabular-nums text-white/35 min-w-[40px]">{{
                formatTime(player.duration)
            }}</span>
        </div>

        <!-- 按钮行 -->
        <div class="flex items-center justify-between">
            <!-- 左：音量 + 模式 -->
            <div class="flex items-center gap-1">
                <div ref="volRef" class="relative">
                    <Button
                        variant="ghost"
                        :size="'icon' as any"
                        @click="setVolume(player.volume === 0 ? 0.7 : 0)"
                        class="peer"
                    >
                        <component :is="VolIcon" :size="18" />
                    </Button>
                    <div
                        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-3 h-20 rounded-full bg-white/10 opacity-0 peer-hover:opacity-100 hover:opacity-100 transition-opacity pointer-events-auto"
                    >
                        <div
                            class="absolute bottom-0 inset-x-0 rounded-full bg-white/60"
                            :style="{ height: player.volume * 100 + '%' }"
                        />
                    </div>
                </div>
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    :class="isModeActive && '!text-primary'"
                    @click="cyclePlayMode"
                >
                    <component :is="ModeIcon" :size="18" />
                </Button>
            </div>

            <!-- 中：播放控制 -->
            <div class="flex items-center gap-3">
                <Button variant="ghost" :size="'icon' as any" @click="prev">
                    <SkipBack :size="24" fill="currentColor" />
                </Button>
                <Button size="lg" @click="toggle">
                    <Pause v-if="player.playing" :size="28" fill="currentColor" />
                    <Play v-else :size="28" fill="currentColor" class="ml-0.5" />
                </Button>
                <Button variant="ghost" :size="'icon' as any" @click="next">
                    <SkipForward :size="24" fill="currentColor" />
                </Button>
            </div>

            <!-- 右：爱心 + 列表 -->
            <div class="flex items-center gap-1">
                <Button variant="ghost" :size="'icon' as any">
                    <Heart :size="18" />
                </Button>
                <Button variant="ghost" :size="'icon' as any" title="播放列表">
                    <ListMusic :size="18" />
                </Button>
            </div>
        </div>
    </div>
</template>
