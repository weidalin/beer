<template>
  <view class="page-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view
        v-for="f in filters"
        :key="f.value"
        class="filter-tag"
        :class="{ 'filter-tag--active': activeFilter === f.value }"
        @tap="setFilter(f.value)"
      >
        {{ f.label }}
      </view>
    </view>

    <!-- 批量操作 -->
    <view class="bulk-bar" v-if="selected.length > 0">
      <text class="bulk-hint">已选 {{ selected.length }} 个产品</text>
      <button class="btn-sm btn-primary" @tap="bulkActivate(true)">批量上架</button>
      <button class="btn-sm btn-outline" @tap="bulkActivate(false)">批量下架</button>
    </view>

    <scroll-view scroll-y class="product-scroll">
      <view v-if="loading" class="loading-state">加载中...</view>
      <view v-else-if="products.length === 0" class="empty-state">
        <text class="empty-icon">🍺</text>
        <text class="empty-text">暂无产品，点击右上角新增</text>
      </view>
      <view v-else class="product-list">
        <view
          class="product-item card"
          v-for="product in products"
          :key="product.id"
          :class="{ 'product-item--selected': selected.includes(product.id) }"
          @longpress="toggleSelect(product.id)"
        >
          <image
            class="product-thumb"
            :src="product.cover_image || '/static/images/placeholder.png'"
            mode="aspectFill"
          />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-cat">{{ categoryLabel(product.category) }}</text>
            <text class="product-spec" v-if="product.spec">{{ product.spec }}</text>
            <view class="product-footer">
              <view class="active-badge" :class="product.is_active ? 'active-badge--on' : 'active-badge--off'">
                {{ product.is_active ? '上架中' : '已下架' }}
              </view>
              <text class="product-order">权重:{{ product.sort_order }}</text>
            </view>
          </view>
          <view class="product-actions">
            <text class="action-btn" @tap.stop="goEdit(product.id)">编辑</text>
            <text
              class="action-btn"
              :class="product.is_active ? 'action-btn--warn' : 'action-btn--success'"
              @tap.stop="toggleActive(product)"
            >
              {{ product.is_active ? '下架' : '上架' }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <view class="fab" @tap="goAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { useProducts } from '../../../composables/useProducts'
import { requireAdmin } from '../../../utils/adminGuard'
import type { Product } from '../../../types/database'

onLoad(() => { requireAdmin() })

const { fetchAllProducts, toggleProductActive } = useProducts()

type FilterValue = 'all' | 'active' | 'inactive'

const activeFilter = ref<FilterValue>('all')
const products = ref<Product[]>([])
const loading = ref(false)
const selected = ref<string[]>([])

const filters = [
  { label: '全部', value: 'all' as FilterValue },
  { label: '上架中', value: 'active' as FilterValue },
  { label: '已下架', value: 'inactive' as FilterValue }
]

const categoryLabels: Record<string, string> = {
  beer: '桶装鲜啤',
  beer_machine: '打酒机',
  beer_car: '啤酒车'
}

function categoryLabel(cat: string) {
  return categoryLabels[cat] || cat
}

async function loadProducts() {
  loading.value = true
  try {
    const filter: { isActive?: boolean } = {}
    if (activeFilter.value === 'active') filter.isActive = true
    if (activeFilter.value === 'inactive') filter.isActive = false
    products.value = await fetchAllProducts(filter)
  } finally {
    loading.value = false
  }
}

function setFilter(value: FilterValue) {
  activeFilter.value = value
  selected.value = []
  loadProducts()
}

function toggleSelect(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

async function toggleActive(product: Product) {
  try {
    await toggleProductActive(product.id, !product.is_active)
    product.is_active = !product.is_active
    uni.showToast({
      title: product.is_active ? '已上架' : '已下架',
      icon: 'success'
    })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function bulkActivate(isActive: boolean) {
  const ids = [...selected.value]
  try {
    await Promise.all(ids.map(id => toggleProductActive(id, isActive)))
    selected.value = []
    loadProducts()
    uni.showToast({ title: isActive ? '批量上架成功' : '批量下架成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

function goAdd() {
  uni.navigateTo({ url: '/pages/admin/products/edit' })
}

function goEdit(id: string) {
  uni.navigateTo({ url: `/pages/admin/products/edit?id=${id}` })
}

onShow(() => {
  loadProducts()
})
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.filter-bar {
  display: flex;
  padding: $spacing-xs $spacing-sm;
  gap: $spacing-xs;
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border;

  .filter-tag {
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-full;
    font-size: $font-sm;
    color: $color-text-secondary;
    background: $color-bg;

    &--active {
      background: $color-primary;
      color: $color-text-white;
      font-weight: 600;
    }
  }
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-md;
  background: $color-primary-light;
  border-bottom: 1rpx solid rgba(245, 166, 35, 0.3);

  .bulk-hint {
    flex: 1;
    font-size: $font-sm;
    color: $color-primary-dark;
  }
}

.product-scroll { flex: 1; }

.product-list {
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding-bottom: 120rpx;
}

.product-item {
  display: flex;
  gap: $spacing-sm;
  align-items: flex-start;

  &--selected {
    border: 2rpx solid $color-primary;
  }

  .product-thumb {
    width: 160rpx;
    height: 160rpx;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  .product-info {
    flex: 1;
    min-width: 0;

    .product-name {
      display: block;
      font-size: $font-base;
      font-weight: 700;
      color: $color-text-primary;
      @include text-ellipsis;
    }

    .product-cat {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      margin-top: 4rpx;
    }

    .product-spec {
      display: block;
      font-size: $font-sm;
      color: $color-text-tertiary;
      @include text-ellipsis;
    }

    .product-footer {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin-top: $spacing-xs;

      .active-badge {
        padding: 2rpx 12rpx;
        border-radius: $radius-full;
        font-size: $font-xs;

        &--on { background: #E8F5E9; color: $color-success; }
        &--off { background: #F5F5F5; color: $color-text-tertiary; }
      }

      .product-order {
        font-size: $font-xs;
        color: $color-text-tertiary;
      }
    }
  }

  .product-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    .action-btn {
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-sm;
      font-size: $font-sm;
      text-align: center;
      background: $color-bg;
      color: $color-text-secondary;

      &--warn { color: $color-danger; }
      &--success { color: $color-success; }
    }
  }
}

// 悬浮新增按钮
.fab {
  position: fixed;
  right: 48rpx;
  bottom: 48rpx;
  width: 112rpx;
  height: 112rpx;
  background: $color-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-lg;
  z-index: 100;

  .fab-icon {
    font-size: 64rpx;
    color: $color-text-white;
    line-height: 1;
  }
}
</style>
