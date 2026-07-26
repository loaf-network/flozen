<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Minus, X, Maximize2, ChevronLeft } from "@lucide/vue"
import { player } from "@/lib/player"

const route = useRoute()
const router = useRouter()
const hovering = ref(false)

const onPlayer = computed(() => route.name === "player")
const artists = computed(() => player.currentSong?.ar?.map((a) => a.name).join(" / ") ?? "")

const currentLyric = computed(() => {
    const idx = player.currentLyricIndex
    if (idx < 0 || idx >= player.lyrics.length) return ""
    return player.lyrics[idx].text
})

const hitokoto = ref("")

onMounted(async () => {
    try {
        const res = await fetch(
            "https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k&c=l&encode=text&charset=utf-8",
        )
        if (res.ok) {
            hitokoto.value = (await res.text()).trim()
        }
    } catch {
        /* ignore */
    }
})

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
    <header data-tauri-drag-region class="app-header" :class="{ 'is-player': onPlayer }">
        <div class="header-left">
            <button
                v-if="onPlayer"
                class="header-back"
                data-tauri-drag-region="false"
                @click.stop="router.back()"
            >
                <ChevronLeft :size="18" :stroke-width="2" />
            </button>
            <span v-else class="header-brand">Flozen</span>
        </div>

        <div class="header-center">
            <div
                v-if="!onPlayer"
                class="header-text"
                @mouseenter="hovering = true"
                @mouseleave="hovering = false"
            >
                <Transition name="hdr-text" mode="out-in">
                    <p
                        v-if="player.currentSong && !hovering"
                        :key="`lyric-${player.currentLyricIndex}`"
                        class="header-lyric"
                    >
                        {{ currentLyric || "···" }}
                    </p>
                    <p v-else-if="player.currentSong" key="song" class="header-song-info">
                        <span class="hdr-artist">{{ artists }}</span>
                        <span class="hdr-sep">-</span>
                        <span class="hdr-name">{{ player.currentSong.name }}</span>
                    </p>
                    <p v-else key="idle" class="header-idle">
                        {{ hitokoto || "Flozen 音乐播放器" }}
                    </p>
                </Transition>
            </div>
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
    height: 44px;
    padding: 0 12px;
    background: transparent;
    border-bottom: 1px solid transparent;
    flex-shrink: 0;
    user-select: none;
    z-index: 100;
    transition:
        background 0.3s ease,
        border-color 0.3s ease;
}
.app-header:not(.is-player) {
    background: oklch(0.55 0.18 22 / 0.12);
    border-bottom-color: oklch(0.55 0.18 22 / 0.15);
}
.app-header.is-player {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: transparent;
    border-bottom: none;
    /* 等抽屉滑上完成后再淡入，避免按钮在旧页面上闪现 */
    animation: hdr-appear 0.3s ease 0.45s both;
}
@keyframes hdr-appear {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
.dark .app-header:not(.is-player) {
    background: oklch(0.62 0.17 22 / 0.08);
    border-bottom-color: oklch(0.62 0.17 22 / 0.12);
}
.header-left {
    flex-shrink: 0;
    width: 100px;
    display: flex;
    align-items: center;
}
.header-brand {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 0.03em;
    padding-left: 4px;
}
.header-back {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.header-back:hover {
    background: var(--accent);
    color: var(--foreground);
}
.is-player .header-back {
    color: rgba(255, 255, 255, 0.6);
}
.is-player .header-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
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
.header-text {
    max-width: 100%;
    overflow: hidden;
}
.header-lyric {
    font-size: 15px;
    font-weight: 600;
    color: var(--foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dark .header-lyric {
    color: rgba(255, 255, 255, 0.85);
}

.header-song-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
}
.hdr-artist {
    color: var(--muted-foreground);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}
.hdr-sep {
    color: var(--border);
    flex-shrink: 0;
}
.hdr-name {
    color: var(--foreground);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
}
.header-idle {
    font-size: 13px;
    color: var(--muted-foreground);
    opacity: 0.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 360px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    width: 100px;
    justify-content: flex-end;
}
.win-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    opacity: 0.5;
}
.win-btn:hover {
    background: var(--accent);
    color: var(--foreground);
    opacity: 1;
}
.win-btn--close:hover {
    background: rgba(220, 60, 50, 0.55);
    color: #fff;
}
.is-player .win-btn {
    color: rgba(255, 255, 255, 0.35);
}
.is-player .win-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
}
.is-player .win-btn--close:hover {
    background: rgba(220, 60, 50, 0.55);
    color: #fff;
}

.hdr-text-enter-active,
.hdr-text-leave-active {
    transition:
        opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.hdr-text-enter-from {
    opacity: 0;
    transform: translateY(6px);
}
.hdr-text-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>
