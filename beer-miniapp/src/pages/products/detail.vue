<template>
  <view class="page-container" v-if="product">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 图片轮播 -->
      <swiper
        class="product-swiper"
        :indicator-dots="allImages.length > 1"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#F5A623"
        circular
      >
        <swiper-item v-for="(img, i) in allImages" :key="i">
          <image
            :src="img"
            mode="aspectFill"
            class="swiper-img"
            @tap="previewImage(i)"
          />
        </swiper-item>
      </swiper>

      <!-- 产品信息 -->
      <view class="info-card card">
        <!-- 标签行 -->
        <view class="tag-row" v-if="product.tags?.length">
          <view
            v-for="tag in product.tags"
            :key="tag"
            class="tag"
            :class="`tag--${tag}`"
          >{{ tagLabel(tag) }}</view>
        </view>

        <text class="product-name">{{ product.name }}</text>

        <view class="meta-row">
          <view class="meta-item">
            <text class="meta-label">规格</text>
            <text class="meta-value">{{ product.spec || '详询' }}</text>
          </view>
          <view class="meta-item" v-if="product.category !== 'beer'">
            <text class="meta-label">供货方式</text>
            <text class="meta-value">{{ supplyTypeLabel }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">参考价格</text>
            <text class="meta-value meta-value--price">{{ product.price_range || '面议' }}</text>
          </view>
        </view>
      </view>

      <!-- 产品描述 -->
      <view class="desc-card card" v-if="product.description">
        <text class="desc-title">产品介绍</text>
        <text class="desc-content">{{ product.description }}</text>
      </view>

      <!-- 服务保障 -->
      <view class="guarantee-card card">
        <text class="desc-title">服务保障</text>
        <view class="guarantee-list">
          <view class="guarantee-item" v-for="g in guarantees" :key="g.label">
            <text class="guarantee-icon">{{ g.icon }}</text>
            <view>
              <text class="guarantee-label">{{ g.label }}</text>
              <text class="guarantee-desc">{{ g.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 160rpx;"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="btn-outline flex-1" @tap="onContact">咨询价格</button>
      <button class="btn-primary flex-1" @tap="onBooking">立即预约</button>
    </view>

    <FloatContact />
  </view>

  <!-- 加载中 -->
  <view v-else-if="loading" class="loading-state" style="height: 100vh;">
    加载中...
  </view>

  <!-- 加载失败 -->
  <view v-else class="empty-state" style="height: 100vh;">
    <text class="empty-icon">😔</text>
    <text class="empty-text">产品不存在或已下架</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import FloatContact from '../../components/FloatContact/index.vue'
import { useProducts } from '../../composables/useProducts'
import { useAppStore } from '../../stores/app'
import type { Product } from '../../types/database'

const { fetchProductDetail } = useProducts()
const appStore = useAppStore()

const product = ref<Product | null>(null)
const loading = ref(true)

const allImages = computed(() => {
  if (!product.value) return []
  const imgs: string[] = []
  if (product.value.cover_image) imgs.push(product.value.cover_image)
  imgs.push(...(product.value.images || []))
  return imgs.length > 0 ? imgs : ['/static/images/placeholder.png']
})

const supplyTypeLabel = computed(() => {
  const map: Record<string, string> = { sell: '仅出售', rent: '仅租赁', both: '出售 / 租赁均可' }
  return map[product.value?.supply_type || ''] || '—'
})

const tagLabels: Record<string, string> = { hot: '热销', new: '新品', recommend: '推荐' }

function tagLabel(tag: string): string {
  return tagLabels[tag] || tag
}

const guarantees = [
  { icon: '✅', label: '品质保证', desc: '桶装鲜啤直供，保鲜品质' },
  { icon: '🚚', label: '珠三角当日达', desc: '下单当日送达，外省走物流' },
  { icon: '🔧', label: '4小时维修响应', desc: '旗舰版客户专属' },
  { icon: '💬', label: '专属服务', desc: '一对一业务对接' }
]

onLoad(async (options) => {
  const id = options?.id
  if (!id) {
    loading.value = false
    return
  }
  try {
    product.value = await fetchProductDetail(id)
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
})

function previewImage(idx: number) {
  uni.previewImage({
    urls: allImages.value,
    current: allImages.value[idx]
  })
}

function onContact() {
  appStore.callPhone()
}

function onBooking() {
  uni.navigateTo({ url: '/pages/booking/index' })
}

onShareAppMessage(() => ({
  title: product.value?.name || '鲜啤直供 · 精酿啤酒一站式供应链',
  path: `/pages/products/detail?id=${product.value?._id}`,
  imageUrl: product.value?.cover_image || '/static/images/share-cover.png'
}))
</script>

<style lang="scss" scoped>
.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.detail-scroll {
  flex: 1;
  background: $color-bg;
}

// 轮播图
.product-swiper {
  height: 560rpx;
  background: $color-bg-gray;

  .swiper-img {
    width: 100%;
    height: 100%;
  }
}

// 产品信息卡片
.info-card {
  margin: $spacing-md;

  .tag-row {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;

    .tag {
      padding: 4rpx 12rpx;
      border-radius: $radius-sm;
      font-size: $font-xs;
      color: $color-text-white;

      &--hot { background: $color-danger; }
      &--new { background: $color-success; }
      &--recommend { background: $color-primary; }
    }
  }

  .product-name {
    display: block;
    font-size: $font-title;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-md;
  }

  .meta-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;

    .meta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-xs 0;
      border-bottom: 1rpx solid $color-border-light;

      .meta-label {
        font-size: $font-base;
        color: $color-text-secondary;
      }

      .meta-value {
        font-size: $font-base;
        color: $color-text-primary;
        font-weight: 500;

        &--price {
          color: $color-danger;
          font-size: $font-lg;
          font-weight: 700;
        }
      }
    }
  }
}

// 描述卡片
.desc-card {
  margin: 0 $spacing-md $spacing-md;

  .desc-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-sm;
  }

  .desc-content {
    font-size: $font-base;
    color: $color-text-secondary;
    line-height: $line-height-loose;
  }
}

// 服务保障
.guarantee-card {
  margin: 0 $spacing-md $spacing-md;

  .desc-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-sm;
  }

  .guarantee-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;

    .guarantee-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-sm;

      .guarantee-icon {
        font-size: 32rpx;
        flex-shrink: 0;
      }

      .guarantee-label {
        display: block;
        font-size: $font-base;
        font-weight: 600;
        color: $color-text-primary;
      }

      .guarantee-desc {
        display: block;
        font-size: $font-sm;
        color: $color-text-secondary;
        margin-top: 2rpx;
      }
    }
  }
}

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $color-bg-card;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.08);

  .flex-1 {
    flex: 1;
  }
}
</style>
