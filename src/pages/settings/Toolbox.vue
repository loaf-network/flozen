<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft, Maximize, Minus, Plus } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "vue-sonner"

const router = useRouter()

const width = ref(800)
const height = ref(600)
const minWidth = 640
const minHeight = 480

const presets = [
    { label: "640 × 480", w: 640, h: 480 },
    { label: "800 × 600", w: 800, h: 600 },
    { label: "1024 × 768", w: 1024, h: 768 },
    { label: "1280 × 720", w: 1280, h: 720 },
    { label: "1366 × 768", w: 1366, h: 768 },
    { label: "1600 × 900", w: 1600, h: 900 },
    { label: "1920 × 1080", w: 1920, h: 1080 },
]

async function getCurrentSize() {
    try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window")
        const win = getCurrentWindow()
        const [size, scaleFactor] = await Promise.all([win.outerSize(), win.scaleFactor()])
        const logical = size.toLogical(scaleFactor)
        width.value = Math.round(logical.width)
        height.value = Math.round(logical.height)
    } catch {
        toast.error("获取窗口大小失败。")
    }
}

async function applySize() {
    try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window")
        const win = getCurrentWindow()
        const { LogicalSize } = await import("@tauri-apps/api/dpi")
        await win.setSize(new LogicalSize(width.value, height.value))
        toast.success(`窗口已调整为 ${width.value} × ${height.value}。`)
    } catch {
        toast.error("调整窗口大小失败。")
    }
}

async function applyPreset(preset: { w: number; h: number }) {
    width.value = preset.w
    height.value = preset.h
    await applySize()
}

function stepWidth(delta: number) {
    width.value = Math.max(minWidth, width.value + delta)
}

function stepHeight(delta: number) {
    height.value = Math.max(minHeight, height.value + delta)
}

onMounted(() => {
    getCurrentSize()
})
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-normal">工具箱</h1>
        </div>

        <p class="text-xs font-medium text-muted-foreground mb-2 px-1">窗口大小</p>
        <div class="rounded-xl border border-border p-4 space-y-4">
            <div class="flex items-center gap-4">
                <div class="flex-1">
                    <label class="text-xs text-muted-foreground mb-1 block">宽度</label>
                    <div class="flex items-center gap-2">
                        <Button variant="outline" size="icon-sm" @click="stepWidth(-10)">
                            <Minus :size="14" />
                        </Button>
                        <Input
                            v-model.number="width"
                            type="number"
                            :min="minWidth"
                            class="text-center"
                        />
                        <Button variant="outline" size="icon-sm" @click="stepWidth(10)">
                            <Plus :size="14" />
                        </Button>
                    </div>
                </div>
                <div class="flex-1">
                    <label class="text-xs text-muted-foreground mb-1 block">高度</label>
                    <div class="flex items-center gap-2">
                        <Button variant="outline" size="icon-sm" @click="stepHeight(-10)">
                            <Minus :size="14" />
                        </Button>
                        <Input
                            v-model.number="height"
                            type="number"
                            :min="minHeight"
                            class="text-center"
                        />
                        <Button variant="outline" size="icon-sm" @click="stepHeight(10)">
                            <Plus :size="14" />
                        </Button>
                    </div>
                </div>
            </div>
            <Button class="w-full" @click="applySize">
                <Maximize :size="16" class="mr-2" />
                应用大小
            </Button>
        </div>

        <p class="text-xs font-medium text-muted-foreground mt-6 mb-2 px-1">预设尺寸</p>
        <div class="grid grid-cols-2 gap-2">
            <button
                v-for="p in presets"
                :key="p.label"
                class="px-4 py-3 rounded-xl border border-border hover:bg-accent/40 transition-all text-sm text-left"
                @click="applyPreset(p)"
            >
                {{ p.label }}
            </button>
        </div>
    </div>
</template>
