<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft, QrCode, Loader2, Music } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { getQrKey, createQr, checkQr, getNcmAccount, ncmLogout, type UserProfile } from "@/lib/api"
import { loadConfig, saveConfig } from "@/lib/store"

const router = useRouter()
const user = ref<UserProfile | null>(null)
const ncmCookie = ref("")
const showQr = ref(false)
const qrImg = ref("")
const qrStatus = ref<"loading" | "waiting" | "expired" | "error">("loading")
const qrText = ref("")
let polling: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
    const config = await loadConfig()
    ncmCookie.value = config.ncmCookie
    if (config.ncmProfile) user.value = config.ncmProfile
    else if (config.ncmCookie) await fetchUser(config.ncmCookie)
})

onUnmounted(cleanup)

async function fetchUser(cookie: string) {
    try {
        const res = await getNcmAccount(cookie)
        if (res.code === 200 && res.profile) {
            user.value = res.profile
            await saveConfig("ncmProfile", res.profile)
        }
    } catch {
        /* ignore */
    }
}

async function openQrLogin() {
    showQr.value = true
    qrStatus.value = "loading"
    qrText.value = "正在获取二维码..."
    qrImg.value = ""
    cleanup()
    try {
        const keyRes = await getQrKey()
        if (keyRes.code !== 200 || !keyRes.data?.unikey) {
            qrStatus.value = "error"
            qrText.value = "获取失败"
            return
        }
        const key = keyRes.data.unikey
        const createRes = await createQr(key)
        if (createRes.code !== 200 || !createRes.data?.qrimg) {
            qrStatus.value = "error"
            qrText.value = "生成失败"
            return
        }
        qrImg.value = createRes.data.qrimg
        qrStatus.value = "waiting"
        qrText.value = "请使用网易云音乐 App 扫描二维码"
        polling = setInterval(async () => {
            try {
                const check = await checkQr(key)
                if (check.code === 803 && check.cookie) {
                    cleanup()
                    ncmCookie.value = check.cookie
                    await saveConfig("ncmCookie", check.cookie)
                    await fetchUser(check.cookie)
                    showQr.value = false
                } else if (check.code === 800) {
                    cleanup()
                    qrStatus.value = "expired"
                    qrText.value = "二维码已过期"
                } else if (check.code === 802) {
                    qrText.value = "已扫码，请在手机上确认"
                }
            } catch {
                /* ignore */
            }
        }, 2000)
    } catch {
        qrStatus.value = "error"
        qrText.value = "网络错误"
    }
}

async function logout() {
    try {
        await ncmLogout()
    } catch {
        /* ignore */
    }
    user.value = null
    ncmCookie.value = ""
    await saveConfig("ncmCookie", "")
    await saveConfig("ncmProfile", null)
}

function cleanup() {
    if (polling) {
        clearInterval(polling)
        polling = null
    }
}
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-tight">第三方平台账号</h1>
        </div>

        <Card class="py-0 gap-0 overflow-hidden">
            <div v-if="user" class="flex items-center gap-3 px-4 py-3">
                <Avatar class="size-8">
                    <AvatarImage :src="user.avatarUrl" />
                    <AvatarFallback>{{ user.nickname?.slice(0, 1) }}</AvatarFallback>
                </Avatar>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ user.nickname }}</p>
                    <p class="text-xs text-muted-foreground">UID: {{ user.userId }}</p>
                </div>
                <Button variant="ghost" size="sm" class="text-destructive" @click="logout"
                    >退出登录</Button
                >
            </div>
            <div v-else class="flex items-center gap-3 px-4 py-3">
                <div
                    class="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                >
                    <Music :size="14" class="text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">网易云音乐</p>
                    <p class="text-xs text-muted-foreground">未登录</p>
                </div>
                <Button variant="outline" size="sm" @click="openQrLogin">
                    <QrCode :size="14" /> 登录
                </Button>
            </div>
        </Card>

        <Dialog
            v-model:open="showQr"
            @update:open="
                (v) => {
                    if (!v) cleanup()
                }
            "
        >
            <DialogContent class="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>网易云音乐登录</DialogTitle>
                    <DialogDescription>使用网易云音乐 App 扫描二维码</DialogDescription>
                </DialogHeader>
                <div class="flex flex-col items-center gap-3 py-2">
                    <div
                        v-if="qrStatus === 'loading'"
                        class="size-44 rounded-xl border border-border flex items-center justify-center"
                    >
                        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
                    </div>
                    <img v-else-if="qrImg" :src="qrImg" class="size-44 rounded-xl" />
                    <div
                        v-else
                        class="size-44 rounded-xl border border-dashed border-border flex items-center justify-center"
                    >
                        <QrCode :size="28" :stroke-width="1" class="text-muted-foreground" />
                    </div>
                    <p class="text-xs text-muted-foreground">{{ qrText }}</p>
                    <Button
                        v-if="qrStatus === 'expired' || qrStatus === 'error'"
                        variant="outline"
                        size="sm"
                        @click="openQrLogin"
                        >重新生成</Button
                    >
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
