<script setup lang="ts">
import { useRouter } from "vue-router"
import { Search, Settings, Music } from "@lucide/vue"

const router = useRouter()
</script>

<template>
    <div class="p-6">
        <h1 class="text-3xl font-bold tracking-normal mb-6">👋 你好，欢迎使用 Flozen</h1>

        <!-- 快速操作 -->
        <div class="grid grid-cols-2 gap-3 mb-6">
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 hover:border-primary/15 border border-transparent transition-colors text-left"
                @click="router.push('/app/search')"
            >
                <div class="size-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Search :size="18" class="text-primary" />
                </div>
                <div>
                    <p class="text-sm font-medium">搜索</p>
                    <p class="text-xs text-muted-foreground">发现音乐</p>
                </div>
            </button>
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-primary/5 hover:border-primary/15 border border-transparent transition-colors text-left"
                @click="router.push('/app/settings')"
            >
                <div class="size-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Settings :size="18" class="text-primary" />
                </div>
                <div>
                    <p class="text-sm font-medium">设置</p>
                    <p class="text-xs text-muted-foreground">个性化配置</p>
                </div>
            </button>
        </div>

        <!-- 最近播放 -->
        <p class="text-xs font-medium text-muted-foreground mb-3">最近播放</p>
        <div
            class="flex items-center justify-center py-10 rounded-2xl border border-solid border-border/40 text-muted-foreground"
        >
            <div class="flex flex-col items-center gap-2">
                <Music :size="24" :stroke-width="1" />
                <p class="text-xs">暂无播放记录</p>
            </div>
        </div>
    </div>
</template>
