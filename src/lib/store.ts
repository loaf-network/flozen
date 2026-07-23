import { load } from "@tauri-apps/plugin-store"
import type { UserProfile } from "./api"

const DEFAULTS = {
  onboarded: false,
  theme: "auto" as "dark" | "light" | "auto",
  ncmCookie: "",
  ncmUser: null as UserProfile | null,
  clarity: false,
}

type Config = typeof DEFAULTS

let store: Awaited<ReturnType<typeof load>> | null = null

async function getStore() {
  if (!store) store = await load("flozen-config.json")
  return store
}

export async function loadConfig(): Promise<Config> {
  const s = await getStore()
  const result = { ...DEFAULTS }
  for (const key of Object.keys(DEFAULTS) as (keyof Config)[]) {
    const val = await s.get(key)
    if (val !== undefined) (result as any)[key] = val
  }
  return result
}

export async function saveConfig<K extends keyof Config>(key: K, value: Config[K]) {
  const s = await getStore()
  await s.set(key, value)
  await s.save()
}
