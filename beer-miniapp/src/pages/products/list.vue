<template>
  <view class="page-container">
    <!-- 搜索框 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          :placeholder="isSearching ? '搜索产品和常见问题' : '搜索产品'"
          placeholder-class="search-placeholder"
          @confirm="onSearch"
          @input="onSearchInput"
        />
        <text v-if="keyword" class="search-clear" @tap="clearSearch">×</text>
      </view>
    </view>

    <!-- 分类标签栏（非搜索状态才显示） -->
    <scroll-view v-if="!isSearching" scroll-x class="category-bar">
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

    <!-- 搜索结果模式 -->
    <scroll-view v-if="isSearching" scroll-y class="product-scroll">
      <view v-if="searchLoading" class="loading-state">搜索中...</view>

      <template v-else>
        <!-- 产品搜索结果 -->
        <view class="search-section">
          <view class="search-section-header">
            <text class="search-section-title">产品</text>
            <text class="search-section-count">{{ searchProducts.length }} 个结果</text>
          </view>

          <view v-if="searchProducts.length > 0" class="product-grid">
            <ProductCard
              v-for="product in searchProducts"
              :key="product.id"
              :product="product"
              :keyword="keyword"
            />
          </view>
          <view v-else class="section-empty">暂无匹配产品</view>
        </view>

        <!-- FAQ 搜索结果 -->
        <view class="search-section">
          <view class="search-section-header">
            <text class="search-section-title">常见问题</text>
            <text class="search-section-count">{{ displayFaqs.length }} 个结果</text>
          </view>

          <view v-if="displayFaqs.length > 0" class="faq-list">
            <view
              v-for="(item, idx) in displayFaqs"
              :key="idx"
              class="faq-item card"
              @tap="toggleFaq(idx)"
            >
              <view class="faq-question">
                <text class="faq-q" v-html="highlightText(item.q, keyword)" />
                <text class="faq-toggle">{{ item.open ? '▲' : '▼' }}</text>
              </view>
              <view v-if="item.open" class="faq-answer">
                <text class="faq-a" v-html="highlightText(item.a, keyword)" />
              </view>
            </view>
          </view>
          <view v-else class="section-empty">暂无相关问答</view>
        </view>

        <!-- 搜索全空状态 -->
        <view v-if="searchProducts.length === 0 && displayFaqs.length === 0" class="empty-state">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">未找到"{{ keyword }}"相关内容</text>
          <view class="empty-contact" @tap="openCustomerService">
            <text class="empty-contact-text">联系客服咨询</text>
            <text class="empty-contact-arrow">›</text>
          </view>
        </view>
      </template>
    </scroll-view>

    <!-- 默认产品列表模式 -->
    <scroll-view
      v-else
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
          :key="product.id"
          :product="product"
        />
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">🍺</text>
        <text class="empty-text">暂无产品，请稍后再来</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadingMore" class="loading-state">加载中...</view>
      <view v-if="!hasMore && products.length > 0" class="loading-state">没有更多了</view>
    </scroll-view>

    <FloatContact />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ProductCard from '../../components/ProductCard/index.vue'
import FloatContact from '../../components/FloatContact/index.vue'
import { useProducts } from '../../composables/useProducts'
import { FAQ_DATA } from '../../constants/faqData'
import type { Product } from '../../types/database'

const { fetchProducts } = useProducts()

const keyword = ref('')
const activeCategory = ref('all')
const products = ref<Product[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

// 搜索状态
const isSearching = computed(() => keyword.value.trim().length > 0)
const searchLoading = ref(false)
const searchProducts = ref<Product[]>([])
const searchFaqs = reactive(FAQ_DATA.map(item => ({ ...item, open: false })))
const filteredFaqs = computed(() =>
  isSearching.value
    ? searchFaqs.filter(item =>
        matchKeyword(item.q, keyword.value) || matchKeyword(item.a, keyword.value)
      )
    : []
)

// searchFaqs 展示用（有筛选结果才显示，方便 open toggle）
const visibleFaqIds = computed(() => new Set(filteredFaqs.value.map(f => f.q)))
// 用于渲染的 FAQ 列表（保持 open 状态）
const displayFaqs = computed(() =>
  searchFaqs.filter(f => visibleFaqIds.value.has(f.q))
)

// 模板中直接用 searchFaqs = displayFaqs
// (重命名为更清晰)

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
  loadProducts(true)
})

async function loadProducts(refresh = false) {
  if (isSearching.value) return
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
      page: currentPage.value
    })

    if (refresh) {
      products.value = result
    } else {
      products.value = [...products.value, ...result]
    }

    hasMore.value = result.length >= 20
    currentPage.value++
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function doSearch() {
  if (!keyword.value.trim()) return

  searchLoading.value = true
  try {
    const result = await fetchProducts({
      keyword: keyword.value.trim(),
      page: 1,
      pageSize: 50
    })
    searchProducts.value = result
  } catch {
    searchProducts.value = []
  } finally {
    searchLoading.value = false
  }
}

function setCategory(slug: string) {
  activeCategory.value = slug
  loadProducts(true)
}

let searchTimer: ReturnType<typeof setTimeout>

function onSearchInput() {
  clearTimeout(searchTimer)
  if (!keyword.value.trim()) {
    searchProducts.value = []
    return
  }
  searchTimer = setTimeout(() => {
    doSearch()
  }, 300)
}

function onSearch() {
  clearTimeout(searchTimer)
  doSearch()
}

function clearSearch() {
  keyword.value = ''
  searchProducts.value = []
  loadProducts(true)
}

function loadMore() {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    loadProducts(false)
  }
}

function toggleFaq(idx: number) {
  // idx is index within displayFaqs
  const item = displayFaqs.value[idx]
  if (item) {
    item.open = !item.open
  }
}

function matchKeyword(text: string, kw: string): boolean {
  return text.toLowerCase().includes(kw.toLowerCase())
}

function highlightText(text: string, kw: string): string {
  if (!kw) return text
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(
    new RegExp(escaped, 'gi'),
    (match) => `<text style="font-weight:700;color:#F5A623;">${match}</text>`
  )
}

function openCustomerService() {
  uni.showToast({ title: '请通过首页悬浮按钮联系客服', icon: 'none', duration: 2000 })
}
</script>


<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

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

.product-scroll {
  flex: 1;
  overflow: hidden;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;
  padding: $spacing-sm;
}

// 搜索结果区块
.search-section {
  padding: $spacing-sm $spacing-md 0;

  .search-section-header {
    display: flex;
    align-items: baseline;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;

    .search-section-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $color-text-primary;
    }

    .search-section-count {
      font-size: $font-sm;
      color: $color-text-tertiary;
    }
  }

  .section-empty {
    padding: $spacing-md;
    font-size: $font-sm;
    color: $color-text-tertiary;
    text-align: center;
    background: $color-bg-card;
    border-radius: $radius-sm;
    margin-bottom: $spacing-sm;
  }
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;

  .faq-item {
    padding: $spacing-md;

    .faq-question {
      display: flex;
      align-items: center;
      gap: $spacing-xs;

      .faq-q {
        flex: 1;
        font-size: $font-base;
        color: $color-text-primary;
        font-weight: 600;
      }

      .faq-toggle {
        font-size: $font-sm;
        color: $color-text-tertiary;
      }
    }

    .faq-answer {
      margin-top: $spacing-sm;
      padding-top: $spacing-sm;
      border-top: 1rpx solid $color-border-light;

      .faq-a {
        font-size: $font-sm;
        color: $color-text-secondary;
        line-height: 1.6;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx $spacing-lg;

  .empty-icon { font-size: 96rpx; }
  .empty-text {
    font-size: $font-base;
    color: $color-text-secondary;
    margin-top: $spacing-md;
    text-align: center;
  }

  .empty-contact {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-top: $spacing-lg;
    padding: $spacing-sm $spacing-lg;
    background: $color-primary-light;
    border-radius: $radius-full;

    .empty-contact-text {
      font-size: $font-base;
      color: $color-primary-dark;
      font-weight: 600;
    }

    .empty-contact-arrow {
      color: $color-primary;
      font-size: $font-xl;
    }
  }
}

.loading-state {
  text-align: center;
  padding: $spacing-md;
  font-size: $font-sm;
  color: $color-text-tertiary;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
