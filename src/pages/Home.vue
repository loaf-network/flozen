<script setup lang="ts">
import { useRouter } from "vue-router"
import { Search, Settings, Music } from "@lucide/vue"

const router = useRouter()
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold tracking-tight mb-1">👋 您好，欢迎使用 Flozen</h1>

        <!-- 快速操作 -->
        <div class="grid grid-cols-2 gap-3 mb-6">
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-colors text-left"
                @click="router.push('/app/settings')"
            >
                <div class="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <Search :size="18" class="text-muted-foreground" />
                </div>
                <div>
                    <p class="text-sm font-medium">搜索</p>
                    <p class="text-xs text-muted-foreground">发现音乐</p>
                </div>
            </button>
            <button
                class="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-colors text-left"
                @click="router.push('/app/settings')"
            >
                <div class="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <Settings :size="18" class="text-muted-foreground" />
                </div>
                <div>
                    <p class="text-sm font-medium">设置</p>
                    <p class="text-xs text-muted-foreground">个性化配置</p>
                </div>
            </button>
        </div>

        <!-- 最近播放 -->
        <p class="text-xs font-medium text-muted-foreground mb-2">最近播放</p>
        <div
            class="flex items-center justify-center py-8 rounded-xl border border-dashed border-border text-muted-foreground"
        >
            <div class="flex flex-col items-center gap-2">
                <Music :size="24" :stroke-width="1" />
                <p class="text-xs">暂无播放记录</p>
            </div>
        </div>
    </div>
</template>
