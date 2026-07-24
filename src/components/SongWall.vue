<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue"
import { Play } from "@lucide/vue"
import type { SearchSong } from "@/lib/api"

const props = defineProps<{
    songs: SearchSong[]
    loadingMore?: boolean
    hasMore?: boolean
}>()

const emit = defineEmits<{ loadMore: []; play: [song: SearchSong] }>()

// ─── Viewport ───
const viewport = ref<HTMLDivElement>()
const vpW = ref(0)
const vpH = ref(0)

// ─── Grid ───
const CARD = computed(() => {
    if (vpW.value < 400) return 120
    if (vpW.value < 640) return 140
    if (vpW.value < 1024) return 160
    return 184
})
const COLS = computed(() => {
    if (vpW.value < 400) return 2
    if (vpW.value < 640) return 3
    if (vpW.value < 1024) return 4
    if (vpW.value < 1440) return 5
    return 6
})
const GX = computed(() => CARD.value * 1.22)
const GY = computed(() => CARD.value * 1.4)
const LOAD_PAD = computed(() => CARD.value * 3.5)

// ─── Camera ───
const ox = ref(0)
const oy = ref(0)

// ─── Physics ───
const dragging = ref(false)
let anchorX = 0,
    anchorY = 0,
    anchorOx = 0,
    anchorOy = 0
let vx = 0,
    vy = 0
let prevX = 0,
    prevY = 0,
    prevTime = 0
let moveTotal = 0 // track total movement to distinguish click vs drag
let raf = 0
let snapTarget: { x: number; y: number } | null = null

// ─── Grid positions ───
const positions = computed(() => {
    const list: { x: number; y: number }[] = []
    const half = ((COLS.value - 1) * GX.value) / 2
    for (let i = 0; i < props.songs.length; i++) {
        list.push({
            x: (i % COLS.value) * GX.value - half,
            y: Math.floor(i / COLS.value) * GY.value,
        })
    }
    return list
})

// ─── Rendered cards ───
interface CardRender {
    song: SearchSong
    x: number
    y: number
    scale: number
    blur: number
    opacity: number
    z: number
}

const cards = computed(() => {
    if (vpW.value === 0 || vpH.value === 0) return [] as CardRender[]

    const cx = vpW.value / 2
    const cy = vpH.value / 2
    const maxDist = Math.hypot(vpW.value, vpH.value) * 0.6
    const list: CardRender[] = []

    for (let i = 0; i < props.songs.length; i++) {
        const p = positions.value[i]
        if (!p) break

        const sx = p.x + ox.value + cx
        const sy = p.y + oy.value + cy
        const dx = sx - cx
        const dy = sy - cy
        const dist = Math.hypot(dx, dy)

        if (dist > maxDist * 2) continue

        const t = Math.min(dist / maxDist, 1)
        const ease = t * t

        list.push({
            song: props.songs[i],
            x: p.x,
            y: p.y,
            scale: 1 - ease * 0.45,
            blur: ease > 0.5 ? (ease - 0.5) * 5 : 0,
            opacity: 1 - ease * 0.3,
            z: Math.round((1 - ease) * 100),
        })
    }

    return list
})

// ─── Pointer events ───
function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    dragging.value = true
    moveTotal = 0
    snapTarget = null
    anchorX = e.clientX
    anchorY = e.clientY
    anchorOx = ox.value
    anchorOy = oy.value
    vx = 0
    vy = 0
    prevX = e.clientX
    prevY = e.clientY
    prevTime = performance.now()
    viewport.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
    if (!dragging.value) return
    const now = performance.now()
    const dt = Math.max(now - prevTime, 1)
    vx = ((e.clientX - prevX) / dt) * 16
    vy = ((e.clientY - prevY) / dt) * 16
    prevX = e.clientX
    prevY = e.clientY
    prevTime = now
    ox.value = anchorOx + (e.clientX - anchorX)
    oy.value = anchorOy + (e.clientY - anchorY)
    moveTotal += Math.abs(e.clientX - prevX) + Math.abs(e.clientY - prevY)
}

function onPointerUp(e: PointerEvent) {
    dragging.value = false
    // Immediately snap to nearest card
    let best = Infinity
    let bestP: { x: number; y: number } | null = null
    for (const p of positions.value) {
        const d = Math.hypot(p.x + ox.value, p.y + oy.value)
        if (d < best) {
            best = d
            bestP = p
        }
    }
    if (bestP) snapTarget = { x: -bestP.x, y: -bestP.y }
}

// ─── Click to play (only on small taps, not drags) ───
function onCardClick(song: SearchSong) {
    if (moveTotal < 5) emit("play", song)
}

// ─── Wheel ───
function onWheel(e: WheelEvent) {
    snapTarget = null
    ox.value -= e.deltaX
    oy.value -= e.deltaY
}

// ─── Animation ───
function tick() {
    if (!dragging.value) {
        if (snapTarget) {
            // Spring to snap target
            const stiffness = 0.06
            const damp = 0.49
            const dx = snapTarget.x - ox.value
            const dy = snapTarget.y - oy.value
            vx += stiffness * dx - damp * vx
            vy += stiffness * dy - damp * vy
            ox.value += vx
            oy.value += vy

            if (
                Math.abs(dx) < 0.3 &&
                Math.abs(dy) < 0.3 &&
                Math.abs(vx) < 0.1 &&
                Math.abs(vy) < 0.1
            ) {
                ox.value = snapTarget.x
                oy.value = snapTarget.y
                vx = 0
                vy = 0
                snapTarget = null
            }
        } else {
            // Free float with friction + gentle centering
            const friction = 0.95
            vx *= friction
            vy *= friction
            ox.value += vx
            oy.value += vy

            // Snap small drift to zero
            if (Math.abs(ox.value) < 0.3 && Math.abs(vx) < 0.03) {
                ox.value = 0
                vx = 0
            }
            if (Math.abs(oy.value) < 0.3 && Math.abs(vy) < 0.03) {
                oy.value = 0
                vy = 0
            }
        }
    }

    // Load more: check if the last card is near viewport
    if (!props.loadingMore && props.hasMore && positions.value.length > 0) {
        const lastP = positions.value[positions.value.length - 1]
        const d = Math.hypot(lastP.x + ox.value, lastP.y + oy.value)
        if (d < Math.hypot(vpW.value, vpH.value) * 0.5 + LOAD_PAD.value) emit("loadMore")
    }

    raf = requestAnimationFrame(tick)
}

function updateSize() {
    if (!viewport.value) return
    vpW.value = viewport.value.clientWidth
    vpH.value = viewport.value.clientHeight
}

function thumb(url: string) {
    return `${url}?param=360y360`
}

onMounted(() => {
    updateSize()
    window.addEventListener("resize", updateSize)
    raf = requestAnimationFrame(tick)
})

onUnmounted(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener("resize", updateSize)
})
</script>

<template>
    <div
        ref="viewport"
        class="w-full h-[calc(100vh-10rem)] rounded-2xl overflow-hidden relative select-none bg-[#0d0c0a]"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown.prevent="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @wheel.passive="onWheel"
    >
        <!-- Background atmosphere -->
        <div class="absolute inset-0 pointer-events-none">
            <div
                class="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(200,80,40,0.06)_0%,transparent_65%)]"
            />
        </div>

        <!-- Cards -->
        <div
            class="absolute left-1/2 top-1/2"
            style="width: 0; height: 0"
            :style="{ transform: `translate(${ox}px, ${oy}px)` }"
        >
            <div
                v-for="card in cards"
                :key="card.song.id"
                class="group absolute rounded-2xl overflow-hidden"
                :style="{
                    width: CARD + 'px',
                    height: CARD + 'px',
                    left: card.x - CARD / 2 + 'px',
                    top: card.y - CARD / 2 + 'px',
                    transform: `scale(${card.scale})`,
                    opacity: card.opacity,
                    filter: card.blur > 0.5 ? `blur(${card.blur}px)` : undefined,
                    zIndex: card.z,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: '#1c1a18',
                    boxShadow:
                        card.z > 60
                            ? '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(200,80,40,0.04)'
                            : '0 2px 12px rgba(0,0,0,0.4)',
                    transition: 'filter 0.4s ease',
                }"
                @click.stop="onCardClick(card.song)"
            >
                <img
                    :src="thumb(card.song.al.picUrl)"
                    :alt="card.song.name"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover"
                    loading="lazy"
                />
                <div
                    class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent"
                />
                <div class="absolute bottom-0 left-0 right-0 p-3">
                    <p class="text-xs font-semibold text-white/95 truncate leading-tight">
                        {{ card.song.name }}
                    </p>
                    <p class="text-[10px] text-white/45 truncate mt-0.5">
                        {{ card.song.ar.map((a) => a.name).join(" / ") }}
                    </p>
                </div>
                <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <div
                        class="w-11 h-11 rounded-full bg-black/30 border border-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    >
                        <Play :size="18" fill="white" class="text-white ml-0.5" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div
            v-if="loadingMore"
            class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-black/50 px-4 py-2 border border-white/10"
        >
            <div
                class="w-4 h-4 border-2 border-white/25 border-t-white/70 rounded-full animate-spin"
            />
            <span class="text-xs text-white/50">加载更多...</span>
        </div>

        <!-- No more -->
        <div
            v-if="hasMore === false && !loadingMore"
            class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black/30 px-4 py-1.5 border border-white/5"
        >
            <span class="text-xs text-white/30">已加载全部</span>
        </div>
    </div>
</template>
