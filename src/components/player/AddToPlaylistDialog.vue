<script setup lang="ts">
import { ref, watch } from "vue"
import { Loader2, Plus, Music, ListPlus } from "@lucide/vue"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMyPlaylists, addSongToPlaylist, createPlaylistAndAdd } from "@/lib/ncmActions"
import type { PlaylistSimple, SearchSong } from "@/lib/api"

const props = defineProps<{ open: boolean; song: SearchSong | null }>()
const emit = defineEmits<{ "update:open": [v: boolean] }>()

const playlists = ref<PlaylistSimple[]>([])
const loading = ref(false)
const error = ref("")
const newName = ref("")
const creating = ref(false)

watch(
    () => props.open,
    async (v) => {
        if (!v) return
        loading.value = true
        error.value = ""
        newName.value = ""
        try {
            playlists.value = await getMyPlaylists()
        } catch {
            error.value = "请先登录网易云账号"
        } finally {
            loading.value = false
        }
    },
)

async function addTo(pid: number) {
    if (!props.song) return
    try {
        await addSongToPlaylist(pid, props.song.id)
        const { toast } = await import("vue-sonner")
        toast.success("已添加到歌单。")
        emit("update:open", false)
    } catch (e) {
        const msg = e instanceof Error ? e.message : ""
        const { toast } = await import("vue-sonner")
        if (msg === "not-logged-in") toast.error("请先登录网易云账号。")
        else if (msg && msg !== "add-failed") toast.error(`添加失败：${msg}。`)
        else toast.error("添加失败，请稍后重试。")
    }
}

async function createAndAdd() {
    const name = newName.value.trim()
    if (!name || !props.song) return
    creating.value = true
    try {
        await createPlaylistAndAdd(name, props.song.id)
        const { toast } = await import("vue-sonner")
        toast.success(`已创建歌单「${name}」并添加歌曲。`)
        emit("update:open", false)
    } catch (e) {
        const msg = e instanceof Error ? e.message : ""
        const { toast } = await import("vue-sonner")
        if (msg === "not-logged-in") toast.error("请先登录网易云账号。")
        else if (msg && msg !== "create-failed") toast.error(`创建失败：${msg}。`)
        else toast.error("创建失败，请稍后重试。")
    } finally {
        creating.value = false
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
        <DialogContent class="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle>加入歌单</DialogTitle>
                <DialogDescription class="truncate">
                    {{ song ? `将「${song.name}」添加到歌单` : "" }}
                </DialogDescription>
            </DialogHeader>

            <!-- 歌单列表 -->
            <div class="playlist-list max-h-64 overflow-y-auto flex flex-col gap-1 -mx-1 px-1">
                <div v-if="loading" class="flex items-center justify-center py-8">
                    <Loader2 :size="20" class="animate-spin text-muted-foreground" />
                </div>
                <p v-else-if="error" class="text-center text-sm text-muted-foreground py-6">
                    {{ error }}
                </p>
                <template v-else>
                    <p
                        v-if="!playlists.length"
                        class="text-center text-sm text-muted-foreground py-6"
                    >
                        暂无歌单，可在下方新建
                    </p>
                    <button
                        v-for="p in playlists"
                        :key="p.id"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
                        @click="addTo(p.id)"
                    >
                        <div class="size-9 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                                v-if="p.coverImgUrl"
                                :src="`${p.coverImgUrl}?param=80y80`"
                                referrerpolicy="no-referrer"
                                class="w-full h-full object-cover"
                            />
                            <Music v-else :size="16" class="m-auto mt-2.5 text-muted-foreground" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm truncate">{{ p.name }}</p>
                            <p class="text-xs text-muted-foreground">{{ p.trackCount }} 首</p>
                        </div>
                        <ListPlus :size="16" class="text-muted-foreground flex-shrink-0" />
                    </button>
                </template>
            </div>

            <!-- 新建歌单 -->
            <div class="flex items-center gap-2 pt-1">
                <Input
                    v-model="newName"
                    placeholder="新建歌单名称..."
                    class="h-9"
                    @keydown.enter="createAndAdd"
                />
                <Button
                    size="sm"
                    class="gap-1 flex-shrink-0"
                    :disabled="!newName.trim() || creating"
                    @click="createAndAdd"
                >
                    <Plus :size="14" />
                    新建
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
/* 歌单列表滚动条美化 */
.playlist-list::-webkit-scrollbar {
    width: 6px;
}
.playlist-list::-webkit-scrollbar-track {
    background: transparent;
}
.playlist-list::-webkit-scrollbar-thumb {
    background: color-mix(in oklch, var(--muted-foreground) 35%, transparent);
    border-radius: 999px;
}
.playlist-list::-webkit-scrollbar-thumb:hover {
    background: color-mix(in oklch, var(--muted-foreground) 55%, transparent);
}
</style>
