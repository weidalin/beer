import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/user'
import type { RepairOrder } from '../types/database'
import type { RepairForm, OrderFilter } from '../types/api'

export function useRepairOrders() {
  const userStore = useUserStore()

  async function createRepairOrder(form: RepairForm): Promise<RepairOrder> {
    const payload = {
      ...form,
      user_id: userStore.userId ?? undefined,
      status: 'pending' as const
    }

    const { data, error } = await supabase
      .from('repair_orders')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as RepairOrder
  }

  async function fetchMyRepairOrders(): Promise<RepairOrder[]> {
    const { data, error } = await supabase
      .from('repair_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as RepairOrder[]
  }

  async function fetchRepairOrderDetail(id: string): Promise<RepairOrder | null> {
    const { data, error } = await supabase
      .from('repair_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as RepairOrder
  }

  // B 端：获取所有工单
  async function fetchAllRepairOrders(filter: OrderFilter = {}): Promise<RepairOrder[]> {
    let query = supabase
      .from('repair_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as RepairOrder[]
  }

  async function updateOrderStatus(
    id: string,
    status: RepairOrder['status'],
    extra?: { assignee?: string; handler_notes?: string }
  ): Promise<void> {
    const updates: Partial<RepairOrder> = { status, ...extra }
    const { error } = await supabase
      .from('repair_orders')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  // 获取待处理工单数（B 端看板）
  async function getPendingCount(): Promise<number> {
    const { count, error } = await supabase
      .from('repair_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) return 0
    return count || 0
  }

  return {
    createRepairOrder,
    fetchMyRepairOrders,
    fetchRepairOrderDetail,
    fetchAllRepairOrders,
    updateOrderStatus,
    getPendingCount
  }
}
