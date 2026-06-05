<template>
  <view class="page-container">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索产品"
          placeholder-class="search-placeholder"
          @confirm="onSearch"
          @input="onSearchInput"
        />
        <text v-if="keyword" class="search-clear" @tap="clearSearch">×</text>
      </view>
    </view>

    <!-- 管理员：在本页进入产品增删改（图片走云存储，见后台编辑页） -->
    <view v-if="userStore.isAdmin" class="admin-strip">
      <view class="admin-strip-btns">
        <text class="admin-strip-btn" @tap="goAdminProductList">列表 / 上下架</text>
        <text class="admin-strip-btn admin-strip-btn--primary" @tap="goAdminProductNew">新增产品</text>
      </view>
    </view>

    <!-- 分类标签栏 -->
    <scroll-view scroll-x class="category-bar">
      <view class="category-inner">
        <view
          v-for="cat in categories"
          :key="cat.slug"
          class="category-tag"
          :class="{ 'category-tag--active': activeCategory === cat.slug }"
          @tap="setCategory(cat.slug)"
        >
          {{ cat.name }}
        </view>
      </view>
    </scroll-view>

    <!-- 产品网格 -->
    <scroll-view
      scroll-y
      class="product-scroll"
      @scrolltolower="loadMore"
      lower-threshold="100"
    >
      <!-- 加载中骨架屏 -->
      <view v-if="loading && products.length === 0" class="skeleton-grid">
        <view class="skeleton-card" v-for="i in 6" :key="i">
          <view class="skeleton-img"></view>
          <view class="skeleton-text"></view>
          <view class="skeleton-text skeleton-text--short"></view>
        </view>
      </view>

      <!-- 产品网格 -->
      <view v-else-if="products.length > 0" class="product-grid">
        <ProductCard
          v-for="product in products"
          :key="product._id"
          :product="product"
        />
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">🍺</text>
        <text class="empty-text">暂无产品，请稍后再来</text>
        <text v-if="userStore.isAdmin" class="empty-hint">
          后台无上架数据时会出现本提示。请部署并执行 init_db 写入示例数据，或使用「新增产品」添加。
        </text>
        <text v-else-if="userStore.isLoggedIn" class="empty-hint">
          若云端已有上架产品仍为空，多半是 products 读权限限制了 _openid。请在云开发将 products 的 read 设为 true（所有用户可读上架数据）。
        </text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadingMore" class="loading-state">加载中...</view>
      <view v-if="!hasMore && products.length > 0" class="loading-state">没有更多了</view>
    </scroll-view>

    <FloatContact />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import ProductCard from '../../components/ProductCard/index.vue'
import FloatContact from '../../components/FloatContact/index.vue'
import { useProducts } from '../../composables/useProducts'
import { useUserStore } from '../../stores/user'
import { useAuth } from '../../composables/useAuth'
import type { Product } from '../../types/database'

const { fetchProducts } = useProducts()
const userStore = useUserStore()
const { syncUserFromCloud } = useAuth()

const keyword = ref('')
const activeCategory = ref('all')
const products = ref<Product[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

const categories = [
  { slug: 'all', name: '全部' },
  { slug: 'beer', name: '桶装鲜啤' },
  { slug: 'beer_machine', name: '打酒机' },
  { slug: 'beer_car', name: '啤酒车' }
]

onLoad((options) => {
  if (options?.category) {
    activeCategory.value = options.category
  }
})

onShow(async () => {
  if (userStore.isLoggedIn) {
    await syncUserFromCloud()
  }
  await loadProducts(true)
})

function goAdminProductList() {
  uni.navigateTo({ url: '/pages/admin/products/list' })
}

function goAdminProductNew() {
  uni.navigateTo({ url: '/pages/admin/products/edit' })
}

async function loadProducts(refresh = false) {
  if (refresh) {
    currentPage.value = 1
    products.value = []
    hasMore.value = true
  }

  if (loading.value || loadingMore.value || !hasMore.value) return

  if (refresh) {
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const result = await fetchProducts({
      category: activeCategory.value as 'all' | 'beer' | 'beer_machine' | 'beer_car',
      keyword: keyword.value || undefined,
      page: currentPage.value
    })

    if (refresh) {
      products.value = result
    } else {
      products.value = [...products.value, ...result]
    }

    hasMore.value = result.length >= 20
    currentPage.value++
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function setCategory(slug: string) {
  activeCategory.value = slug
  loadProducts(true)
}

let searchTimer: ReturnType<typeof setTimeout>

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadProducts(true)
  }, 500)
}

function onSearch() {
  loadProducts(true)
}

function clearSearch() {
  keyword.value = ''
  loadProducts(true)
}

function loadMore() {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    loadProducts(false)
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

// 管理员条
.admin-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-md;
  background: linear-gradient(90deg, #2d1500, #3e1c00);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.12);

  .admin-strip-label {
    font-size: $font-xs;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 600;
    flex-shrink: 0;
  }

  .admin-strip-btns {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .admin-strip-btn {
    font-size: $font-xs;
    color: rgba(255, 255, 255, 0.9);
    padding: 8rpx 20rpx;
    border-radius: $radius-full;
    border: 1rpx solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.08);

    &--primary {
      background: $color-primary;
      border-color: $color-primary;
      color: $color-text-white;
      font-weight: 600;
    }
  }
}

// 搜索框
.search-bar {
  padding: $spacing-sm $spacing-md;
  background: $color-primary-dark;

  .search-input-wrap {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: $radius-full;
    padding: $spacing-xs $spacing-sm;

    .search-icon {
      font-size: 28rpx;
      margin-right: $spacing-xs;
    }

    .search-input {
      flex: 1;
      height: 64rpx;
      font-size: $font-base;
      color: $color-text-white;
    }

    .search-placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .search-clear {
      color: rgba(255, 255, 255, 0.7);
      font-size: $font-xl;
      padding: 0 $spacing-xs;
    }
  }
}

// 分类标签
.category-bar {
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border;
  white-space: nowrap;

  .category-inner {
    display: inline-flex;
    padding: $spacing-xs $spacing-sm;
    gap: $spacing-xs;
  }

  .category-tag {
    display: inline-block;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-full;
    font-size: $font-sm;
    color: $color-text-secondary;
    background: $color-bg;
    white-space: nowrap;

    &--active {
      background: $color-primary;
      color: $color-text-white;
      font-weight: 600;
    }
  }
}

// 产品滚动区
.product-scroll {
  flex: 1;
  overflow: hidden;
}

// 产品网格
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-sm;
  padding: $spacing-sm;
}

.empty-state {
  .empty-hint {
    display: block;
    margin-top: $spacing-md;
    padding: 0 $spacing-lg;
    font-size: $font-xs;
    color: $color-text-tertiary;
    line-height: 1.6;
    text-align: center;
  }
}

// 骨架屏
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-sm;
  padding: $spacing-sm;

  .skeleton-card {
    background: $color-bg-card;
    border-radius: $radius-md;
    overflow: hidden;

    .skeleton-img {
      width: 100%;
      padding-top: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-text {
      height: 28rpx;
      background: #f0f0f0;
      border-radius: 4rpx;
      margin: $spacing-sm $spacing-sm 0;
      animation: shimmer 1.5s infinite;

      &--short {
        width: 60%;
        margin-bottom: $spacing-sm;
      }
    }
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
