import type { Plan } from '../types/database'

/** Supabase 未就绪或 plans 表无数据时使用，保证方案页 Tab / 对比表始终有三列 */
export const PLAN_FALLBACK: Plan[] = [
  {
    id: '00000000-0000-0000-0000-plan000000001',
    name: '基础版',
    level: 'basic',
    description: '适合刚起步的宵夜档、夜市摊，低成本尝鲜合作。',
    features: ['每周1次配送', '鲜啤直供', '72小时内维修响应'],
    excluded: ['打酒机需另购或租赁'],
    is_active: true,
    sort_order: 1
  },
  {
    id: '00000000-0000-0000-0000-plan000000002',
    name: '标准版',
    level: 'standard',
    description: '大多数大排档、宵夜店的优选方案。',
    features: ['每周2次配送', '含打酒机1台', '48小时维修响应', '专属客服'],
    excluded: [],
    is_active: true,
    sort_order: 2
  },
  {
    id: '00000000-0000-0000-0000-plan000000003',
    name: '旗舰版',
    level: 'premium',
    description: '高客流档口、连锁夜市摊位尊享。',
    features: ['每日配送', '含打酒机1台', '4小时极速维修', '专属客户经理', '定期设备保养'],
    excluded: [],
    is_active: true,
    sort_order: 3
  }
]
