<script setup lang="ts">
import { useRouter } from "vue-router"
import { ArrowLeft, ExternalLink } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const router = useRouter()
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-3 mb-6">
      <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
        <ArrowLeft :size="18" />
      </Button>
      <h1 class="text-xl font-bold tracking-tight">Loaf Network 账号</h1>
    </div>

    <Card class="py-0 gap-0 overflow-hidden">
      <div class="flex items-center gap-4 px-4 py-4">
        <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span class="text-sm font-bold text-primary">L</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium">Loaf Network</p>
          <p class="text-xs text-muted-foreground">loaf.network</p>
        </div>
        <Button variant="outline" size="sm" disabled>登录</Button>
      </div>
      <Separator />
      <div class="px-4 py-3">
        <p class="text-xs text-muted-foreground">登录 Loaf Network 账号以享受更多在线功能。</p>
      </div>
    </Card>

    <div class="mt-4">
      <a href="https://loaf.network" target="_blank" rel="noopener"
        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-accent/50 transition-colors">
        <ExternalLink :size="16" class="text-muted-foreground" />
        <span class="text-sm">访问 loaf.network</span>
      </a>
    </div>
  </div>
</template>
