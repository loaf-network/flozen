<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { Music } from "@lucide/vue"
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
        <div class="splash-inner">
            <div class="splash-logo">
                <Music :size="26" :stroke-width="1.5" />
            </div>
            <p class="splash-title">Flozen</p>
        </div>
    </div>
</template>

<style scoped>
.splash {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0807;
}

.splash-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: splash-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.splash-logo {
    width: 60px;
    height: 60px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, oklch(0.62 0.17 22), oklch(0.66 0.16 45));
    box-shadow: 0 8px 32px oklch(0.62 0.17 22 / 0.35);
    animation: splash-breathe 2.2s ease-in-out infinite;
}

.splash-title {
    font-size: 15px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
}

@keyframes splash-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
}

@keyframes splash-breathe {
    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 8px 32px oklch(0.62 0.17 22 / 0.35);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 8px 44px oklch(0.62 0.17 22 / 0.55);
    }
}
</style>
