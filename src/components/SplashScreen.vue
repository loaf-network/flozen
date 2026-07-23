<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { Music } from "@lucide/vue"

const router = useRouter()
onMounted(() => {
  setTimeout(() => router.replace("/landing"), 2000)
})
</script>

<template>
  <div class="splash">
    <div class="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <Music :size="40" :stroke-width="1.5" class="text-muted-foreground animate-pulse" />
      <h1 class="text-2xl font-bold tracking-tight">Flozen</h1>
      <p class="text-xs tracking-widest uppercase text-muted-foreground">Music Player</p>
    </div>
  </div>
</template>

<style scoped>
.splash {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
