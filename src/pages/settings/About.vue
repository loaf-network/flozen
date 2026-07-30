<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import {
    ArrowLeft,
    ExternalLink,
    Globe,
    MessageSquare,
    Star,
    Download,
    CheckCircle,
    LoaderCircle,
    RotateCw,
} from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { toast } from "vue-sonner"
import pkg from "../../../package.json"

const router = useRouter()
const version = pkg.version
const checking = ref(false)
const latestVersion = ref("")
const hasUpdate = ref(false)

async function checkUpdate() {
    checking.value = true
    hasUpdate.value = false
    latestVersion.value = ""
    try {
        const res = await fetch("https://api.github.com/repos/loaf-network/flozen/releases/latest")
        if (!res.ok) throw new Error(res.statusText)
        const data = await res.json()
        const tag = (data.tag_name ?? "").replace(/^v/, "")
        latestVersion.value = tag
        hasUpdate.value = tag !== version
        if (hasUpdate.value) {
            toast.success(`发现新版本 v${tag}，点击下载`)
        } else {
            toast.success("当前已是最新版本")
        }
    } catch {
        toast.error("检查更新失败，请稍后重试")
    } finally {
        checking.value = false
    }
}

const links = [
    { label: "官方网站", url: "https://flozen.loaf.network", icon: Globe },
    { label: "Loaf Network", url: "https://loaf.network", icon: Star },
    { label: "GitHub 仓库", url: "https://github.com/loaf-network/flozen", icon: ExternalLink },
    {
        label: "问题反馈",
        url: "https://github.com/loaf-network/flozen/issues",
        icon: MessageSquare,
    },
]
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-normal">关于</h1>
        </div>

        <!-- 应用信息 -->
        <div
            class="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10"
        >
            <div class="flex items-center gap-4">
                <img
                    src="/logo.svg"
                    alt="Flozen"
                    class="size-14 rounded-2xl flex-shrink-0 shadow-sm shadow-primary/10"
                />
                <div class="flex-1 min-w-0">
                    <h2 class="text-lg font-bold tracking-normal">Flozen</h2>
                    <p class="text-sm text-muted-foreground mt-0.5">
                        v{{ version }}
                        <span class="mx-1.5 text-border/60">·</span>
                        <a
                            href="https://loaf.network/"
                            target="_blank"
                            rel="noopener"
                            class="hover:text-foreground transition-colors"
                            >Loaf Network</a
                        >
                    </p>
                </div>
            </div>
        </div>

        <!-- 更新 -->
        <p class="text-xs font-medium text-muted-foreground mb-2 px-1">更新</p>
        <button
            class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border hover:bg-accent/50 transition-colors disabled:opacity-50"
            :disabled="checking"
            @click="checkUpdate"
        >
            <div class="size-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <LoaderCircle v-if="checking" :size="18" class="text-primary animate-spin" />
                <CheckCircle
                    v-else-if="!hasUpdate && latestVersion"
                    :size="18"
                    class="text-green-500"
                />
                <RotateCw v-else :size="18" class="text-muted-foreground" />
            </div>
            <div class="flex-1 text-left min-w-0">
                <p class="text-sm font-medium">
                    {{ checking ? "正在检查..." : hasUpdate ? "发现新版本" : "检查更新" }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                    <template v-if="hasUpdate && latestVersion">
                        v{{ latestVersion }}，当前 v{{ version }}
                    </template>
                    <template v-else-if="latestVersion && !hasUpdate"> 已是最新版本 </template>
                </p>
            </div>
            <a
                v-if="hasUpdate"
                href="https://github.com/loaf-network/flozen/releases/latest"
                target="_blank"
                rel="noopener"
                class="shrink-0"
                @click.stop
            >
                <Button variant="default" size="sm">
                    <Download :size="14" class="mr-1" />
                    下载
                </Button>
            </a>
            <ExternalLink v-else-if="!checking" :size="14" class="text-muted-foreground shrink-0" />
        </button>

        <!-- 链接 -->
        <p class="text-xs font-medium text-muted-foreground mt-6 mb-2 px-1">链接</p>
        <div class="flex flex-col gap-2">
            <a
                v-for="link in links"
                :key="link.label"
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
                <div
                    class="size-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"
                >
                    <component :is="link.icon" :size="18" class="text-muted-foreground" />
                </div>
                <span class="text-sm font-medium flex-1">{{ link.label }}</span>
                <ExternalLink :size="14" class="text-muted-foreground shrink-0" />
            </a>
        </div>
    </div>
</template>
