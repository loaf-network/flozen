<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Plus, Music, RefreshCw } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ncmUserPlaylist, ncmCreatePlaylist, type PlaylistSimple } from "@/lib/api"
import { loadConfig } from "@/lib/store"
import { getCachedList, setCachedList } from "@/lib/playlistCache"
import { toast } from "vue-sonner"

const route = useRoute()
const router = useRouter()
const playlists = ref<PlaylistSimple[]>([])
const loading = ref(true)

const currentId = computed(() => {
    const id = route.params.id
    return id ? Number(id) : null
})

async function fetchPlaylists(force = false) {
    loading.value = true
    const config = await loadConfig()
    if (config.ncmProfile && config.ncmCookie) {
        const userId = config.ncmProfile.userId
        if (!force) {
            const cached = getCachedList(userId)
            if (cached) {
                playlists.value = cached
                loading.value = false
                return
            }
        }
        try {
            const res = await ncmUserPlaylist(userId, config.ncmCookie)
            if (res.code === 200) {
                playlists.value = res.playlist ?? []
                setCachedList(userId, playlists.value)
            }
        } catch {
            /* ignore */
        }
    }
    loading.value = false
}

onMounted(() => fetchPlaylists())

async function requireLogin() {
    if (playlists.value.length > 0) return true
    const config = await loadConfig()
    if (config.ncmCookie) return true
    toast.error("请先登录网易云账号。")
    return false
}

function select(id: number) {
    router.push(`/app/playlists/${id}`)
}

// ── 新建歌单 Dialog ──
const showCreate = ref(false)
const newName = ref("")
const isPrivate = ref(false)
const creating = ref(false)

async function doCreate() {
    if (!newName.value.trim()) return
    if (!(await requireLogin())) return
    creating.value = true
    const config = await loadConfig()
    try {
        await ncmCreatePlaylist(
            newName.value.trim(),
            isPrivate.value ? "10" : undefined,
            config.ncmCookie,
        )
        showCreate.value = false
        newName.value = ""
        isPrivate.value = false
        await fetchPlaylists(true)
    } catch {
        /* ignore */
    }
    creating.value = false
}
</script>

<template>
    <aside class="sidebar">
        <div class="sidebar-header">
            <span class="sidebar-title">我的歌单</span>
            <div class="flex items-center gap-1">
                <button
                    class="sidebar-action"
                    @click="
                        requireLogin().then((ok) => {
                            if (ok) fetchPlaylists(true)
                        })
                    "
                >
                    <RefreshCw :size="14" :class="loading && 'animate-spin'" />
                </button>
                <button
                    class="sidebar-action"
                    @click="
                        requireLogin().then((ok) => {
                            if (ok) showCreate = true
                        })
                    "
                >
                    <Plus :size="14" />
                </button>
            </div>
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

        <!-- 新建歌单 Dialog -->
        <Dialog :open="showCreate" @update:open="showCreate = $event">
            <DialogContent class="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>新建歌单</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col gap-4 py-4">
                    <div class="flex flex-col gap-2">
                        <Label for="pl-name">歌单名称</Label>
                        <Input
                            id="pl-name"
                            v-model="newName"
                            placeholder="输入歌单名称"
                            @keydown.enter="doCreate"
                        />
                    </div>
                    <div class="flex items-center justify-between">
                        <Label for="pl-private" class="cursor-pointer">设为隐私歌单</Label>
                        <Switch id="pl-private" v-model="isPrivate" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="showCreate = false">取消</Button>
                    <Button :disabled="!newName.trim() || creating" @click="doCreate">
                        {{ creating ? "创建中..." : "创建" }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

.sidebar-action {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.sidebar-action:hover {
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
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 8px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
}
.sidebar-item:hover {
    background: var(--accent);
    border-color: var(--border);
}
.sidebar-item--active {
    background: var(--accent);
    border-color: var(--border);
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
