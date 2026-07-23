<script setup lang="ts">
import { useRouter } from "vue-router"
import { ArrowRight, User, Headphones, Palette, Shield, Info } from "@lucide/vue"

const router = useRouter()

const items = [
    {
        icon: User,
        label: "Loaf Network 账号",
        desc: "管理你的 Loaf Network 账号",
        path: "/app/settings/loaf",
    },
    {
        icon: Headphones,
        label: "第三方平台账号",
        desc: "管理已连接的音乐平台账号",
        path: "/app/settings/ncm",
    },
    {
        icon: Palette,
        label: "外观",
        desc: "主题、语言与界面风格",
        path: "/app/settings/appearance",
    },
    {
        icon: Shield,
        label: "隐私",
        desc: "信息收集、数据共享相关设置",
        path: "/app/settings/privacy",
    },
    { icon: Info, label: "关于", desc: "版本信息与开源许可", path: "/app/settings/about" },
]
</script>

<template>
    <div class="p-6">
        <h1 class="text-xl font-bold tracking-tight mb-6">设置</h1>
        <div class="flex flex-col gap-3">
            <button
                v-for="item in items"
                :key="item.label"
                class="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors text-left w-full"
                @click="router.push(item.path)"
            >
                <div
                    class="size-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"
                >
                    <component :is="item.icon" :size="20" class="text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">{{ item.label }}</p>
                    <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
                </div>
                <ArrowRight :size="16" class="text-muted-foreground/50 flex-shrink-0" />
            </button>
        </div>
    </div>
</template>
