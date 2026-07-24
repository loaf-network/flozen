<script setup lang="ts">
import { computed, watch, ref, nextTick } from "vue"
import { player } from "@/lib/player"

const container = ref<HTMLDivElement>()

const lines = computed(() => {
    const c = player.currentLyricIndex
    return player.lyrics.map((l, i) => {
        const off = i - c
        const a = Math.abs(off)
        const angle = off * 2.5
        const opacity = off === 0 ? 1 : Math.max(0.06, 0.5 - a * 0.04)
        return { text: l.text, angle, opacity, active: off === 0 }
    })
})

watch(
    () => player.currentLyricIndex,
    () => {
        nextTick(() => {
            const el = container.value?.querySelector(".l--active")
            el?.scrollIntoView({ behavior: "smooth", block: "center" })
        })
    },
)

const art = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" - ") ?? "")
</script>

<template>
    <div class="wrap">
        <div v-if="player.currentSong" class="meta">
            <p class="meta-name">{{ player.currentSong.name }}</p>
            <p class="meta-art">{{ art }}</p>
        </div>
        <div ref="container" class="scroll">
            <div v-if="!lines.length" class="empty">暂无歌词</div>
            <div
                v-for="(l, i) in lines"
                :key="i"
                :class="['line', l.active && 'l--active']"
                :style="{ transform: `rotate(${l.angle}deg)`, opacity: l.opacity }"
            >
                {{ l.text }}
            </div>
        </div>
    </div>
</template>

<style scoped>
.wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-left: 24px;
}

.meta {
    padding: 16px 0 10px;
    flex-shrink: 0;
}
.meta-name {
    font-size: 16px;
    font-weight: 700;
    color: white;
}
.meta-art {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 4px;
}

.scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 20px 0 60px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    scrollbar-width: none;
}
.scroll::-webkit-scrollbar {
    display: none;
}

.empty {
    color: rgba(255, 255, 255, 0.2);
    font-size: 14px;
    align-self: center;
    margin-top: 40px;
}

.line {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    padding: 3px 0;
    transition:
        transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        color 0.4s ease;
    transform-origin: 0 50%;
    font-weight: 400;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}

.l--active {
    color: white;
    font-weight: 600;
    opacity: 1 !important;
}
</style>
