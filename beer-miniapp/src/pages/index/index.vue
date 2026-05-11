<template>
  <view class="page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <image class="nav-logo" src="/static/images/logo.png" mode="aspectFit" />
        <text class="nav-title">广东精酿啤酒一站式供应链</text>
        <view class="nav-phone" @tap="appStore.callPhone()">
          <text class="nav-phone-icon">📞</text>
        </view>
      </view>
    </view>
    <view :style="{ height: navBarHeight + 'px' }"></view>

    <scroll-view scroll-y class="page-scroll" @scrolltolower="onScrollEnd">
      <!-- Banner 轮播 -->
      <swiper
        class="banner"
        :autoplay="banners.length > 1"
        interval="3500"
        :circular="banners.length > 1"
        :indicator-dots="banners.length > 1"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#F5A623"
      >
        <swiper-item v-for="(banner, i) in banners" :key="i">
          <image :src="banner.image" mode="aspectFill" class="banner-img" />
        </swiper-item>
      </swiper>

      <!-- 三大核心优势 -->
      <view class="features card">
        <view class="feature-item" v-for="f in features" :key="f.label">
          <text class="feature-icon">{{ f.icon }}</text>
          <text class="feature-title">{{ f.title }}</text>
          <text class="feature-desc">{{ f.desc }}</text>
        </view>
      </view>

      <!-- 快捷入口 2×2 宫格 -->
      <view class="quick-entry">
        <view
          class="entry-item"
          v-for="entry in quickEntries"
          :key="entry.label"
          @tap="entry.action"
        >
          <view class="entry-icon-wrap">
            <text class="entry-icon">{{ entry.icon }}</text>
          </view>
          <text class="entry-label">{{ entry.label }}</text>
        </view>
      </view>

      <!-- 热门产品（横向滑动） -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门产品</text>
          <text class="section-more" @tap="goProducts">更多 ›</text>
        </view>
        <scroll-view scroll-x class="hot-products">
          <view class="hot-products-inner">
            <view
              v-for="product in hotProducts"
              :key="product.id"
              class="hot-product-card"
              @tap="goProductDetail(product.id)"
            >
              <image
                :src="product.cover_image || '/static/images/placeholder.png'"
                mode="aspectFill"
                lazy-load
                class="hot-product-img"
              />
              <text class="hot-product-name">{{ product.name }}</text>
              <text class="hot-product-price">{{ product.price_range || '面议' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 合作数据 -->
      <view class="stats card">
        <view class="stat-item" v-for="stat in stats" :key="stat.label">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>

      <!-- 客户口碑 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">客户口碑</text>
        </view>
        <view class="review-list">
          <view class="review-card card" v-for="review in reviews" :key="review.name">
            <view class="review-header">
              <text class="review-avatar">{{ review.avatar }}</text>
              <view>
                <text class="review-name">{{ review.name }}</text>
                <text class="review-biz">{{ review.biz }}</text>
              </view>
              <text class="review-stars">⭐⭐⭐⭐⭐</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
          </view>
        </view>
      </view>

      <view style="height: 32rpx;"></view>
    </scroll-view>

    <!-- 悬浮联系按钮 -->
    <FloatContact />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import FloatContact from '../../components/FloatContact/index.vue'
import { useProducts } from '../../composables/useProducts'
import { useAppStore } from '../../stores/app'
import type { Product } from '../../types/database'
import bannerHome from '../../assets/banners/banner-home.jpg'

const appStore = useAppStore()
const { fetchProducts } = useProducts()

const statusBarHeight = ref(0)
const navBarHeight = ref(0)
const hotProducts = ref<Product[]>([])

onMounted(async () => {
  // 获取状态栏高度
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0
  navBarHeight.value = statusBarHeight.value + 44

  // 加载热门产品
  try {
    hotProducts.value = await fetchProducts({ pageSize: 6 })
  } catch (e) {
    console.error('加载产品失败', e)
  }
})

// 首页轮播仅一张图，减小主包体积（原多图扫描已移除）
const banners = [{ image: bannerHome }]

const features = [
  { icon: '🍺', title: '鲜', desc: '桶装直供，当日鲜' },
  { icon: '⚡', title: '快', desc: '珠三角当日达' },
  { icon: '🔧', title: '稳', desc: '4小时维修响应' }
]

const quickEntries = [
  {
    icon: '📋',
    label: '了解方案',
    action: () => uni.switchTab({ url: '/pages/plans/index' })
  },
  {
    icon: '📅',
    label: '立即预约',
    action: () => uni.switchTab({ url: '/pages/booking/index' })
  },
  {
    icon: '🔧',
    label: '预约报修',
    action: () => uni.navigateTo({ url: '/pages/repair/form' })
  },
  {
    icon: '📞',
    label: '联系我们',
    action: () => appStore.callPhone()
  }
]

const stats = [
  { value: '300+', label: '合作档口' },
  { value: '5000+', label: '月配送桶数' },
  { value: '4h', label: '维修响应' }
]

const reviews = [
  {
    avatar: '👨‍🍳',
    name: '张老板',
    biz: '广州·大排档',
    content: '用了三年，鲜啤品质没得说，每次打电话都当天送到，维修也很快。'
  },
  {
    avatar: '👩‍💼',
    name: '李姐',
    biz: '深圳·宵夜档',
    content: '啤酒车质量很好，客人反馈不错，设备有问题当天就来修，放心！'
  },
  {
    avatar: '🧑‍🍳',
    name: '陈老板',
    biz: '佛山·夜市摊',
    content: '合作三年，价格公道，服务到位，强烈推荐给同行。'
  }
]

function goProducts() {
  uni.switchTab({ url: '/pages/products/list' })
}

function goProductDetail(id: string) {
  uni.navigateTo({ url: `/pages/products/detail?id=${id}` })
}

function onScrollEnd() {
  // 首页无需分页
}

onShareAppMessage(() => ({
  title: '鲜啤直供 · 大排档档主首选！',
  path: '/pages/index/index',
  imageUrl: '/static/images/share-cover.png'
}))

onShareTimeline(() => ({
  title: '我在用这家鲜啤供应商，稳！珠三角当日达',
  query: 'from=timeline'
}))
</script>

<style lang="scss" scoped>
.page {
  background: $color-bg;
  min-height: 100vh;
}

// 导航栏
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: $color-primary-dark;
  z-index: 100;

  .nav-content {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 $spacing-md;

    .nav-logo {
      width: 56rpx;
      height: 56rpx;
      border-radius: $radius-sm;
      margin-right: $spacing-sm;
    }

    .nav-title {
      flex: 1;
      font-size: $font-lg;
      font-weight: 700;
      color: $color-text-white;
    }

    .nav-phone {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .nav-phone-icon {
        font-size: 40rpx;
      }
    }
  }
}

.page-scroll {
  height: 100vh;
}

// Banner
.banner {
  height: 360rpx;
  
  .banner-img {
    width: 100%;
    height: 100%;
  }
}

// 三大优势
.features {
  margin: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: $spacing-md;

  .feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;

    .feature-icon {
      font-size: 48rpx;
    }

    .feature-title {
      font-size: $font-xl;
      font-weight: 700;
      color: $color-primary;
    }

    .feature-desc {
      font-size: $font-sm;
      color: $color-text-secondary;
    }
  }
}

// 快捷入口
.quick-entry {
  margin: 0 $spacing-md $spacing-md;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;

  .entry-item {
    background: $color-bg-card;
    border-radius: $radius-md;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    box-shadow: $shadow-sm;

    .entry-icon-wrap {
      width: 80rpx;
      height: 80rpx;
      background: $color-primary-light;
      border-radius: $radius-sm;
      display: flex;
      align-items: center;
      justify-content: center;

      .entry-icon {
        font-size: 40rpx;
      }
    }

    .entry-label {
      font-size: $font-base;
      font-weight: 600;
      color: $color-text-primary;
    }
  }
}

// 通用区块
.section {
  margin-bottom: $spacing-md;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm $spacing-md;

    .section-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $color-text-primary;
    }

    .section-more {
      font-size: $font-sm;
      color: $color-primary;
    }
  }
}

// 热门产品横向滑动
.hot-products {
  padding-left: $spacing-md;
  white-space: nowrap;

  .hot-products-inner {
    display: inline-flex;
    gap: $spacing-sm;
    padding-right: $spacing-md;
  }

  .hot-product-card {
    display: inline-flex;
    flex-direction: column;
    width: 220rpx;
    background: $color-bg-card;
    border-radius: $radius-md;
    overflow: hidden;
    box-shadow: $shadow-sm;

    .hot-product-img {
      width: 220rpx;
      height: 220rpx;
      background: $color-bg-gray;
    }

    .hot-product-name {
      padding: $spacing-xs $spacing-sm 2rpx;
      font-size: $font-sm;
      font-weight: 600;
      color: $color-text-primary;
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .hot-product-price {
      padding: 2rpx $spacing-sm $spacing-sm;
      font-size: $font-sm;
      color: $color-danger;
    }
  }
}

// 合作数据
.stats {
  margin: 0 $spacing-md $spacing-md;
  display: flex;
  justify-content: space-around;
  padding: $spacing-lg $spacing-md;
  background: $color-primary-dark;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-value {
      font-size: $font-title;
      font-weight: 700;
      color: $color-primary;
    }

    .stat-label {
      font-size: $font-sm;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4rpx;
    }
  }
}

// 口碑
.review-list {
  padding: 0 $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .review-card {
    .review-header {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-sm;

      .review-avatar {
        font-size: 56rpx;
      }

      .review-name {
        display: block;
        font-size: $font-base;
        font-weight: 600;
        color: $color-text-primary;
      }

      .review-biz {
        display: block;
        font-size: $font-sm;
        color: $color-text-secondary;
      }

      .review-stars {
        margin-left: auto;
        font-size: $font-sm;
      }
    }

    .review-content {
      font-size: $font-base;
      color: $color-text-secondary;
      line-height: $line-height-loose;
    }
  }
}
</style>
