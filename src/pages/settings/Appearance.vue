<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft, Check, Moon, Sun, Monitor } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { saveConfig } from "@/lib/store"

const router = useRouter()
const STORAGE_KEY = "flozen-theme"
const mode = ref<"dark" | "light" | "auto">("dark")

function applyTheme(m: "dark" | "light" | "auto") {
    const isDark =
        m === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : m === "dark"
    document.documentElement.classList.toggle("dark", isDark)
}

function setMode(m: "dark" | "light" | "auto") {
    mode.value = m
    localStorage.setItem(STORAGE_KEY, m)
    applyTheme(m)
    saveConfig("theme", m)
}

onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "dark" | "light" | "auto" | null
    mode.value = stored ?? "auto"
    applyTheme(mode.value)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", () => {
        if (mode.value === "auto") applyTheme("auto")
    })
})

const themes = [
    { id: "dark" as const, label: "深色", desc: "降低眼疲劳，适合暗光环境", icon: Moon },
    { id: "light" as const, label: "浅色", desc: "清晰明亮，适合日常使用", icon: Sun },
    { id: "auto" as const, label: "跟随系统", desc: "根据系统设置自动切换", icon: Monitor },
]
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-2xl font-semibold tracking-tight">外观</h1>
        </div>

        <p class="text-xs font-medium text-muted-foreground mb-3 px-1">主题</p>
        <Card class="py-0 gap-0 overflow-hidden">
            <button
                v-for="t in themes"
                :key="t.id"
                :class="[
                    'flex items-center gap-4 w-full px-4 py-3.5 text-left transition-all duration-200',
                    mode === t.id ? 'bg-accent/60' : 'hover:bg-accent/30',
                ]"
                @click="setMode(t.id)"
            >
                <div
                    :class="[
                        'size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
                        mode === t.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                    ]"
                >
                    <component :is="t.icon" :size="18" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium leading-snug">{{ t.label }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ t.desc }}</p>
                </div>
                <div
                    v-if="mode === t.id"
                    class="size-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                    <Check :size="12" class="text-primary-foreground" :stroke-width="3" />
                </div>
            </button>
        </Card>
    </div>
</template>
