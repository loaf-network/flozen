<script setup lang="ts">
import { computed, ref } from "vue"
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Repeat,
    Repeat1,
    Shuffle,
    Volume2,
    VolumeX,
    Heart,
    ListMusic,
} from "@lucide/vue"
import {
    player,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    formatTime,
} from "@/lib/player"

const bar = ref<HTMLDivElement>()
const pct = computed(() => (player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0))

function onSeek(e: MouseEvent) {
    if (!bar.value) return
    const r = bar.value.getBoundingClientRect()
    seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * player.duration)
}

const VolIcon = computed(() => (player.volume === 0 ? VolumeX : Volume2))
const RptIcon = computed(() => (player.repeatMode === "one" ? Repeat1 : Repeat))
</script>

<template>
    <div class="ctrls">
        <!-- Progress -->
        <div class="prog-row">
            <span class="time">{{ formatTime(player.currentTime) }}</span>
            <div ref="bar" class="prog-bar" @click="onSeek">
                <div class="prog-fill" :style="{ width: pct + '%' }" />
                <div class="prog-thumb" :style="{ left: pct + '%' }" />
            </div>
            <span class="time">{{ formatTime(player.duration) }}</span>
        </div>

        <!-- Buttons -->
        <div class="btn-row">
            <div class="btn-grp">
                <button :class="['btn', player.shuffle && 'btn--on']" @click="toggleShuffle">
                    <Shuffle :size="16" />
                </button>
                <button class="btn" @click="prev">
                    <SkipBack :size="18" fill="currentColor" />
                </button>
            </div>
            <button class="btn btn--play" @click="toggle">
                <Pause v-if="player.playing" :size="26" fill="currentColor" />
                <Play v-else :size="26" fill="currentColor" class="ml-0.5" />
            </button>
            <div class="btn-grp">
                <button class="btn" @click="next">
                    <SkipForward :size="18" fill="currentColor" />
                </button>
                <button
                    :class="['btn', player.repeatMode !== 'none' && 'btn--on']"
                    @click="toggleRepeat"
                >
                    <component :is="RptIcon" :size="16" />
                </button>
            </div>
            <div class="btn-grp btn-grp--right">
                <button class="btn"><Heart :size="16" /></button>
                <button class="btn"><ListMusic :size="16" /></button>
                <div class="vol-row">
                    <button class="btn" @click="setVolume(player.volume === 0 ? 0.7 : 0)">
                        <component :is="VolIcon" :size="16" />
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        :value="player.volume"
                        class="vol-slider"
                        @input="(e) => setVolume(parseFloat((e.target as HTMLInputElement).value))"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ctrls {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.prog-row {
    display: flex;
    align-items: center;
    gap: 12px;
}
.time {
    font-size: 10px;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.35);
    min-width: 32px;
}
.time:first-child {
    text-align: right;
}
.prog-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.1);
    position: relative;
    cursor: pointer;
}
.prog-bar:hover {
    height: 6px;
}
.prog-fill {
    height: 100%;
    border-radius: 2px;
    background: var(--primary);
    transition: width 0.1s linear;
}
.prog-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    opacity: 0;
    transition: opacity 0.15s;
}
.prog-bar:hover .prog-thumb {
    opacity: 1;
}

.btn-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.btn-grp {
    display: flex;
    align-items: center;
    gap: 2px;
}
.btn-grp--right {
    margin-left: auto;
}

.btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.btn:hover {
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.06);
}
.btn--on {
    color: var(--primary);
}
.btn--on:hover {
    color: var(--primary);
}

.btn--play {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
}
.btn--play:hover {
    background: rgba(255, 255, 255, 0.15);
}

.vol-row {
    display: flex;
    align-items: center;
    gap: 2px;
}
.vol-slider {
    width: 70px;
    height: 3px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
}
.vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
}
</style>
