<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { Minus, X, Maximize2 } from "@lucide/vue"
import { player } from "@/lib/player"

const route = useRoute()
const hovering = ref(false)

const onPlayer = computed(() => route.path === "/player")

const lyricText = computed(() => {
    const idx = player.currentLyricIndex
    if (idx < 0 || idx >= player.lyrics.length) return ""
    return player.lyrics[idx].text
})

const artists = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" - ") ?? "")

async function minimize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window")
    await getCurrentWindow().minimize()
}
async function maximize() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window")
    await getCurrentWindow().toggleMaximize()
}
async function closeWin() {
    const { getCurrentWindow } = await import("@tauri-apps/api/window")
    await getCurrentWindow().close()
}
</script>

<template>
    <header data-tauri-drag-region class="app-header">
        <div class="header-left">
            <span class="header-brand">Flozen</span>
        </div>

        <div class="header-center" @mouseenter="hovering = true" @mouseleave="hovering = false">
            <Transition name="hdr-fade" mode="out-in">
                <div v-if="onPlayer" key="player" class="header-placeholder" />
                <div v-else-if="hovering && player.currentSong" key="info" class="header-info">
                    <span class="header-artist">{{ artists }}</span>
                    <span class="header-song">{{ player.currentSong?.name }}</span>
                </div>
                <p v-else-if="player.currentSong" key="lyric" class="header-lyric">
                    {{ lyricText || "..." }}
                </p>
                <p v-else key="empty" class="header-idle">暂无歌曲正在播放中</p>
            </Transition>
        </div>

        <div class="header-right">
            <button
                data-tauri-drag-region="false"
                class="win-btn"
                title="最小化"
                @click.stop="minimize"
            >
                <Minus :size="14" :stroke-width="2" />
            </button>
            <button
                data-tauri-drag-region="false"
                class="win-btn"
                title="最大化"
                @click.stop="maximize"
            >
                <Maximize2 :size="12" :stroke-width="2" />
            </button>
            <button
                data-tauri-drag-region="false"
                class="win-btn win-btn--close"
                title="关闭"
                @click.stop="closeWin"
            >
                <X :size="14" :stroke-width="2" />
            </button>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    background: rgba(12, 11, 10, 0.88);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
    user-select: none;
    z-index: 100;
}

:root .app-header {
    background: rgba(255, 255, 255, 0.88);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-left {
    flex-shrink: 0;
    width: 72px;
}

.header-brand {
    font-size: 14px;
    font-weight: 700;
    color: rgba(220, 80, 60, 1);
    letter-spacing: 0.02em;
}

:root .header-brand {
    color: rgba(200, 50, 20, 1);
}

.header-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    min-width: 0;
    height: 100%;
}

.header-lyric {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
:root .header-lyric {
    color: rgba(0, 0, 0, 0.85);
}

.header-idle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.18);
    font-weight: 500;
}
:root .header-idle {
    color: rgba(0, 0, 0, 0.15);
}

.header-placeholder {
    /* empty space when on player page */
}

.header-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    line-height: 1;
}

.header-artist {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.38);
    font-weight: 500;
}
:root .header-artist {
    color: rgba(0, 0, 0, 0.35);
}

.header-song {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.92);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
}
:root .header-song {
    color: rgba(0, 0, 0, 0.85);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    width: 86px;
    justify-content: flex-end;
}

.win-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.35);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.win-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
}
.win-btn--close:hover {
    background: rgba(220, 60, 50, 0.55);
    color: #fff;
}

:root .win-btn {
    color: rgba(0, 0, 0, 0.3);
}
:root .win-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.6);
}

.hdr-fade-enter-active,
.hdr-fade-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}
.hdr-fade-enter-from {
    opacity: 0;
    transform: translateY(3px);
}
.hdr-fade-leave-to {
    opacity: 0;
    transform: translateY(-3px);
}
</style>
