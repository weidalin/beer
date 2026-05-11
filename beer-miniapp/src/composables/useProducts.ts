import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database'
import type { ProductFilter } from '../types/api'

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const PAGE_SIZE = 20

  async function fetchProducts(filter: ProductFilter = {}): Promise<Product[]> {
    loading.value = true
    try {
      const { category, keyword, page = 1, pageSize = PAGE_SIZE } = filter
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: false })
        .range(from, to)

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      if (keyword) {
        query = query.ilike('name', `%${keyword}%`)
      }

      const { data, error } = await query
      if (error) throw error

      hasMore.value = (data?.length ?? 0) >= pageSize
      return (data || []) as Product[]
    } finally {
      loading.value = false
    }
  }

  async function fetchProductDetail(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Product
  }

  // B 端：获取全部产品（含下架）
  async function fetchAllProducts(filter: { isActive?: boolean } = {}): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: false })

    if (filter.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Product[]
  }

  async function createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data as Product
  }

  async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  }

  async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }

  async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    products,
    loading,
    hasMore,
    fetchProducts,
    fetchProductDetail,
    fetchAllProducts,
    createProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct
  }
}
