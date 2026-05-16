import { db } from '../lib/cloud'
import { useUserStore } from '../stores/user'
import type { Customer } from '../types/database'

/** 合作意向表单数据（与产品计划书 3.4 节字段对齐） */
export interface IntentionForm {
  nickname: string                  // 必填
  phone: string                     // 必填
  address?: string                  // 选填：档口地址
  location?: { latitude: number; longitude: number }  // 选填：GPS
  biz_type?: 'night_stall' | 'open_restaurant' | 'market' | 'other'
  daily_volume?: '<50' | '50-100' | '>100'
  interested_plan?: 'basic' | 'standard' | 'premium' | 'undecided'
  need_beer_car?: 'no' | 'buy' | 'rent'
  delivery_area?: 'prd' | 'other'
  notes?: string
}

export function useCustomers() {
  const userStore = useUserStore()

  /**
   * 提交合作意向
   * 已登录时带 openid，未登录时匿名写入（openid = null）
   */
  async function createIntention(form: IntentionForm): Promise<string> {
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      nickname: form.nickname,
      phone: form.phone,
      address: form.address ?? null,
      location: form.location ?? null,
      biz_type: form.biz_type ?? null,
      daily_volume: form.daily_volume ?? null,
      interested_plan: form.interested_plan ?? null,
      need_beer_car: form.need_beer_car ?? null,
      delivery_area: form.delivery_area ?? null,
      notes: form.notes ?? null,
      openid: userStore.isLoggedIn ? userStore.user?.openid ?? null : null,
      created_at: now
    }

    try {
      const { _id } = await db.collection('customers').add({ data: payload })
      return _id
    } catch (e) {
      console.error('createIntention', e)
      const raw =
        e && typeof e === 'object' && 'errMsg' in e
          ? String((e as { errMsg?: string }).errMsg)
          : e instanceof Error
            ? e.message
            : String(e)
      if (/502005|DATABASE_COLLECTION_NOT_EXIST|collection not exists|不存在/i.test(raw)) {
        throw new Error(
          '提交失败：云数据库中尚未创建 customers 集合。请在云开发控制台上传并执行 init_db 云函数，或手动新建集合。'
        )
      }
      throw e
    }
  }
  /**
   * C端：查询当前登录用户的意向记录
   */
  async function fetchMyIntentions(): Promise<Customer[]> {
    if (!userStore.isLoggedIn || !userStore.user?.openid) return []

    const { data } = await db
      .collection('customers')
      .where({ openid: userStore.user.openid })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get()

    return (data || []) as unknown as Customer[]
  }

  /**
   * B端：获取所有意向客户（管理员专用）
   */
  async function fetchAllCustomers(): Promise<Customer[]> {
    const { data } = await db
      .collection('customers')
      .orderBy('created_at', 'desc')
      .limit(200)
      .get()

    return (data || []) as unknown as Customer[]
  }

  /**
   * B端：获取今日新增意向数（看板用）
   */
  async function getTodayNewCount(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    try {
      const { total } = await db
        .collection('customers')
        .where(
          db.command.gte('created_at', todayISO) as unknown as Record<string, unknown>
        )
        .count()

      return total
    } catch {
      return 0
    }
  }

  return {
    createIntention,
    fetchMyIntentions,
    fetchAllCustomers,
    getTodayNewCount
  }
}
