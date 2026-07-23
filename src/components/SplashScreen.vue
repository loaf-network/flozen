<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { Music } from "@lucide/vue"
import { loadConfig } from "@/lib/store"

const router = useRouter()
onMounted(async () => {
    const config = await loadConfig()
    setTimeout(() => {
        router.replace(config.onboarded ? "/app" : "/landing")
    }, 2200)
})
</script>

<template>
    <div class="splash">
        <div class="splash-content">
            <!-- Logo -->
            <div class="splash-logo">
                <div class="splash-logo-inner">
                    <Music :size="28" :stroke-width="1.2" class="text-foreground" />
                </div>
            </div>

            <!-- 装饰线 -->
            <div class="splash-line" />

            <!-- 品牌名 -->
            <h1 class="splash-title">Flozen</h1>

            <!-- 副标题 -->
            <p class="splash-sub">Music Player</p>
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
    background: #0a0a0a;
}

.splash-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    animation: splash-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ─── Logo ─── */
.splash-logo {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: logo-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}
.splash-logo-inner {
    animation: breathe 2.4s ease-in-out infinite;
}

/* ─── 装饰线 ─── */
.splash-line {
    width: 1px;
    height: 28px;
    margin: 20px 0;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02));
    animation: line-enter 0.5s ease 0.3s both;
}

/* ─── 标题 ─── */
.splash-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--foreground);
    animation: text-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
}

/* ─── 副标题 ─── */
.splash-sub {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted-foreground);
    opacity: 0.5;
    margin-top: 6px;
    animation: text-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
}

/* ─── 动画 ─── */
@keyframes splash-enter {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.96);
    }
}
@keyframes logo-enter {
    from {
        opacity: 0;
        transform: scale(0.8);
    }
}
@keyframes line-enter {
    from {
        opacity: 0;
        transform: scaleY(0);
    }
}
@keyframes text-enter {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
}
@keyframes breathe {
    0%,
    100% {
        opacity: 0.7;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.04);
    }
}
</style>
