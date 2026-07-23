<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Music, ChevronDown, Moon, Sun, Monitor } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { saveConfig } from "@/lib/store"

const router = useRouter()

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
  applyTheme(initial)
})

/* ─── 状态 ─── */
const privacyAgreed = ref(false)
const clarityAgreed = ref(false)

const themes = [
  { id: "dark" as const, label: "深色", icon: Moon },
  { id: "light" as const, label: "浅色", icon: Sun },
  { id: "auto" as const, label: "跟随系统", icon: Monitor },
]

/* ─── 方法 ─── */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

async function startApp() {
  if (!privacyAgreed.value) return
  await saveConfig("onboarded", true)
  await saveConfig("theme", mode.value)
  await saveConfig("clarity", clarityAgreed.value)
  router.replace("/app")
}
</script>

<template>
  <div class="landing">
    <!-- ═══ Section 1: 介绍 ═══ -->
    <section class="panel" id="intro">
      <div class="flex flex-col items-center gap-8 text-center">
        <!-- Logo -->
        <div class="logo-glow">
          <div class="logo-ring">
            <Music :size="36" :stroke-width="1.2" class="text-foreground" />
          </div>
        </div>

        <!-- 标题 -->
        <div class="flex flex-col items-center gap-3">
          <h1 class="text-7xl font-bold tracking-tighter text-foreground">Flozen</h1>
          <p class="text-lg text-muted-foreground tracking-wide">精心打造的跨平台音乐播放器</p>
        </div>

        <Separator class="w-12 bg-border/60" />

        <!-- 特性标签 -->
        <div class="flex gap-2.5 flex-wrap justify-center">
          <Badge variant="secondary" class="badge-feature">跨平台支持</Badge>
          <Badge variant="secondary" class="badge-feature">多平台整合</Badge>
          <Badge variant="secondary" class="badge-feature">歌单管理</Badge>
          <Badge variant="secondary" class="badge-feature">高品质音频</Badge>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="scroll-hint" @click="scrollTo('theme')">
        <ChevronDown :size="16" class="animate-bounce" />
        <span class="text-[11px] tracking-widest uppercase text-muted-foreground/60">向下滚动</span>
      </div>
    </section>

    <!-- ═══ Section 2: 主题 ═══ -->
    <section class="panel" id="theme">
      <div class="flex flex-col items-center gap-10 w-full max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-foreground">选择主题</h2>
          <p class="text-sm text-muted-foreground mt-2">选择你喜欢的视觉风格</p>
        </div>

        <div class="flex flex-col gap-3 w-full">
          <button
            v-for="t in themes" :key="t.id"
            class="theme-card"
            :class="{ 'theme-card--active': mode === t.id }"
            @click="setMode(t.id)"
          >
            <component :is="t.icon" :size="18" :class="mode === t.id ? 'text-primary' : 'text-muted-foreground'" />
            <span class="text-sm font-medium">{{ t.label }}</span>
          </button>
        </div>
      </div>

      <div class="scroll-hint" @click="scrollTo('privacy')">
        <ChevronDown :size="16" class="animate-bounce" />
        <span class="text-[11px] tracking-widest uppercase text-muted-foreground/60">向下滚动</span>
      </div>
    </section>

    <!-- ═══ Section 3: 隐私 ═══ -->
    <section class="panel" id="privacy">
      <div class="flex flex-col items-center gap-8 w-full max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold tracking-tight text-foreground">隐私与数据</h2>
          <p class="text-sm text-muted-foreground mt-2">请阅读以下条款并做出你的选择</p>
        </div>

        <Card class="w-full bg-card/40 border-border/40">
          <CardContent class="p-0">
            <Label class="privacy-item cursor-pointer">
              <Checkbox
                :model-value="privacyAgreed"
                @update:model-value="(v: boolean | 'indeterminate') => privacyAgreed = v === true"
              />
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">同意隐私政策</span>
                <span class="text-xs text-muted-foreground leading-relaxed">已阅读并同意《Loaf Network 隐私政策》与《Flozen 免责声明》</span>
              </div>
            </Label>
            <Separator />
            <Label class="privacy-item cursor-pointer">
              <Checkbox
                :model-value="clarityAgreed"
                @update:model-value="(v: boolean | 'indeterminate') => clarityAgreed = v === true"
              />
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">Microsoft Clarity 使用分析</span>
                <span class="text-xs text-muted-foreground leading-relaxed">匿名收集页面浏览与交互数据，用于改善产品体验</span>
              </div>
            </Label>
          </CardContent>
        </Card>

        <Button size="lg" class="w-full h-12 text-sm font-medium" :disabled="!privacyAgreed" @click="startApp">
          Flozen，启动！
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  width: 100vw;
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background: #0a0a0a;
}
.landing::-webkit-scrollbar { display: none; }

.panel {
  width: 100vw;
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 48px;
}

/* ─── Logo ─── */
.logo-glow {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-glow::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
}
.logo-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
}

/* ─── Badge ─── */
.badge-feature {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.06);
  color: var(--muted-foreground);
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 9999px;
  transition: background 0.2s;
}
.badge-feature:hover {
  background: rgba(255,255,255,0.08);
}

/* ─── Theme Card ─── */
.theme-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}
.theme-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
}
.theme-card--active {
  background: rgba(255,255,255,0.06);
  border-color: var(--primary);
  color: var(--foreground);
  box-shadow: 0 0 0 1px var(--primary), 0 0 20px -4px var(--primary);
}
.theme-card--active:hover {
  background: rgba(255,255,255,0.08);
}

/* ─── Privacy Item ─── */
.privacy-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px;
  transition: background 0.15s;
}
.privacy-item:hover {
  background: rgba(255,255,255,0.02);
}

/* ─── Scroll Hint ─── */
.scroll-hint {
  position: absolute;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--muted-foreground);
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.scroll-hint:hover {
  opacity: 0.8;
}
</style>
