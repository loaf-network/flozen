<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft, Check, Moon, Sun, Monitor, Gpu, Waves } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "vue-sonner"
import { saveConfig, loadConfig } from "@/lib/store"
import { listGpus, getGpuPreference, setGpuPreference, type GpuInfo } from "@/lib/gpu"

const router = useRouter()
const STORAGE_KEY = "flozen-theme"
const mode = ref<"dark" | "light" | "auto">("dark")

const fluidBg = ref(true)

function onToggleFluid(checked: boolean) {
    fluidBg.value = checked
    saveConfig("fluidBg", checked)
}

const gpus = ref<GpuInfo[]>([])
const useDiscrete = ref(false)
const detecting = ref(true)
const discreteGpu = computed(() => gpus.value.find((g) => g.discrete))

async function onToggleDiscrete(checked: boolean) {
    if (checked && !discreteGpu.value) {
        useDiscrete.value = false
        toast.warning("未检测到独立显卡，将继续使用核显渲染")
        return
    }
    try {
        await setGpuPreference(checked ? 2 : 0)
        useDiscrete.value = checked
        toast.success(
            checked
                ? `已启用独显渲染（${discreteGpu.value!.name}），重启应用后生效`
                : "已恢复系统默认显卡调度，重启应用后生效",
        )
    } catch {
        toast.error("设置显卡偏好失败")
    }
}

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

    Promise.all([listGpus(), getGpuPreference()]).then(([list, pref]) => {
        gpus.value = list
        useDiscrete.value = pref === 2
        detecting.value = false
    })
    loadConfig().then((cfg) => {
        fluidBg.value = cfg.fluidBg
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
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-normal">外观</h1>
        </div>

        <p class="text-xs font-medium text-muted-foreground mb-2 px-1">主题</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
                v-for="t in themes"
                :key="t.id"
                :class="[
                    'relative flex flex-col items-start gap-3 px-4 py-4 text-left transition-all duration-200 rounded-xl border',
                    mode === t.id
                        ? 'bg-accent border-border'
                        : 'border-transparent hover:bg-accent/40',
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
                <div class="min-w-0">
                    <p class="text-sm font-medium leading-snug">{{ t.label }}</p>
                    <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ t.desc }}</p>
                </div>
                <div
                    v-if="mode === t.id"
                    class="absolute top-3 right-3 size-5 rounded-full bg-primary flex items-center justify-center"
                >
                    <Check :size="12" class="text-primary-foreground" :stroke-width="3" />
                </div>
            </button>
        </div>

        <p class="text-xs font-medium text-muted-foreground mt-6 mb-2 px-1">播放页</p>
        <div class="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border border-border">
            <div
                class="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0"
            >
                <Waves :size="18" />
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-snug">液体流动背景</p>
                <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    随封面取色的动态色团，关闭后播放页使用静态模糊背景，可降低显卡占用
                </p>
            </div>
            <Switch :model-value="fluidBg" @update:model-value="onToggleFluid" />
        </div>

        <template v-if="detecting || gpus.length">
            <p class="text-xs font-medium text-muted-foreground mt-6 mb-2 px-1">渲染</p>
            <div class="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border border-border">
                <div
                    class="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0"
                >
                    <Gpu :size="18" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium leading-snug">使用独立显卡渲染</p>
                    <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {{
                            detecting
                                ? "正在检测显卡..."
                                : discreteGpu
                                  ? `检测到 ${discreteGpu.name}，开启后重启应用生效`
                                  : "未检测到独立显卡，将使用核显渲染"
                        }}
                    </p>
                </div>
                <Switch
                    :model-value="useDiscrete"
                    :disabled="detecting"
                    @update:model-value="onToggleDiscrete"
                />
            </div>
        </template>
    </div>
</template>
