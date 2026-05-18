import { db, callFunction } from '../lib/cloud'
import { useUserStore } from '../stores/user'
import type { Customer } from '../types/database'

type SubmitIntentionResult = { ok?: boolean; _id?: string; error?: string }

/** 合作意向表单数据（与产品计划书 3.4 节字段对齐） */
export interface IntentionForm {
  nickname: string                  // 必填
  contact: string                   // 联系方式（电话或微信号，必填）
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
   * 提交合作意向（走云函数 submitIntention：自动建 customers 集合并写入）
   */
  async function createIntention(form: IntentionForm): Promise<string> {
    const payload = {
      nickname: form.nickname.trim(),
      contact: form.contact.trim().slice(0, 64),
      address: form.address?.trim() || null,
      location: form.location ?? null,
      biz_type: form.biz_type ?? null,
      daily_volume: form.daily_volume ?? null,
      interested_plan: form.interested_plan ?? null,
      need_beer_car: form.need_beer_car ?? null,
      delivery_area: form.delivery_area ?? null,
      notes: form.notes?.trim() || null,
      openid: userStore.isLoggedIn ? userStore.user?.openid ?? null : null
    }

    const res = await callFunction<SubmitIntentionResult>('submitIntention', payload)

    if (res?.error) {
      throw new Error(res.error)
    }
    if (!res?.ok || !res._id) {
      throw new Error('提交失败，请稍后重试')
    }
    return res._id
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
