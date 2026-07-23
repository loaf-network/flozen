<script setup lang="ts">
import { useRouter } from "vue-router"
import { ArrowLeft, ExternalLink, Globe, Music, MessageSquare, Star } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const router = useRouter()
const version = "0.1.0"

const links = [
    { label: "官方网站", url: "https://flozen.loaf.network", icon: Globe },
    { label: "Loaf Network", url: "https://loaf.network", icon: Star },
    { label: "GitHub 仓库", url: "https://github.com/loaf-network/flozen", icon: ExternalLink },
    {
        label: "问题反馈",
        url: "https://github.com/loaf-network/flozen/issues",
        icon: MessageSquare,
    },
]
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-tight">关于</h1>
        </div>

        <Card class="flex flex-col items-center gap-3 p-8 mb-6">
            <Music :size="40" :stroke-width="1.2" class="text-muted-foreground" />
            <h2 class="text-lg font-bold tracking-tight">Flozen 音乐播放器</h2>
            <p class="text-xs text-muted-foreground">版本 {{ version }}</p>
        </Card>

        <div class="flex flex-col gap-2 mb-6">
            <a
                v-for="link in links"
                :key="link.label"
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
                <div
                    class="size-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"
                >
                    <component :is="link.icon" :size="18" class="text-muted-foreground" />
                </div>
                <span class="text-sm font-medium flex-1">{{ link.label }}</span>
                <ExternalLink :size="14" class="text-muted-foreground" />
            </a>
        </div>
    </div>
</template>
