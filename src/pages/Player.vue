<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted } from "vue"
import { player, seek } from "@/lib/player"
import { loadConfig } from "@/lib/store"
import PlayerControls from "@/components/player/PlayerControls.vue"

const fluidBg = ref(true)
onMounted(async () => {
    fluidBg.value = (await loadConfig()).fluidBg
})

const lyricsEl = ref<HTMLDivElement>()
const userScrolling = ref(false)
const hovering = ref(false)
const blobColors = ref([
    "rgba(30,20,20,0.55)",
    "rgba(20,20,30,0.45)",
    "rgba(25,18,28,0.5)",
    "rgba(18,26,24,0.4)",
])
let returnTimer: ReturnType<typeof setTimeout> | null = null

const allLines = computed(() => player.lyrics)
const currentIdx = computed(() => player.currentLyricIndex)

function autoScroll() {
    if (userScrolling.value || !lyricsEl.value) return
    nextTick(() => {
        const container = lyricsEl.value
        const el = container?.querySelector<HTMLElement>(".l--active")
        if (!container || !el) return
        // 不用 scrollIntoView：它会连带滚动外层页面
        const top = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2
        container.scrollTo({ top, behavior: "smooth" })
    })
}

watch(currentIdx, autoScroll)
watch(allLines, () => nextTick(autoScroll))

function onScroll() {
    userScrolling.value = true
    if (returnTimer) clearTimeout(returnTimer)
    returnTimer = setTimeout(() => {
        userScrolling.value = false
        autoScroll()
    }, 2000)
}

function onClickLine(index: number) {
    if (returnTimer) clearTimeout(returnTimer)
    seek(player.lyrics[index]?.time ?? 0)
    userScrolling.value = false
    autoScroll()
}

// ── 取色：四象限采样用于液体流动色团 ──
function extractColors(url: string) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 8
        canvas.height = 8
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 8, 8)
        const d = ctx.getImageData(0, 0, 8, 8).data

        const alphas = [0.65, 0.55, 0.6, 0.5]
        const colors: string[] = []
        for (let q = 0; q < 4; q++) {
            const ox = (q % 2) * 4
            const oy = Math.floor(q / 2) * 4
            let r = 0,
                g = 0,
                b = 0
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const i = ((oy + y) * 8 + ox + x) * 4
                    r += d[i]
                    g += d[i + 1]
                    b += d[i + 2]
                }
            }
            r /= 16
            g /= 16
            b /= 16
            // 亮度归一化：最亮通道拉到 165，避免深色封面色团不可见
            const k = 165 / Math.max(r, g, b, 1)
            colors.push(
                `rgba(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)},${alphas[q]})`,
            )
        }
        blobColors.value = colors
    }
    img.src = url + "?param=20y20"
}

watch(
    () => player.currentSong?.al?.picUrl,
    (url) => {
        if (url) extractColors(url)
    },
    { immediate: true },
)

const artists = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" / ") ?? "")
const album = computed(() => player.currentSong?.al?.name ?? "")
</script>

<template>
    <div class="root">
        <!-- 背景 -->
        <div
            class="bg-cover"
            :style="{
                backgroundImage: player.currentSong?.al?.picUrl
                    ? `url(${player.currentSong.al.picUrl}?param=400y400)`
                    : undefined,
            }"
        />
        <div v-if="fluidBg" class="fluid" :class="{ 'fluid--paused': !player.playing }">
            <div
                v-for="(c, i) in blobColors"
                :key="i"
                :class="['blob', `blob-${i + 1}`]"
                :style="{ background: c }"
            />
        </div>
        <div class="bg-overlay" />

        <!-- 左列 -->
        <div class="left">
            <div v-if="player.currentSong?.al?.picUrl" class="cover">
                <img
                    :src="`${player.currentSong.al.picUrl}?param=600y600`"
                    referrerpolicy="no-referrer"
                />
            </div>
            <div v-if="player.currentSong" class="info">
                <p class="name">{{ player.currentSong.name }}</p>
                <p class="artist">{{ artists }}</p>
                <p v-if="album" class="album">{{ album }}</p>
            </div>
            <div class="ctrl">
                <PlayerControls />
            </div>
        </div>

        <!-- 右列 -->
        <div
            class="right"
            @scroll="onScroll"
            @mouseenter="hovering = true"
            @mouseleave="hovering = false"
        >
            <div ref="lyricsEl" class="lyrics">
                <div class="spacer" />
                <div v-if="!allLines.length" class="empty">
                    {{ player.currentSong ? "正在获取歌词中..." : "暂无歌词" }}
                </div>
                <p
                    v-for="(l, i) in allLines"
                    :key="i"
                    :class="['line', !userScrolling && i === currentIdx && 'l--active']"
                    :style="{
                        filter:
                            hovering || (!userScrolling && i === currentIdx)
                                ? 'blur(0)'
                                : 'blur(5px)',
                    }"
                    @click.stop="onClickLine(i)"
                >
                    {{ l.text }}
                </p>
                <div class="spacer" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.root {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    position: relative;
    overflow: hidden;
    min-width: 0;
    background: #000;
}

/* ── 背景 ── */
.bg-cover {
    position: absolute;
    inset: -30px;
    background-size: cover;
    background-position: center;
    filter: blur(60px) brightness(0.35);
    transform: scale(1.1);
    z-index: 0;
}
.fluid {
    position: absolute;
    inset: -15%;
    z-index: 1;
    filter: blur(60px) saturate(1.6);
    animation: fluid-spin 36s linear infinite;
    will-change: transform;
}
.blob {
    position: absolute;
    mix-blend-mode: screen;
    will-change: transform, border-radius;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
}
.fluid--paused,
.fluid--paused .blob {
    animation-play-state: paused;
}
.blob-1 {
    width: 52%;
    height: 52%;
    top: 4%;
    left: 8%;
    border-radius: 46% 54% 60% 40% / 50% 42% 58% 50%;
    animation-name: blob-a;
    animation-duration: 8s;
}
.blob-2 {
    width: 44%;
    height: 46%;
    bottom: 2%;
    right: 10%;
    border-radius: 58% 42% 44% 56% / 40% 60% 40% 60%;
    animation-name: blob-b;
    animation-duration: 10s;
}
.blob-3 {
    width: 38%;
    height: 40%;
    top: 30%;
    right: 22%;
    border-radius: 40% 60% 55% 45% / 55% 45% 60% 40%;
    animation-name: blob-c;
    animation-duration: 13s;
}
.blob-4 {
    width: 34%;
    height: 36%;
    bottom: 20%;
    left: 18%;
    border-radius: 60% 40% 42% 58% / 45% 55% 42% 58%;
    animation-name: blob-b;
    animation-duration: 15s;
    animation-direction: reverse;
}
@keyframes fluid-spin {
    to {
        transform: rotate(360deg);
    }
}
@keyframes blob-a {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
        border-radius: 46% 54% 60% 40% / 50% 42% 58% 50%;
    }
    33% {
        transform: translate(28%, -20%) scale(1.3);
        border-radius: 62% 38% 36% 64% / 38% 62% 40% 60%;
    }
    66% {
        transform: translate(-18%, 24%) scale(0.78);
        border-radius: 36% 64% 60% 40% / 64% 36% 62% 38%;
    }
}
@keyframes blob-b {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
        border-radius: 58% 42% 44% 56% / 40% 60% 40% 60%;
    }
    33% {
        transform: translate(-26%, 18%) scale(1.28);
        border-radius: 40% 60% 62% 38% / 60% 40% 64% 36%;
    }
    66% {
        transform: translate(22%, -28%) scale(0.75);
        border-radius: 64% 36% 38% 62% / 40% 60% 38% 62%;
    }
}
@keyframes blob-c {
    0%,
    100% {
        transform: translate(0, 0) scale(1) rotate(0deg);
        border-radius: 40% 60% 55% 45% / 55% 45% 60% 40%;
    }
    25% {
        transform: translate(18%, 22%) scale(1.22) rotate(35deg);
        border-radius: 58% 42% 38% 62% / 38% 62% 42% 58%;
    }
    50% {
        transform: translate(-22%, 10%) scale(0.82) rotate(-30deg);
        border-radius: 42% 58% 64% 36% / 62% 38% 56% 44%;
    }
    75% {
        transform: translate(10%, -22%) scale(1.14) rotate(20deg);
        border-radius: 64% 36% 42% 58% / 42% 58% 62% 38%;
    }
}
.bg-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.18);
    z-index: 2;
}

/* ── 左列 ── */
.left {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(12px, 2vh, 24px);
    padding: clamp(12px, 3vh, 24px) clamp(8px, 2vw, 16px) clamp(12px, 3vh, 24px)
        clamp(12px, 2vw, 28px);
    grid-row: 1;
    grid-column: 1;
    min-width: 0;
    overflow: hidden;
}
.cover {
    width: clamp(200px, 40vw, 420px);
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow:
        0 8px 40px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05);
}
.cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}
.info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    max-width: 100%;
}
.name {
    font-size: clamp(18px, 2.8vw, 28px);
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
.artist {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.45);
}
.album {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.22);
}
.ctrl {
    width: 100%;
    max-width: 440px;
}

/* ── 右列 ── */
.right {
    position: relative;
    z-index: 10;
    grid-row: 1;
    grid-column: 2;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
        0deg,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 1) 6%,
        rgba(0, 0, 0, 1) 94%,
        rgba(0, 0, 0, 0) 100%
    );
}
.lyrics {
    position: relative;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-left: clamp(12px, 2vw, 24px);
    padding-right: clamp(12px, 2vw, 32px);
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
.spacer {
    height: 40vh;
    flex-shrink: 0;
}
.line {
    font-size: clamp(18px, 2.6vw, 26px);
    color: rgba(255, 255, 255, 0.42);
    line-height: 1.55;
    padding: 12px 0;
    cursor: pointer;
    transition:
        filter 0.5s ease,
        color 0.3s ease,
        font-size 0.3s ease;
    white-space: normal;
    word-break: break-all;
    overflow-wrap: break-word;
}
.line:hover {
    color: rgba(255, 255, 255, 0.7);
}
.l--active {
    font-size: clamp(26px, 3.8vw, 38px);
    font-weight: 700;
    color: #fff;
    padding: 16px 0;
}
.empty {
    color: rgba(255, 255, 255, 0.12);
    font-size: 14px;
    text-align: center;
    margin-top: 80px;
}
</style>
