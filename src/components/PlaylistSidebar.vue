<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Plus, Play, Music } from "@lucide/vue"
import { ncmUserPlaylist, ncmCreatePlaylist, type PlaylistSimple } from "@/lib/api"
import { loadConfig } from "@/lib/store"

const route = useRoute()
const router = useRouter()
const playlists = ref<PlaylistSimple[]>([])
const loading = ref(true)

const currentId = computed(() => {
    const id = route.params.id
    return id ? Number(id) : null
})

onMounted(async () => {
    const config = await loadConfig()
    if (config.ncmProfile && config.ncmCookie) {
        try {
            const res = await ncmUserPlaylist(config.ncmProfile.userId, config.ncmCookie)
            if (res.code === 200) playlists.value = res.playlist ?? []
        } catch {
            /* ignore */
        }
    }
    loading.value = false
})

function select(id: number) {
    router.push(`/app/playlists/${id}`)
}

async function create() {
    const config = await loadConfig()
    if (!config.ncmCookie) return
    try {
        await ncmCreatePlaylist(`新歌单 ${new Date().toLocaleDateString()}`, config.ncmCookie)
        const res = await ncmUserPlaylist(config.ncmProfile!.userId, config.ncmCookie)
        if (res.code === 200) playlists.value = res.playlist ?? []
    } catch {
        /* ignore */
    }
}
</script>

<template>
    <aside class="sidebar">
        <div class="sidebar-header">
            <span class="sidebar-title">我的歌单</span>
            <button class="sidebar-add" @click="create">
                <Plus :size="14" />
            </button>
        </div>
        <div v-if="loading" class="sidebar-loading">
            <div
                class="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"
            />
        </div>
        <div v-else class="sidebar-list">
            <button
                v-for="pl in playlists"
                :key="pl.id"
                :class="['sidebar-item', currentId === pl.id && 'sidebar-item--active']"
                @click="select(pl.id)"
            >
                <img
                    v-if="pl.coverImgUrl"
                    :src="`${pl.coverImgUrl}?param=80y80`"
                    class="sidebar-cover"
                    referrerpolicy="no-referrer"
                />
                <div v-else class="sidebar-cover sidebar-cover--empty">
                    <Music :size="14" />
                </div>
                <div class="sidebar-info">
                    <p class="sidebar-name">{{ pl.name }}</p>
                    <p class="sidebar-count">{{ pl.trackCount }} 首</p>
                </div>
            </button>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    width: 240px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--background);
    flex-shrink: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 12px;
}

.sidebar-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--foreground);
}

.sidebar-add {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: var(--muted);
    color: var(--muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}
.sidebar-add:hover {
    background: var(--accent);
    color: var(--accent-foreground);
}

.sidebar-loading {
    display: flex;
    justify-content: center;
    padding: 24px;
}

.sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 12px;
}

.sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 8px;
    border-radius: 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
}
.sidebar-item:hover {
    background: var(--accent);
}
.sidebar-item--active {
    background: var(--accent);
}
.sidebar-item--active .sidebar-name {
    color: var(--primary);
}

.sidebar-cover {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
}
.sidebar-cover--empty {
    background: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted-foreground);
}

.sidebar-info {
    flex: 1;
    min-width: 0;
}

.sidebar-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--foreground);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-count {
    font-size: 11px;
    color: var(--muted-foreground);
    margin-top: 1px;
}
</style>
