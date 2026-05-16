import { db } from '../lib/cloud'
import type { Plan } from '../types/database'
import { PLAN_FALLBACK } from '../constants/planFallback'

export function usePlans() {
  /**
   * 从云数据库读取合作方案，失败时使用本地兜底数据。
   * 一期方案内容由运营在云开发控制台写入，前台只读。
   */
  async function fetchPlans(): Promise<Plan[]> {
    try {
      const { data } = await db
        .collection('plans')
        .where({ is_active: true })
        .orderBy('sort_order', 'asc')
        .limit(10)
        .get()

      if (Array.isArray(data) && data.length > 0) {
        return data as unknown as Plan[]
      }
    } catch {
      // 网络异常或权限问题时走本地兜底
    }
    return PLAN_FALLBACK
  }

  return { fetchPlans }
}
