<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { loadConfig, saveConfig } from "@/lib/store"
import { getNcmAccount } from "@/lib/api"

const router = useRouter()

onMounted(async () => {
    const config = await loadConfig()

    // 有 cookie 时先刷新 profile，最多等 3 秒
    if (config.ncmCookie) {
        try {
            const res = await Promise.race([
                getNcmAccount(config.ncmCookie),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("timeout")), 3000),
                ),
            ])
            if (res.code === 200 && res.profile) {
                await saveConfig("ncmProfile", res.profile)
            }
        } catch {
            toast.error("网络连接失败，已跳过账号同步")
        }
    }

    router.replace(config.onboarded ? "/app" : "/landing")
})
</script>

<template>
    <div class="splash">
        <img
            src="/flozen.png"
            alt="Flozen"
            class="splash-logo invert dark:invert-0"
        />
    </div>
</template>

<style scoped>
.splash {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--background);
}

.splash-logo {
    width: min(60vw, 360px);
    height: auto;
    animation: splash-fadein 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes splash-fadein {
    from {
        opacity: 0;
        transform: scale(0.96);
    }
}
</style>
