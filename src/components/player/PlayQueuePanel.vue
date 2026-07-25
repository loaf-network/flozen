<script setup lang="ts">
import { ref } from "vue"
import { X, Trash2, GripVertical, Music } from "@lucide/vue"
import {
    player,
    playFromQueue,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    formatTime,
} from "@/lib/player"

defineProps<{ open: boolean }>()
const emit = defineEmits<{ "update:open": [v: boolean] }>()

const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)

function onDragStart(i: number) {
    dragFrom.value = i
}
function onDragOver(e: DragEvent, i: number) {
    e.preventDefault()
    dragOver.value = i
}
function onDrop(i: number) {
    if (dragFrom.value !== null && dragFrom.value !== i) {
        moveQueueItem(dragFrom.value, i)
    }
    dragFrom.value = null
    dragOver.value = null
}
function onDragEnd() {
    dragFrom.value = null
    dragOver.value = null
}
function close() {
    emit("update:open", false)
}
</script>

<template>
    <Teleport to="body">
        <Transition name="queue">
            <div v-if="open" class="queue-overlay" @click="close">
                <div class="queue-panel" @click.stop>
                    <header class="queue-header">
                        <div>
                            <h3 class="queue-title">播放列表</h3>
                            <p class="queue-count">{{ player.queue.length }} 首</p>
                        </div>
                        <div class="header-actions">
                            <button
                                class="header-btn"
                                :disabled="!player.queue.length"
                                @click="clearQueue"
                            >
                                <Trash2 :size="15" />
                                <span>清空</span>
                            </button>
                            <button class="header-btn icon-only" @click="close">
                                <X :size="18" />
                            </button>
                        </div>
                    </header>

                    <div class="queue-list">
                        <div v-if="!player.queue.length" class="empty">
                            <Music :size="40" :stroke-width="1" />
                            <p>播放列表为空</p>
                        </div>
                        <div
                            v-for="(song, i) in player.queue"
                            :key="song.id"
                            :class="[
                                'queue-item',
                                i === player.queueIndex && 'queue-item--active',
                                dragOver === i && dragFrom !== i && 'queue-item--drag',
                            ]"
                            draggable="true"
                            @dragstart="onDragStart(i)"
                            @dragover="onDragOver($event, i)"
                            @drop="onDrop(i)"
                            @dragend="onDragEnd"
                            @click="playFromQueue(i)"
                        >
                            <GripVertical :size="14" class="grip" />
                            <img
                                :src="`${song.al.picUrl}?param=80y80`"
                                referrerpolicy="no-referrer"
                                class="cover"
                            />
                            <div class="meta">
                                <p class="name">{{ song.name }}</p>
                                <p class="artist">
                                    {{ song.ar.map((a) => a.name).join(" / ") }}
                                </p>
                            </div>
                            <span class="dur">{{ formatTime(song.dt / 1000) }}</span>
                            <button class="rm" title="移除" @click.stop="removeFromQueue(i)">
                                <X :size="14" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.queue-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    justify-content: flex-end;
}
.queue-panel {
    width: 380px;
    max-width: 90vw;
    height: 100%;
    background: var(--card);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.25);
}

.queue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}
.queue-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--foreground);
}
.queue-count {
    font-size: 12px;
    color: var(--muted-foreground);
    margin-top: 2px;
}
.header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}
.header-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 10px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--muted-foreground);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
}
.header-btn:hover:not(:disabled) {
    background: var(--accent);
    color: var(--accent-foreground);
}
.header-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.header-btn.icon-only {
    padding: 0;
    width: 30px;
    justify-content: center;
}

.queue-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    color: var(--muted-foreground);
    font-size: 13px;
}

.queue-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s;
    user-select: none;
}
.queue-item:hover {
    background: var(--accent);
}
.queue-item--active {
    background: color-mix(in oklch, var(--primary) 12%, transparent);
}
.queue-item--active .name {
    color: var(--primary);
}
.queue-item--drag {
    box-shadow: inset 0 2px 0 var(--primary);
}
.grip {
    color: var(--muted-foreground);
    opacity: 0.4;
    flex-shrink: 0;
    cursor: grab;
}
.queue-item:hover .grip {
    opacity: 0.8;
}
.cover {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
}
.meta {
    flex: 1;
    min-width: 0;
}
.name {
    font-size: 13px;
    font-weight: 500;
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
    margin-top: 1px;
}
.dur {
    font-size: 11px;
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
}
.rm {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.15s;
    flex-shrink: 0;
}
.queue-item:hover .rm {
    opacity: 0.7;
}
.rm:hover {
    opacity: 1 !important;
    background: var(--accent-foreground);
    color: var(--accent);
}

/* ── 过渡：遮罩 fade + 面板 slide ── */
.queue-enter-active {
    transition: opacity 0.25s ease;
}
.queue-enter-active .queue-panel {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.queue-leave-active {
    transition: opacity 0.2s ease;
}
.queue-leave-active .queue-panel {
    transition: transform 0.22s ease-in;
}
.queue-enter-from,
.queue-leave-to {
    opacity: 0;
}
.queue-enter-from .queue-panel,
.queue-leave-to .queue-panel {
    transform: translateX(100%);
}
</style>
