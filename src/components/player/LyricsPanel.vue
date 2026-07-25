<script setup lang="ts">
import { computed, watch, ref, nextTick } from "vue"
import { player } from "@/lib/player"

const container = ref<HTMLDivElement>()

const lines = computed(() => {
    const c = player.currentLyricIndex
    return player.lyrics.map((l, i) => {
        const off = i - c
        const a = Math.abs(off)
        const opacity = off === 0 ? 1 : Math.max(0.06, 0.45 - a * 0.07)
        return { text: l.text, opacity, active: off === 0 }
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
</script>

<template>
    <div class="lyrics-wrap">
        <div ref="container" class="lyrics-scroll">
            <div v-if="!lines.length" class="lyrics-empty">暂无歌词</div>
            <p
                v-for="(l, i) in lines"
                :key="i"
                :class="['lyric-line', l.active && 'l--active']"
                :style="{ opacity: l.opacity }"
            >
                {{ l.text }}
            </p>
            <div class="lyrics-spacer" />
        </div>
    </div>
</template>

<style scoped>
.lyrics-wrap {
    height: 100%;
}

.lyrics-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    scrollbar-width: none;
}
.lyrics-scroll::-webkit-scrollbar {
    display: none;
}

.lyric-line {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
    text-align: left;
    line-height: 1.7;
    padding: 4px 0;
    transition:
        opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        color 0.4s ease;
}

.l--active {
    color: var(--primary);
    font-weight: 600;
    font-size: 15px;
    opacity: 1 !important;
}

.lyrics-empty {
    color: rgba(255, 255, 255, 0.18);
    font-size: 14px;
    text-align: center;
    margin-top: 60px;
}

.lyrics-spacer {
    height: 60px;
    flex-shrink: 0;
}
</style>
