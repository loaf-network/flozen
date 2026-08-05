<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
import { useRouter } from "vue-router"
import { ArrowLeft, Loader2 } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loadConfig, saveConfig } from "@/lib/store"
import { getRealIP } from "@/lib/api/request"

const router = useRouter()
const privacyAgreed = ref(false)
const clarityAgreed = ref(false)
const realIP = ref("")
const realIPFetching = ref(false)

onMounted(async () => {
    const config = await loadConfig()
    privacyAgreed.value = config.onboarded
    clarityAgreed.value = config.clarity
    realIP.value = config.realIP ?? ""
})

function toggleClarity(v: boolean | "indeterminate") {
    clarityAgreed.value = v === true
    saveConfig("clarity", clarityAgreed.value)
}

async function saveRealIP() {
    const v = realIP.value.trim()
    await saveConfig("realIP", v)
    toast.success(v ? "已设置 realIP。" : "已清除 realIP，下次请求将自动获取。")
}

async function fetchRealIP() {
    realIPFetching.value = true
    try {
        const ip = await getRealIP(true)
        realIP.value = ip || ""
        toast.success(ip ? `已获取到公网 IP：${ip}。` : "获取公网 IP 失败，请检查网络后重试。")
    } finally {
        realIPFetching.value = false
    }
}
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-normal">隐私</h1>
        </div>

        <div class="flex flex-col gap-2">
            <Card class="py-0 gap-0 overflow-hidden">
                <div class="flex items-center gap-4 px-4 py-3.5">
                    <Checkbox :model-value="privacyAgreed" disabled />
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium">同意隐私政策</span>
                        <p class="text-xs text-muted-foreground mt-0.5">
                            已阅读并同意《Loaf Network 隐私政策》与《Flozen 免责声明》
                        </p>
                    </div>
                </div>
            </Card>

            <Card class="py-0 gap-0 overflow-hidden">
                <Label
                    class="flex items-center gap-4 cursor-pointer px-4 py-3.5 hover:bg-accent/30 transition-colors"
                >
                    <Checkbox :model-value="clarityAgreed" @update:model-value="toggleClarity" />
                    <div class="flex-1 min-w-0">
                        <span class="text-sm font-medium">Microsoft Clarity 使用分析</span>
                        <p class="text-xs text-muted-foreground mt-0.5">
                            匿名收集页面浏览与交互数据，用于改善产品体验
                        </p>
                    </div>
                </Label>
            </Card>
            <Card class="py-0 gap-0 overflow-hidden">
                <div class="px-4 py-3.5">
                    <span class="text-sm font-medium">网络标识（realIP）</span>
                    <p class="text-xs text-muted-foreground mt-0.5">
                        请求网易云接口时附加的公网 IP 参数，可手动指定或自动获取。
                    </p>
                    <div class="flex items-center gap-2 mt-3">
                        <Input v-model="realIP" placeholder="例如：1.2.3.4" class="h-9 flex-1" />
                        <Button
                            variant="outline"
                            size="sm"
                            class="gap-1.5 flex-shrink-0"
                            :disabled="realIPFetching"
                            @click="fetchRealIP"
                        >
                            <Loader2 v-if="realIPFetching" :size="14" class="animate-spin" />
                            自动获取
                        </Button>
                        <Button size="sm" class="flex-shrink-0" @click="saveRealIP">保存</Button>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>
