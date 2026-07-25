<script setup lang="ts">
import { computed, ref } from "vue"
import { Minus, X, Maximize2 } from "@lucide/vue"
import { player } from "@/lib/player"

const hovering = ref(false)

const lyricText = computed(() => {
    const idx = player.currentLyricIndex
    if (idx < 0 || idx >= player.lyrics.length) return ""
    return player.lyrics[idx].text
})

const artists = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" / ") ?? "")

function minimize() {
    import("@tauri-apps/api/window").then((m) => m.getCurrentWindow().minimize()).catch(() => {})
}

function maximize() {
    import("@tauri-apps/api/window")
        .then((m) => m.getCurrentWindow().toggleMaximize())
        .catch(() => {})
}

function close() {
    import("@tauri-apps/api/window").then((m) => m.getCurrentWindow().close()).catch(() => {})
}
</script>

<template>
    <div class="zen-island" @mouseenter="hovering = true" @mouseleave="hovering = false">
        <div class="zen-left">
            <span class="zen-brand">Flozen</span>
        </div>
        <div class="zen-center">
            <Transition name="zen-fade" mode="out-in">
                <div v-if="hovering && player.currentSong" key="info" class="zen-info">
                    <span class="zen-artist">{{ artists }}</span>
                    <span class="zen-title">{{ player.currentSong?.name }}</span>
                </div>
                <p v-else-if="player.currentSong" key="lyric" class="zen-lyric">
                    {{ lyricText || "..." }}
                </p>
                <p v-else key="empty" class="zen-empty">未在播放</p>
            </Transition>
        </div>
        <div class="zen-right">
            <button class="zen-btn" title="最小化" @click="minimize">
                <Minus :size="12" :stroke-width="2.5" />
            </button>
            <button class="zen-btn" title="最大化" @click="maximize">
                <Maximize2 :size="12" :stroke-width="2.5" />
            </button>
            <button class="zen-btn zen-btn-close" title="关闭" @click="close">
                <X :size="12" :stroke-width="2.5" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.zen-island {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 14px;
    gap: 12px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    user-select: none;
    position: relative;
    min-width: 320px;
    max-width: 520px;
}

.zen-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.zen-brand {
    font-size: 12px;
    font-weight: 600;
    color: rgba(220, 80, 60, 0.85);
    letter-spacing: 0.02em;
}

.zen-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    min-width: 0;
}

.zen-lyric {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
}

.zen-empty {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
}

.zen-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    line-height: 1;
}

.zen-artist {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.45);
}

.zen-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.zen-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.zen-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.zen-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
}

.zen-btn-close:hover {
    background: rgba(220, 60, 50, 0.6);
    color: #fff;
}

.zen-fade-enter-active,
.zen-fade-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}
.zen-fade-enter-from {
    opacity: 0;
    transform: translateY(4px);
}
.zen-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
