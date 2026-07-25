<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted } from "vue"
import { player, seek } from "@/lib/player"
import PlayerControls from "@/components/player/PlayerControls.vue"

const lyricsEl = ref<HTMLDivElement>()
const userScrolling = ref(false)
const hovering = ref(false)
const orbColor = ref("rgba(30,20,20,0.5)")
const orbColor2 = ref("rgba(20,20,30,0.4)")
let returnTimer: ReturnType<typeof setTimeout> | null = null

const allLines = computed(() => player.lyrics)
const currentIdx = computed(() => player.currentLyricIndex)

function autoScroll() {
    if (userScrolling.value || !lyricsEl.value) return
    nextTick(() => {
        const el = lyricsEl.value?.querySelector(".l--active")
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
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

// ── 取色：双采样点用于流动效果 ──
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

        // 采样两半
        let r1 = 0,
            g1 = 0,
            b1 = 0,
            r2 = 0,
            g2 = 0,
            b2 = 0
        const half = (8 * 8 * 4) / 2
        for (let i = 0; i < half; i += 4) {
            r1 += d[i]
            g1 += d[i + 1]
            b1 += d[i + 2]
        }
        for (let i = half; i < d.length; i += 4) {
            r2 += d[i]
            g2 += d[i + 1]
            b2 += d[i + 2]
        }
        const n = half / 4
        orbColor.value = `rgba(${Math.round((r1 / n) * 0.3)},${Math.round((g1 / n) * 0.3)},${Math.round((b1 / n) * 0.3)},0.55)`
        orbColor2.value = `rgba(${Math.round((r2 / n) * 0.3)},${Math.round((g2 / n) * 0.3)},${Math.round((b2 / n) * 0.3)},0.45)`
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

const artists = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" · ") ?? "")
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
        <div class="bg-orb orb-1" :style="{ background: orbColor }" />
        <div class="bg-orb orb-2" :style="{ background: orbColor2 }" />
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
                <div v-if="!allLines.length" class="empty">暂无歌词</div>
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
.bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 1;
}
.orb-1 {
    width: 55%;
    height: 55%;
    top: 5%;
    left: 10%;
    animation: orb1 10s ease-in-out infinite;
}
.orb-2 {
    width: 45%;
    height: 45%;
    bottom: 5%;
    right: 15%;
    animation: orb2 13s ease-in-out infinite;
}
@keyframes orb1 {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(12%, -8%) scale(1.2);
    }
    66% {
        transform: translate(-5%, 10%) scale(0.9);
    }
}
@keyframes orb2 {
    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }
    33% {
        transform: translate(-10%, 5%) scale(1.15);
    }
    66% {
        transform: translate(8%, -12%) scale(0.85);
    }
}
.bg-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
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
