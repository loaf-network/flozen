<script setup lang="ts">
import { useRouter } from "vue-router"
import { ChevronLeft } from "@lucide/vue"
import { player } from "@/lib/player"
import LyricsPanel from "@/components/player/LyricsPanel.vue"
import PlayerControls from "@/components/player/PlayerControls.vue"

const router = useRouter()
</script>

<template>
    <div class="player-page">
        <div
            class="player-bg"
            :style="{
                backgroundImage: player.currentSong?.al?.picUrl
                    ? `url(${player.currentSong.al.picUrl}?param=800y800)`
                    : undefined,
            }"
        />
        <div class="player-overlay" />

        <button class="back-btn" @click="router.back()">
            <ChevronLeft :size="20" />
        </button>

        <div class="player-body">
            <div class="player-left">
                <LyricsPanel />
            </div>
            <div class="player-right">
                <div v-if="player.currentSong?.al?.picUrl" class="cover-wrap">
                    <div class="cover-ring" :class="{ spin: player.playing }">
                        <img
                            :src="`${player.currentSong.al.picUrl}?param=600y600`"
                            :alt="player.currentSong.name"
                            referrerpolicy="no-referrer"
                            class="cover-img"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="player-controls">
            <PlayerControls />
        </div>
    </div>
</template>

<style scoped>
.player-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.player-bg {
    position: absolute;
    inset: -40px;
    background-size: cover;
    background-position: center;
    filter: blur(80px) brightness(0.25);
    transform: scale(1.1);
}

.player-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 7, 6, 0.45);
}

.back-btn {
    position: absolute;
    top: 12px;
    left: 16px;
    z-index: 3;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.back-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
}

.player-body {
    flex: 1;
    position: relative;
    z-index: 1;
    display: flex;
    min-height: 0;
}

.player-left {
    width: 48%;
    min-width: 0;
}

.player-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.cover-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
}

.cover-ring {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
        0 0 60px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.04);
}
.cover-ring.spin {
    animation: spin 20s linear infinite;
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.player-controls {
    position: relative;
    z-index: 2;
    padding: 12px 32px 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
