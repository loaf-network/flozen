<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue"
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    ListMusic,
    ListPlus,
    Volume2,
    VolumeX,
    Heart,
    Crown,
    Check,
} from "@lucide/vue"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import PlayQueuePanel from "./PlayQueuePanel.vue"
import AddToPlaylistDialog from "./AddToPlaylistDialog.vue"
import {
    player,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    setQuality,
    cyclePlayMode,
    formatTime,
    QUALITY_OPTIONS,
    qualityIndex,
    type QualityOption,
} from "@/lib/player"
import { getVipLevel, isSongLiked, toggleLike, type VipLevel } from "@/lib/ncmActions"

const bar = ref<HTMLDivElement>()
const queueOpen = ref(false)
const qualityOpen = ref(false)
const playlistOpen = ref(false)
const vipLevel = ref<VipLevel>("none")
const liked = ref(false)
const pct = computed(() => (player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0))

// 显示实际生效的音质（会员/版权限制降级后如实展示）
const currentQuality = computed<QualityOption>(
    () => QUALITY_OPTIONS[qualityIndex(player.actualQuality)] ?? QUALITY_OPTIONS[0],
)

// 音质 Dialog 中展示当前会员判定结果，便于确认 VIP/SVIP 区分
const vipLabel = computed(() =>
    vipLevel.value === "svip" ? "黑胶 SVIP" : vipLevel.value === "vip" ? "黑胶 VIP" : "非会员",
)

const VIP_RANK: Record<VipLevel, number> = { none: 0, vip: 1, svip: 2 }

function qualityAllowed(opt: QualityOption): boolean {
    if (!opt.vip) return true
    return VIP_RANK[vipLevel.value] >= VIP_RANK[opt.vip]
}

async function openQuality() {
    qualityOpen.value = true
    vipLevel.value = await getVipLevel(true)
}

async function pickQuality(value: QualityOption["value"]) {
    const opt = QUALITY_OPTIONS.find((o) => o.value === value)
    if (!opt) return
    if (!qualityAllowed(opt)) {
        const { toast } = await import("vue-sonner")
        toast.error(`「${opt.label}」音质需${opt.vip === "svip" ? "黑胶 SVIP" : "黑胶 VIP"}会员。`)
        return
    }
    setQuality(value)
    qualityOpen.value = false
    const { toast } = await import("vue-sonner")
    toast.success(`已切换至${opt.label}音质。`)
}

watch(
    () => player.currentSong?.id,
    async (id) => {
        if (!id) {
            liked.value = false
            return
        }
        const current = id
        const likedNow = await isSongLiked(id)
        // 防竞态：快速切歌时旧歌曲的查询结果不得覆盖当前歌曲状态
        if (player.currentSong?.id === current) liked.value = likedNow
    },
    { immediate: true },
)

let likePending = false

async function onLike() {
    if (!player.currentSong || likePending) return
    likePending = true
    const song = player.currentSong
    try {
        const next = await toggleLike(song)
        // 防竞态：操作期间切歌则不覆盖当前歌曲状态
        if (player.currentSong?.id === song.id) liked.value = next
        const { toast } = await import("vue-sonner")
        toast.success(next ? "已喜欢这首歌。" : "已取消喜欢。")
    } catch {
        const { toast } = await import("vue-sonner")
        toast.error("操作失败，请确认已登录网易云账号。")
    } finally {
        likePending = false
    }
}

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
            <!-- 左：音质 + 音量 + 模式 -->
            <div class="flex items-center gap-1">
                <div class="relative">
                    <Button
                        variant="ghost"
                        :size="'icon' as any"
                        title="切换音质"
                        class="!text-white/60 hover:!text-white hover:!bg-white/10 w-9 !px-0 !h-9"
                        @click.stop="openQuality"
                    >
                        <!-- 4 字音质名固定两行排版（如 超清/母带、高清/臻音） -->
                        <span class="text-[10px] leading-[1.2] text-center">
                            <template v-if="currentQuality.label.length > 2">
                                {{ currentQuality.label.slice(0, 2) }}<br />{{
                                    currentQuality.label.slice(2)
                                }}
                            </template>
                            <template v-else>{{ currentQuality.label }}</template>
                        </span>
                    </Button>
                </div>
                <div ref="volRef" class="relative">
                    <Button
                        variant="ghost"
                        :size="'icon' as any"
                        @click="setVolume(player.volume === 0 ? 0.7 : 0)"
                        class="peer !text-white/60 hover:!text-white hover:!bg-white/10"
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
                    :class="
                        isModeActive
                            ? '!text-primary hover:!text-primary'
                            : '!text-white/60 hover:!text-white hover:!bg-white/10'
                    "
                    @click="cyclePlayMode"
                >
                    <component :is="ModeIcon" :size="18" />
                </Button>
            </div>

            <!-- 中：播放控制 -->
            <div class="flex items-center gap-3">
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    class="!text-white/60 hover:!text-white hover:!bg-white/10"
                    @click="prev"
                >
                    <SkipBack :size="24" fill="currentColor" />
                </Button>
                <Button size="lg" @click="toggle">
                    <Pause v-if="player.playing" :size="28" fill="currentColor" />
                    <Play v-else :size="28" fill="currentColor" class="ml-0.5" />
                </Button>
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    class="!text-white/60 hover:!text-white hover:!bg-white/10"
                    @click="next"
                >
                    <SkipForward :size="24" fill="currentColor" />
                </Button>
            </div>

            <!-- 右：喜欢 + 加入歌单 + 列表 -->
            <div class="flex items-center gap-1">
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    title="喜欢"
                    :class="
                        liked
                            ? '!text-red-500 hover:!text-red-400'
                            : '!text-white/60 hover:!text-white hover:!bg-white/10'
                    "
                    @click="onLike"
                >
                    <Heart :size="18" :fill="liked ? 'currentColor' : 'none'" />
                </Button>
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    title="加入歌单"
                    class="!text-white/60 hover:!text-white hover:!bg-white/10"
                    @click="playlistOpen = true"
                >
                    <ListPlus :size="18" />
                </Button>
                <Button
                    variant="ghost"
                    :size="'icon' as any"
                    :class="
                        queueOpen
                            ? '!text-primary hover:!text-primary'
                            : '!text-white/60 hover:!text-white hover:!bg-white/10'
                    "
                    title="播放列表"
                    @click="queueOpen = !queueOpen"
                >
                    <ListMusic :size="18" />
                </Button>
            </div>
        </div>
    </div>

    <PlayQueuePanel v-model:open="queueOpen" />
    <AddToPlaylistDialog v-model:open="playlistOpen" :song="player.currentSong" />

    <!-- 音质选择 -->
    <Dialog :open="qualityOpen" @update:open="(v) => (qualityOpen = v)">
        <DialogContent class="sm:max-w-xs">
            <DialogHeader>
                <DialogTitle>选择音质</DialogTitle>
                <DialogDescription>
                    当前播放音质：{{ currentQuality.label }}。当前会员：{{ vipLabel }}。
                </DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-1 -mx-1 px-1">
                <button
                    v-for="opt in QUALITY_OPTIONS"
                    :key="opt.value"
                    class="flex items-center gap-2.5 px-3.5 py-3 rounded-xl hover:bg-accent/60 transition-colors text-left"
                    :class="player.quality === opt.value && 'bg-accent/40'"
                    @click="pickQuality(opt.value)"
                >
                    <span
                        class="text-sm flex-1"
                        :class="
                            player.actualQuality === opt.value
                                ? 'text-primary font-medium'
                                : qualityAllowed(opt)
                                  ? ''
                                  : 'text-muted-foreground'
                        "
                    >
                        {{ opt.label }}
                    </span>
                    <span class="text-[11px] text-muted-foreground">{{ opt.desc }}</span>
                    <Crown
                        v-if="opt.vip"
                        :size="12"
                        class="text-amber-500"
                        :class="qualityAllowed(opt) ? '' : 'opacity-40'"
                    />
                    <Check v-if="player.quality === opt.value" :size="14" class="text-primary" />
                </button>
            </div>
        </DialogContent>
    </Dialog>
</template>
