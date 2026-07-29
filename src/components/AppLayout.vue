<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Music, Home, Settings, Search, ListMusic, Compass, Lock } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { loadConfig } from "@/lib/store"
import PlaylistSidebar from "@/components/PlaylistSidebar.vue"

const route = useRoute()
const router = useRouter()

const showPlaylistSidebar = computed(() => route.path.startsWith("/app/playlists"))

const isLoggedIn = ref(false)
const isNcmPage = computed(() => route.path === "/app/settings/ncm")

onMounted(async () => {
    const config = await loadConfig()
    isLoggedIn.value = !!config.ncmCookie
})

const nav = [
    { path: "/app", icon: Home, tip: "首页" },
    { path: "/app/discover", icon: Compass, tip: "发现" },
    { path: "/app/search", icon: Search, tip: "搜索" },
    { path: "/app/playlists", icon: ListMusic, tip: "歌单" },
    { path: "/app/settings", icon: Settings, tip: "设置" },
]

function isActive(path: string) {
    if (path === "/app") return route.path === "/app"
    return route.path.startsWith(path)
}
</script>

<template>
    <div class="flex h-full bg-background text-foreground flex-col">
        <div class="flex flex-1 min-h-0">
            <!-- 侧边栏 -->
            <aside
                class="w-14 flex flex-col items-center border-r border-border bg-background select-none"
            >
                <!-- Logo -->
                <div class="flex items-center justify-center h-14 w-full">
                    <div
                        class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-orange-500/80 flex items-center justify-center"
                    >
                        <Music :size="16" :stroke-width="2" class="text-primary-foreground" />
                    </div>
                </div>

                <!-- 导航 -->
                <nav class="flex flex-col items-center gap-1 flex-1 mt-1">
                    <button
                        v-for="item in nav"
                        :key="item.path"
                        :class="[
                            'w-10 h-10 flex items-center justify-center rounded-xl transition-colors',
                            isActive(item.path)
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                        ]"
                        :title="item.tip"
                        @click="router.push(item.path)"
                    >
                        <component :is="item.icon" :size="18" :stroke-width="1.8" />
                    </button>
                </nav>
            </aside>

            <!-- 歌单侧边栏 -->
            <PlaylistSidebar v-show="showPlaylistSidebar" />

            <!-- 主内容 -->
            <main class="flex-1 overflow-auto no-scrollbar min-w-0">
                <div
                    v-if="!isLoggedIn && !isNcmPage"
                    class="mx-6 mt-6 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15"
                >
                    <Lock :size="18" class="text-primary shrink-0" />
                    <span class="text-sm font-medium flex-1">登录网易云账号，解锁完整播放功能</span>
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-7 text-xs"
                        @click="router.push('/app/settings/ncm')"
                    >
                        去登录
                    </Button>
                </div>
                <router-view v-slot="{ Component, route: r }">
                    <Transition :name="(r.meta.transition as string) || 'fade'" mode="out-in">
                        <component :is="Component" :key="r.fullPath" />
                    </Transition>
                </router-view>
            </main>
        </div>
    </div>
</template>
