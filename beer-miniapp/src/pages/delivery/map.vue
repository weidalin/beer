<template>
  <view class="page-container">
    <view class="map-header">
      <text class="map-title">配送覆盖区域</text>
      <text class="map-subtitle">珠三角当日达 · 其他省市走物流</text>
    </view>

    <!-- 地图（使用腾讯地图，显示珠三角范围） -->
    <map
      class="delivery-map"
      :longitude="113.5"
      :latitude="22.8"
      :scale="8"
      :markers="markers"
      :polygons="polygons"
      show-location
    />

    <!-- 配送说明 -->
    <view class="delivery-info">
      <view class="delivery-area card">
        <view class="area-item">
          <view class="area-dot area-dot--prd"></view>
          <view>
            <text class="area-name">珠三角区域（当日达）</text>
            <text class="area-cities">广州、深圳、佛山、东莞、中山、珠海、惠州、江门</text>
          </view>
        </view>
        <view class="area-item">
          <view class="area-dot area-dot--other"></view>
          <view>
            <text class="area-name">其他省市（走物流）</text>
            <text class="area-cities">可配送至全国，运费及起订量另议</text>
          </view>
        </view>
      </view>

      <view class="note card" style="margin-top: 16rpx;">
        <text class="note-title">📌 配送须知</text>
        <text class="note-item">• 珠三角区域：工作日当天下单，当日安排配送</text>
        <text class="note-item">• 其他省市：走快递物流，时效视线路而定</text>
        <text class="note-item">• 最小起订量：以合同约定为准，欢迎咨询</text>
      </view>

      <button class="btn-primary" style="margin: 16rpx; width: auto;" @tap="appStore.callPhone()">
        立即咨询配送详情
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()

const markers = [
  {
    id: 1,
    latitude: 23.129,
    longitude: 113.264,
    title: '广州仓库',
    iconPath: '/static/icons/warehouse.png',
    width: 40,
    height: 40
  }
]

// 珠三角大致多边形范围（示意）
const polygons = [
  {
    points: [
      { latitude: 23.9, longitude: 112.7 },
      { latitude: 23.9, longitude: 114.5 },
      { latitude: 21.8, longitude: 114.5 },
      { latitude: 21.8, longitude: 112.7 }
    ],
    strokeWidth: 2,
    strokeColor: '#F5A623CC',
    fillColor: '#F5A62330'
  }
]
</script>

<style lang="scss" scoped>
.page-container {
  background: $color-bg;
}

.map-header {
  background: $color-primary-dark;
  padding: $spacing-lg;

  .map-title {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-white;
    margin-bottom: $spacing-xs;
  }

  .map-subtitle {
    font-size: $font-base;
    color: rgba(255, 255, 255, 0.7);
  }
}

.delivery-map {
  width: 100%;
  height: 480rpx;
}

.delivery-info {
  padding: $spacing-md;

  .delivery-area {
    .area-item {
      display: flex;
      gap: $spacing-sm;
      padding: $spacing-sm 0;
      border-bottom: 1rpx solid $color-border-light;

      &:last-child { border-bottom: none; }

      .area-dot {
        width: 24rpx;
        height: 24rpx;
        border-radius: 50%;
        flex-shrink: 0;
        margin-top: 8rpx;

        &--prd { background: $color-primary; }
        &--other { background: $color-info; }
      }

      .area-name {
        display: block;
        font-size: $font-base;
        font-weight: 600;
        color: $color-text-primary;
        margin-bottom: 4rpx;
      }

      .area-cities {
        font-size: $font-sm;
        color: $color-text-secondary;
      }
    }
  }

  .note {
    .note-title {
      display: block;
      font-size: $font-base;
      font-weight: 700;
      color: $color-text-primary;
      margin-bottom: $spacing-sm;
    }

    .note-item {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      line-height: 2;
    }
  }
}
</style>
