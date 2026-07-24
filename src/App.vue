<script setup lang="ts">
import { onMounted } from "vue"
import { Toaster } from "@/components/ui/sonner"
import AppHeader from "@/components/AppHeader.vue"
import "vue-sonner/style.css"

const STORAGE_KEY = "flozen-theme"

function applyTheme(mode: string) {
    const isDark =
        mode === "auto"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : mode === "dark"
    document.documentElement.classList.toggle("dark", isDark)
}

onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "dark"
    applyTheme(stored)

    if (stored === "auto") {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            applyTheme("auto")
        })
    }
})
</script>

<template>
    <div class="app-root">
        <AppHeader />
        <div class="app-content">
            <router-view v-slot="{ Component }">
                <Transition name="fade" mode="out-in">
                    <component :is="Component" />
                </Transition>
            </router-view>
        </div>
    </div>
    <Toaster />
</template>

<style>
.app-root {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.app-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}
</style>
