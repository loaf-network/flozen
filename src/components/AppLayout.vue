<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { Music, Home, Settings } from "@lucide/vue"

const route = useRoute()
const router = useRouter()

const nav = [
  { path: "/app", icon: Home, tip: "首页" },
  { path: "/app/settings", icon: Settings, tip: "设置" },
]

function isActive(path: string) {
  if (path === "/app") return route.path === "/app"
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex h-screen bg-background text-foreground">
    <!-- 侧边栏 -->
    <aside class="w-14 flex flex-col items-center border-r border-border bg-background select-none">
      <!-- Logo -->
      <div class="flex items-center justify-center h-14 w-full">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Music :size="16" :stroke-width="2" class="text-primary-foreground" />
        </div>
      </div>

      <!-- 导航 -->
      <nav class="flex flex-col items-center gap-1 flex-1 mt-1">
        <button
          v-for="item in nav"
          :key="item.path"
          :class="[
            'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
            isActive(item.path)
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          ]"
          :title="item.tip"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" :size="18" :stroke-width="1.8" />
        </button>
      </nav>

      <!-- 底部版本号 -->
      <div class="flex items-center justify-center h-14 w-full">
        <span class="text-[10px] text-muted-foreground/60">v0.1.0</span>
      </div>
    </aside>

    <!-- 主内容 -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
