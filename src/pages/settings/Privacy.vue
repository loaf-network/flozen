<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { loadConfig, saveConfig } from "@/lib/store"

const router = useRouter()
const privacyAgreed = ref(false)
const clarityAgreed = ref(false)

onMounted(async () => {
    const config = await loadConfig()
    privacyAgreed.value = config.onboarded
    clarityAgreed.value = config.clarity
})

function toggleClarity(v: boolean | "indeterminate") {
    clarityAgreed.value = v === true
    saveConfig("clarity", clarityAgreed.value)
}
</script>

<template>
    <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon-sm" @click="router.push('/app/settings')">
                <ArrowLeft :size="18" />
            </Button>
            <h1 class="text-xl font-bold tracking-tight">隐私</h1>
        </div>

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
            <Separator />
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
    </div>
</template>
