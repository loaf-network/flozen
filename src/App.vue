<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { Toaster } from "@/components/ui/sonner"
import AppHeader from "@/components/AppHeader.vue"
import MusicCapsule from "@/components/player/MusicCapsule.vue"
import "vue-sonner/style.css"

const route = useRoute()
const onPlayer = computed(() => route.name === "player")
const transitionName = computed(() => (route.meta.transition as string) || "fade")
const transitionMode = computed(() =>
    transitionName.value.startsWith("player") ? undefined : "out-in",
)

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
        <div class="app-content" :class="{ 'is-player': onPlayer }">
            <router-view v-slot="{ Component }">
                <Transition :name="transitionName" :mode="transitionMode">
                    <component :is="Component" />
                </Transition>
            </router-view>
        </div>
        <MusicCapsule />
    </div>
    <Toaster />
</template>

<style>
.app-root {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.app-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}
.app-content.is-player {
    background: #000;
}
</style>
