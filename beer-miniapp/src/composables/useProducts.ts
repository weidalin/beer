import { ref } from 'vue'
import { db } from '../lib/cloud'
import type { Product } from '../types/database'
import type { ProductFilter } from '../types/api'

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const PAGE_SIZE = 20

  /** C端：获取上架产品（支持分类过滤、分页） */
  async function fetchProducts(filter: ProductFilter = {}): Promise<Product[]> {
    loading.value = true
    try {
      const { category, page = 1, pageSize = PAGE_SIZE } = filter
      const skip = (page - 1) * pageSize

      let query = db
        .collection('products')
        .where(
          category && category !== 'all'
            ? { is_active: true, category }
            : { is_active: true }
        )
        .orderBy('sort_order', 'desc')
        .skip(skip)
        .limit(pageSize)

      const { data } = await query.get()
      const result = (data || []) as unknown as Product[]

      hasMore.value = result.length >= pageSize
      return result
    } finally {
      loading.value = false
    }
  }

  /** C端：获取单个产品详情 */
  async function fetchProductDetail(id: string): Promise<Product | null> {
    try {
      const { data } = await db.collection('products').doc(id).get()
      return (data as unknown as Product) || null
    } catch {
      return null
    }
  }

  /** B端：获取全部产品（含下架），支持状态过滤 */
  async function fetchAllProducts(filter: { isActive?: boolean } = {}): Promise<Product[]> {
    const condition: Record<string, unknown> =
      filter.isActive !== undefined ? { is_active: filter.isActive } : {}

    const { data } = await db
      .collection('products')
      .where(condition)
      .orderBy('sort_order', 'desc')
      .limit(100)
      .get()

    return (data || []) as unknown as Product[]
  }

  /** B端：新增产品 */
  async function createProduct(product: Partial<Product>): Promise<Product> {
    const now = new Date().toISOString()
    const payload = {
      ...product,
      is_active: product.is_active ?? false,
      sort_order: product.sort_order ?? 0,
      tags: product.tags ?? [],
      images: product.images ?? [],
      created_at: now,
      updated_at: now
    }

    const { _id } = await db.collection('products').add({ data: payload })
    return { _id, ...payload } as unknown as Product
  }

  /** B端：更新产品 */
  async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const payload: Record<string, unknown> = { ...updates as Record<string, unknown>, updated_at: new Date().toISOString() }
    await db.collection('products').doc(id).update({ data: payload })
  }

  /** B端：切换上下架状态 */
  async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
    await db.collection('products').doc(id).update({
      data: { is_active: isActive, updated_at: new Date().toISOString() }
    })
  }

  /** B端：删除产品 */
  async function deleteProduct(id: string): Promise<void> {
    await db.collection('products').doc(id).remove()
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
