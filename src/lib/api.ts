const BASE = import.meta.env.VITE_API_NCM_BASE as string

function ts() { return Date.now() }

export interface QrKeyRes {
  code: number
  data: { code: number; unikey: string }
}

export interface QrCreateRes {
  code: number
  data: { qrurl: string; qrimg?: string }
}

export interface QrCheckRes {
  code: number
  message: string
  cookie?: string
}

export interface UserProfile {
  userId: number
  nickname: string
  avatarUrl: string
  vipType: number
  eventCount: number
  followeds: number
  follows: number
}

export interface UserAccountRes {
  code: number
  profile: UserProfile | null
}

export async function getQrKey() {
  const r = await fetch(`${BASE}/login/qr/key?timestamp=${ts()}`)
  return (await r.json()) as QrKeyRes
}

export async function createQr(key: string) {
  const r = await fetch(`${BASE}/login/qr/create?key=${key}&qrimg=true&timestamp=${ts()}`)
  return (await r.json()) as QrCreateRes
}

export async function checkQr(key: string) {
  const r = await fetch(`${BASE}/login/qr/check?key=${key}&timestamp=${ts()}`)
  return (await r.json()) as QrCheckRes
}

export async function getUserAccount(cookie: string) {
  const r = await fetch(`${BASE}/user/account?cookie=${encodeURIComponent(cookie)}&timestamp=${ts()}`)
  return (await r.json()) as UserAccountRes
}
