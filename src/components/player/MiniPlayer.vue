<script setup lang="ts">
import { useRouter } from "vue-router"
import { Play, Pause, SkipForward } from "@lucide/vue"
import { player, toggle, next } from "@/lib/player"

const router = useRouter()
</script>

<template>
    <Transition name="mini">
        <div v-if="player.currentSong" class="mini" @click="router.push('/player')">
            <div class="mini-bar">
                <div
                    class="mini-bar-fill"
                    :style="{
                        width:
                            player.duration > 0
                                ? (player.currentTime / player.duration) * 100 + '%'
                                : '0%',
                    }"
                />
            </div>
            <div class="mini-inner">
                <img
                    v-if="player.currentSong?.al?.picUrl"
                    :src="`${player.currentSong.al.picUrl}?param=80y80`"
                    referrerpolicy="no-referrer"
                    class="mini-cover"
                    :class="{ spin: player.playing }"
                />
                <div class="mini-info">
                    <p class="mini-name">{{ player.currentSong?.name }}</p>
                    <p class="mini-artist">
                        {{ player.currentSong?.ar?.map((a) => a.name).join(" / ") }}
                    </p>
                </div>
                <div class="mini-actions" @click.stop>
                    <button class="mini-btn" @click="toggle">
                        <Pause v-if="player.playing" :size="22" fill="currentColor" />
                        <Play v-else :size="22" fill="currentColor" class="ml-0.5" />
                    </button>
                    <button class="mini-btn" @click="next">
                        <SkipForward :size="20" fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.mini {
    border-top: 1px solid var(--border);
    background: var(--card);
    position: relative;
    user-select: none;
}

.mini-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--border);
}
.mini-bar-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s linear;
}

.mini-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    height: 48px;
    cursor: pointer;
}

.mini-cover {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
}
.mini-cover.spin {
    animation: spin 8s linear infinite;
}

.mini-info {
    flex: 1;
    min-width: 0;
}
.mini-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.mini-artist {
    font-size: 11px;
    color: var(--muted-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
}

.mini-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.mini-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--foreground);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: all 0.15s;
}
.mini-btn:hover {
    opacity: 1;
    background: var(--accent);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.mini-enter-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.mini-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.mini-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.mini-leave-to {
    opacity: 0;
    transform: translateY(8px);
}
</style>
