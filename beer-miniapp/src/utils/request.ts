// Supabase 请求统一封装（错误处理）

import { supabase } from '../lib/supabase'

export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T> {
  const { data, error } = await queryFn()
  if (error) {
    const msg = (error as { message?: string }).message || '请求失败'
    console.error('[Supabase Error]', error)
    throw new Error(msg)
  }
  return data as T
}

export function showError(err: unknown, defaultMsg = '操作失败，请重试') {
  const msg = err instanceof Error ? err.message : defaultMsg
  uni.showToast({ title: msg, icon: 'none', duration: 2000 })
}

export function showSuccess(msg: string) {
  uni.showToast({ title: msg, icon: 'success', duration: 1500 })
}

export function showLoading(title = '加载中...') {
  uni.showLoading({ title, mask: true })
}

export function hideLoading() {
  uni.hideLoading()
}

export { supabase }
