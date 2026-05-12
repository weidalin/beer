import './fetchPolyfill'
import './urlPolyfill'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDisconnectedSupabaseClient } from './supabaseStub'

const rawUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const rawKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

console.log('[Supabase DEBUG] URL:', rawUrl || '(empty)')
console.log('[Supabase DEBUG] KEY length:', rawKey.length, 'prefix:', rawKey.slice(0, 12))
console.log('[Supabase DEBUG] URL typeof:', typeof globalThis.URL)

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      getItem(key: string) {
        return uni.getStorageSync(key) || null
      },
      setItem(key: string, value: string) {
        uni.setStorageSync(key, value)
      },
      removeItem(key: string) {
        uni.removeStorageSync(key)
      }
    }
  }
} as const

/** 是否为真实可用的 Supabase 配置（用于上传/登录等前提示） */
export function isSupabaseConfigured(): boolean {
  if (!rawUrl || !rawKey) return false
  // 微信小程序运行环境无 URL 构造器，仅用正则校验格式
  if (!/^https?:\/\/.+\..+/i.test(rawUrl)) return false
  return rawKey.length >= 20
}

function createRealClient(): SupabaseClient {
  return createClient(rawUrl, rawKey, clientOptions)
}

/**
 * 微信部分环境下 supabase-js 的 createClient 会对 URL 校验抛错（与 PC 不一致）。
 * 未配置时一律用内存 stub，绝不调用 createClient，避免 ImageUploader 加载即崩溃。
 * 已配置时 try/catch，失败则降级 stub 并打日志。
 */
function resolveSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    console.warn(
      '[Supabase] 未检测到有效的 VITE_SUPABASE_URL（须 http(s):// 开头）与 VITE_SUPABASE_ANON_KEY。已使用离线占位客户端以免白屏；请配置 .env 后执行 npm run build:mp-weixin。'
    )
    return createDisconnectedSupabaseClient()
  }

  try {
    return createRealClient()
  } catch (e) {
    console.error(
      '[Supabase] createClient 失败（可能是运行环境 URL 解析差异），已降级为占位客户端。请检查 VITE_SUPABASE_URL 是否为合法 https 地址。',
      e
    )
    return createDisconnectedSupabaseClient()
  }
}

export const supabase = resolveSupabase()
