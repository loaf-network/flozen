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
        <h1 class="text-xl font-bold tracking-normal mb-6">设置</h1>
        <div class="flex flex-col gap-4">
            <button
                v-for="(item, idx) in items"
                :key="item.label"
                class="flex items-center gap-4 p-4 rounded-2xl border border-border/60 hover:bg-accent/30 hover:border-border transition-all text-left w-full"
                @click="router.push(item.path)"
            >
                <div
                    :class="[
                        'size-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        idx === 0
                            ? 'bg-blue-500/10 text-blue-500'
                            : idx === 1
                              ? 'bg-red-500/10 text-red-500'
                              : idx === 2
                                ? 'bg-purple-500/10 text-purple-500'
                                : idx === 3
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-muted text-muted-foreground',
                    ]"
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
