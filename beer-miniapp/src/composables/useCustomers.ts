import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/user'
import type { Customer } from '../types/database'
import type { BookingForm, CustomerFilter } from '../types/api'

export function useCustomers() {
  const userStore = useUserStore()

  async function createCustomer(form: BookingForm): Promise<Customer> {
    const payload: Partial<Customer> = {
      ...form,
      user_id: userStore.userId ?? undefined,
      status: 'pending',
      source: 'miniapp'
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Customer
  }

  async function fetchMyCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Customer[]
  }

  // B 端：获取所有客户
  async function fetchAllCustomers(filter: CustomerFilter = {}): Promise<Customer[]> {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }
    if (filter.keyword) {
      query = query.or(`name.ilike.%${filter.keyword}%,phone.ilike.%${filter.keyword}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Customer[]
  }

  async function fetchCustomerDetail(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Customer
  }

  async function updateCustomerStatus(
    id: string,
    status: Customer['status']
  ): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  async function updateFollowNote(id: string, followNote: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ follow_note: followNote })
      .eq('id', id)

    if (error) throw error
  }

  // 获取今日新增客户数（B 端看板）
  async function getTodayNewCount(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    if (error) return 0
    return count || 0
  }

  return {
    createCustomer,
    fetchMyCustomers,
    fetchAllCustomers,
    fetchCustomerDetail,
    updateCustomerStatus,
    updateFollowNote,
    getTodayNewCount
  }
}
