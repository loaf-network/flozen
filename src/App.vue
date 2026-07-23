<script setup lang="ts">
import { onMounted } from "vue"

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
    <router-view />
</template>
