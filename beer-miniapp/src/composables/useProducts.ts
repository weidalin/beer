import { ref } from 'vue'
import { db, callFunction, withCloudTimeout } from '../lib/cloud'
import type { Product } from '../types/database'
import type { ProductFilter } from '../types/api'

type ProductAdminResult = { ok?: boolean; error?: string; product?: Product }

function assertProductAdminOk(res: ProductAdminResult | undefined, fallback: string): void {
  if (res?.error) throw new Error(res.error)
  if (!res?.ok) throw new Error(fallback)
}

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

      const { data } = await withCloudTimeout(query.get(), '读取产品列表')
      // 展开为普通对象，避免 CloudBase 文档代理在小程序渲染层序列化异常
      const result = ((data || []) as unknown as Product[]).map(item => ({ ...item }))

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
      if (!data) return null
      return { ...(data as unknown as Product) }
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

    return ((data || []) as unknown as Product[]).map(item => ({ ...item }))
  }

  /** B端：新增产品（走云函数，绕过「仅创建者可写」） */
  async function createProduct(product: Partial<Product>): Promise<Product> {
    const res = await callFunction<ProductAdminResult>('productAdmin', {
      action: 'create',
      product
    })
    assertProductAdminOk(res, '创建失败')
    if (!res?.product) throw new Error('创建失败')
    return res.product
  }

  /** B端：更新产品 */
  async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const res = await callFunction<ProductAdminResult>('productAdmin', {
      action: 'update',
      id,
      updates
    })
    assertProductAdminOk(res, '更新失败')
  }

  /** B端：切换上下架状态 */
  async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
    const res = await callFunction<ProductAdminResult>('productAdmin', {
      action: 'toggleActive',
      id,
      isActive
    })
    assertProductAdminOk(res, '操作失败')
  }

  /** B端：删除产品 */
  async function deleteProduct(id: string): Promise<void> {
    const res = await callFunction<ProductAdminResult>('productAdmin', {
      action: 'delete',
      id
    })
    assertProductAdminOk(res, '删除失败')
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
