<script setup lang="ts">
import { ref, onMounted } from "vue"
import { Music, ChevronDown, Globe, Headphones, ListMusic, Radio, Check, Moon, Sun, Monitor } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

/* ─── 主题 ─── */
const STORAGE_KEY = "flozen-theme"
const mode = ref<"dark" | "light" | "auto">("dark")

function applyTheme(m: "dark" | "light" | "auto") {
  const isDark = m === "auto"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : m === "dark"
  document.documentElement.classList.toggle("dark", isDark)
}

function setMode(m: "dark" | "light" | "auto") {
  mode.value = m
  localStorage.setItem(STORAGE_KEY, m)
  applyTheme(m)
}

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY) as "dark" | "light" | "auto" | null
  const initial = stored ?? "auto"
  mode.value = initial
  if (initial !== "auto") applyTheme(initial)
  else applyTheme("auto")
})

/* ─── 状态 ─── */
const selectedPlatforms = ref<string[]>([])
const privacyAgreed = ref(false)
const clarityAgreed = ref(false)

const platforms = [
    { id: "netease", name: "网易云音乐", desc: "海量曲库与精准推荐", icon: Headphones },
    { id: "kugou", name: "酷狗音乐", desc: "高品质音频与歌词", icon: Radio },
    { id: "qq", name: "QQ 音乐", desc: "正版音乐与社交分享", icon: Music },
    { id: "spotify", name: "Spotify", desc: "全球音乐与个性化歌单", icon: Globe },
]

const themes = [
    { id: "dark" as const, label: "深色", icon: Moon },
    { id: "light" as const, label: "浅色", icon: Sun },
    { id: "auto" as const, label: "跟随系统", icon: Monitor },
]

/* ─── 方法 ─── */
function togglePlatform(id: string) {
    const idx = selectedPlatforms.value.indexOf(id)
    if (idx > -1) selectedPlatforms.value.splice(idx, 1)
    else selectedPlatforms.value.push(id)
}

function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

function startApp() {
    if (!privacyAgreed.value) return
    console.log("启动", { platforms: selectedPlatforms.value, theme: mode.value, clarity: clarityAgreed.value })
}
</script>

<template>
    <div class="landing">
        <!-- ═══ Section 1: 介绍 ═══ -->
        <section class="panel" id="intro">
            <div class="flex flex-col items-center gap-6 text-center">
                <Music :size="48" :stroke-width="1.2" class="text-muted-foreground" />
                <h1 class="text-4xl font-bold tracking-tight">Flozen</h1>
                <p class="text-muted-foreground">一款精心打造的跨平台音乐播放器</p>
                <Separator class="w-10" />
                <div class="flex gap-6">
                    <Badge variant="secondary" class="gap-1.5 py-1.5 px-3">
                        <Globe :size="14" /> 跨平台支持
                    </Badge>
                    <Badge variant="secondary" class="gap-1.5 py-1.5 px-3">
                        <Headphones :size="14" /> 多平台整合
                    </Badge>
                    <Badge variant="secondary" class="gap-1.5 py-1.5 px-3">
                        <ListMusic :size="14" /> 歌单管理
                    </Badge>
                </div>
            </div>
            <div class="absolute bottom-8 flex flex-col items-center gap-1 text-muted-foreground cursor-pointer"
                @click="scrollTo('platform')">
                <ChevronDown :size="18" class="animate-bounce" />
                <span class="text-xs">向下滚动</span>
            </div>
        </section>

        <!-- ═══ Section 2: 平台 + 登录 ═══ -->
        <section class="panel" id="platform">
            <Card class="w-full max-w-lg bg-card/50 border-border/50">
                <CardHeader class="text-center">
                    <CardTitle>选择音乐平台并登录</CardTitle>
                    <CardDescription>选择你要使用的音乐服务，登录后可同步歌单和偏好设置</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-3">
                    <div class="grid grid-cols-2 gap-2">
                        <Button v-for="p in platforms" :key="p.id" variant="outline"
                            :class="['justify-start gap-3 h-auto py-3', selectedPlatforms.includes(p.id) && 'border-primary bg-primary/5']"
                            :disabled="p.id !== 'netease'"
                            @click="togglePlatform(p.id)">
                            <component :is="p.icon" :size="18"
                                :class="selectedPlatforms.includes(p.id) ? 'text-primary' : 'text-muted-foreground'" />
                            <div class="flex flex-col items-start gap-0.5">
                                <span class="text-sm font-medium">{{ p.name }}</span>
                                <span class="text-xs text-muted-foreground">{{ p.desc }}</span>
                            </div>
                            <Check v-if="selectedPlatforms.includes(p.id)" :size="14" class="ml-auto text-primary" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" class="mt-2 w-full"
                        :disabled="!selectedPlatforms.includes('netease')">
                        登录已选平台
                    </Button>
                </CardContent>
            </Card>
            <div class="absolute bottom-8 flex flex-col items-center gap-1 text-muted-foreground cursor-pointer"
                @click="scrollTo('theme')">
                <ChevronDown :size="18" class="animate-bounce" />
                <span class="text-xs">向下滚动</span>
            </div>
        </section>

        <!-- ═══ Section 3: 主题 ═══ -->
        <section class="panel" id="theme">
            <Card class="w-full max-w-lg bg-card/50 border-border/50">
                <CardHeader class="text-center">
                    <CardTitle>选择主题</CardTitle>
                    <CardDescription>选择你喜欢的视觉风格</CardDescription>
                </CardHeader>
                <CardContent class="flex gap-3">
                    <Button v-for="t in themes" :key="t.id" variant="outline"
                        :class="['flex-1 justify-start gap-3 h-auto py-4', mode === t.id && 'border-primary bg-primary/5']"
                        @click="setMode(t.id)">
                        <component :is="t.icon" :size="18"
                            :class="mode === t.id ? 'text-primary' : 'text-muted-foreground'" />
                        <span class="text-sm font-medium">{{ t.label }}</span>
                        <Check v-if="mode === t.id" :size="14" class="ml-auto text-primary" />
                    </Button>
                </CardContent>
            </Card>
            <div class="absolute bottom-8 flex flex-col items-center gap-1 text-muted-foreground cursor-pointer"
                @click="scrollTo('privacy')">
                <ChevronDown :size="18" class="animate-bounce" />
                <span class="text-xs">向下滚动</span>
            </div>
        </section>

        <!-- ═══ Section 4: 隐私 ═══ -->
        <section class="panel" id="privacy">
            <Card class="w-full max-w-lg bg-card/50 border-border/50">
                <CardHeader class="text-center">
                    <CardTitle>隐私与数据</CardTitle>
                    <CardDescription>请阅读以下条款并做出你的选择</CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-0">
                    <Label class="flex items-start gap-3 cursor-pointer py-3">
                        <Checkbox :model-value="privacyAgreed"
                            @update:model-value="(v: boolean | 'indeterminate') => privacyAgreed = v === true"
                            class="mt-0.5" />
                        <div class="flex flex-col gap-1">
                            <span class="text-sm font-medium">同意隐私政策</span>
                            <span class="text-xs text-muted-foreground leading-relaxed">已阅读并同意《Loaf Network
                                隐私政策》与《Flozen 免责声明》</span>
                        </div>
                    </Label>
                    <Separator />
                    <Label class="flex items-start gap-3 cursor-pointer py-3">
                        <Checkbox :model-value="clarityAgreed"
                            @update:model-value="(v: boolean | 'indeterminate') => clarityAgreed = v === true"
                            class="mt-0.5" />
                        <div class="flex flex-col gap-1">
                            <span class="text-sm font-medium">Microsoft Clarity 使用分析</span>
                            <span class="text-xs text-muted-foreground leading-relaxed">匿名收集页面浏览与交互数据，用于改善产品体验</span>
                        </div>
                    </Label>
                </CardContent>
            </Card>
            <Button size="lg" class="mt-6" :disabled="!privacyAgreed" @click="startApp">
                开始使用 Flozen
            </Button>
        </section>
    </div>
</template>

<style scoped>
.landing {
    width: 100vw;
    height: 100vh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
}

.landing::-webkit-scrollbar {
    display: none;
}

.panel {
    width: 100vw;
    height: 100vh;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 40px;
}
</style>
