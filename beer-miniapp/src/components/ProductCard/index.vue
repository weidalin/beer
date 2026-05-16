<template>
  <view class="product-card" @tap="goDetail">
    <view class="card-image-wrap">
      <image
        class="card-image"
        :src="product.cover_image || '/static/images/placeholder.png'"
        mode="aspectFill"
        lazy-load
      />
      <!-- 标签 -->
      <view class="card-tags" v-if="product.tags?.length">
        <view
          v-for="tag in product.tags.slice(0, 2)"
          :key="tag"
          class="tag"
          :class="`tag--${tag}`"
        >{{ tagLabel(tag) }}</view>
      </view>
    </view>
    <view class="card-body">
      <text class="card-name">{{ product.name }}</text>
      <text class="card-spec" v-if="product.spec">{{ product.spec }}</text>
      <view class="card-footer">
        <text class="card-price">{{ product.price_range || '面议' }}</text>
        <text class="card-type" v-if="product.category !== 'beer'">
          {{ supplyTypeLabel }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../../types/database'

const props = defineProps<{
  product: Product
}>()

const tagLabels: Record<string, string> = {
  hot: '热销',
  new: '新品',
  recommend: '推荐'
}

function tagLabel(tag: string): string {
  return tagLabels[tag] || tag
}

const supplyTypeLabel = computed(() => {
  const map: Record<string, string> = {
    sell: '出售',
    rent: '租赁',
    both: '售/租'
  }
  return map[props.product.supply_type] || ''
})

function goDetail() {
  uni.navigateTo({
    url: `/pages/products/detail?id=${props.product._id}`
  })
}
</script>

<style lang="scss" scoped>
.product-card {
  background: $color-bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;

  .card-image-wrap {
    position: relative;
    width: 100%;
    padding-top: 100%; // 1:1 aspect ratio

    .card-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: $color-bg-gray;
    }

    .card-tags {
      position: absolute;
      top: $spacing-xs;
      left: $spacing-xs;
      display: flex;
      flex-direction: column;
      gap: 4rpx;

      .tag {
        padding: 4rpx 10rpx;
        border-radius: $radius-sm;
        font-size: $font-xs;
        color: $color-text-white;
        line-height: 1.4;

        &--hot { background: $color-danger; }
        &--new { background: $color-success; }
        &--recommend { background: $color-primary; }
      }
    }
  }

  .card-body {
    padding: $spacing-sm;

    .card-name {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $color-text-primary;
      @include text-ellipsis-2;
      margin-bottom: 4rpx;
    }

    .card-spec {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      @include text-ellipsis;
      margin-bottom: $spacing-xs;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-price {
        font-size: $font-sm;
        color: $color-danger;
        font-weight: 600;
      }

      .card-type {
        font-size: $font-xs;
        color: $color-text-secondary;
        background: $color-bg-gray;
        padding: 2rpx 8rpx;
        border-radius: $radius-sm;
      }
    }
  }
}
</style>
