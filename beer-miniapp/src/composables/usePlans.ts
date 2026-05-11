import { supabase } from '../lib/supabase'
import type { Plan } from '../types/database'
import { PLAN_FALLBACK } from '../constants/planFallback'

export function usePlans() {
  async function fetchPlans(): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Plan[]
      }
    } catch {
      // 未配置 Supabase、网络失败或 RLS 拒绝时走本地兜底
    }
    return PLAN_FALLBACK
  }

  return { fetchPlans }
}
