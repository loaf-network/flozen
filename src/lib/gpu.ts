import { invoke } from "@tauri-apps/api/core"

export interface GpuInfo {
    name: string
    discrete: boolean
}

const DISCRETE_RE = /nvidia|geforce|rtx|gtx|quadro|intel\(r\) arc|radeon rx|rx\s?\d{3,4}/i
const INTEGRATED_RE = /intel.*(uhd|hd graphics|iris)|radeon\(tm\) graphics|vega \d/i

export async function listGpus(): Promise<GpuInfo[]> {
    try {
        const names = await invoke<string[]>("list_gpus")
        return names.map((name) => ({
            name,
            discrete: DISCRETE_RE.test(name) && !INTEGRATED_RE.test(name),
        }))
    } catch {
        return []
    }
}

/** 0 = 系统默认, 1 = 省电(核显), 2 = 高性能(独显) */
export async function getGpuPreference(): Promise<number> {
    try {
        return await invoke<number>("get_gpu_preference")
    } catch {
        return 0
    }
}

export async function setGpuPreference(mode: 0 | 1 | 2): Promise<void> {
    await invoke("set_gpu_preference", { mode })
}
