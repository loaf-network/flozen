<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Play, Pause, SkipBack, SkipForward } from "@lucide/vue"
import { player, toggle, next, prev } from "@/lib/player"

const route = useRoute()
const router = useRouter()

const visible = computed(() => player.currentSong && route.name !== "player")
const expanded = ref(false)
</script>

<template>
    <Transition name="capsule">
        <div
            v-if="visible"
            class="capsule"
            :class="{ 'is-expanded': expanded }"
            @mouseenter="expanded = true"
            @mouseleave="expanded = false"
        >
            <img
                v-if="player.currentSong?.al?.picUrl"
                :src="`${player.currentSong.al.picUrl}?param=80y80`"
                referrerpolicy="no-referrer"
                class="cover"
                @click="router.push('/player')"
            />
            <div class="info" @click="router.push('/player')">
                <p class="name">{{ player.currentSong?.name }}</p>
                <p class="artist">{{ player.currentSong?.ar?.map((a) => a.name).join(" · ") }}</p>
            </div>

            <div class="actions" @click.stop>
                <button class="act-btn" @click="prev">
                    <SkipBack :size="16" fill="currentColor" />
                </button>
                <button class="act-btn act-btn--play" @click="toggle">
                    <Pause v-if="player.playing" :size="18" fill="currentColor" />
                    <Play v-else :size="18" fill="currentColor" class="ml-0.5" />
                </button>
                <button class="act-btn" @click="next">
                    <SkipForward :size="16" fill="currentColor" />
                </button>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.capsule {
    position: fixed;
    bottom: 24px;
    left: 20px;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    user-select: none;
    min-width: 0;
    height: 52px;
}
.capsule.is-expanded {
}

.cover {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
}

/* ── 信息 ── */
.info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    overflow: hidden;
}
.name {
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.artist {
    font-size: 11px;
    color: var(--muted-foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── 按钮组：收起时宽度为0 ── */
.actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition:
        max-width 0.3s ease,
        opacity 0.25s ease,
        gap 0.3s ease;
}
.is-expanded .actions {
    max-width: 110px;
    opacity: 1;
    gap: 4px;
}

.act-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: all 0.15s;
    flex-shrink: 0;
}
.act-btn:hover {
    opacity: 1;
    background: var(--accent);
}
.act-btn--play {
    width: 34px;
    height: 34px;
    background: var(--primary);
    color: var(--primary-foreground);
    opacity: 1;
}
.act-btn--play:hover {
    background: var(--primary);
    color: var(--primary-foreground);
    filter: brightness(1.15);
}

/* ── 动画 ── */
.capsule-enter-active {
    transition:
        opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.capsule-leave-active {
    transition:
        opacity 0.2s ease-in,
        transform 0.2s ease-in;
}
.capsule-enter-from {
    opacity: 0;
    transform: translateX(-30px);
}
.capsule-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
