<template>
  <view class="page-container">
    <scroll-view scroll-y>
      <!-- 品牌头图 -->
      <view class="brand-header">
        <image class="brand-logo" src="/static/images/logo.png" mode="aspectFit" />
        <text class="brand-name">广东精酿啤酒一站式供应链</text>
        <text class="brand-slogan">鲜啤直供 · 珠三角当日达</text>
      </view>

      <!-- 品牌介绍 -->
      <view class="card" style="margin: 24rpx;">
        <text class="section-title">关于我们</text>
        <text class="brand-intro">
          广东精酿啤酒一站式供应链是专注服务宵夜档、大排档、小型餐饮档口的桶装鲜啤直供品牌。我们提供桶装鲜啤配送、打酒机安装维护、啤酒车出售及租赁等一站式服务。

          {{ '\n\n' }}覆盖珠三角核心区域，提供当日达配送；粤港澳大湾区稳定供应，品质有保证。专业维修团队4小时响应，让您的生意无忧运营。
        </text>
      </view>

      <!-- 服务亮点 -->
      <view class="card" style="margin: 0 24rpx 24rpx;">
        <text class="section-title">服务优势</text>
        <view class="highlight-list">
          <view class="highlight-item" v-for="h in highlights" :key="h.title">
            <text class="highlight-icon">{{ h.icon }}</text>
            <view>
              <text class="highlight-title">{{ h.title }}</text>
              <text class="highlight-desc">{{ h.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系方式 -->
      <view class="card" style="margin: 0 24rpx 24rpx;">
        <text class="section-title">联系我们</text>
        <view class="contact-list">
          <view class="contact-item" @tap="appStore.callPhone()">
            <text class="contact-icon">📞</text>
            <view>
              <text class="contact-label">联系电话</text>
              <text class="contact-value">{{ appStore.contactPhone }}</text>
            </view>
            <button class="btn-primary btn-sm contact-btn" @tap.stop="appStore.callPhone()">
              立即拨打
            </button>
          </view>
          <view class="contact-item" @tap="appStore.copyWechat()">
            <text class="contact-icon">💬</text>
            <view>
              <text class="contact-label">微信号</text>
              <text class="contact-value">{{ appStore.contactWechat }}</text>
            </view>
            <button class="btn-outline btn-sm contact-btn" @tap.stop="appStore.copyWechat()">
              复制
            </button>
          </view>
        </view>
      </view>

      <view style="height: 48rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()

const highlights = [
  { icon: '🍺', title: '鲜啤直供', desc: '桶装新鲜直送，不经二次转运，品质有保证' },
  { icon: '🚚', title: '珠三角当日达', desc: '下单当日送达，让您的档口不断货' },
  { icon: '🔧', title: '专业维修团队', desc: '旗舰版4小时响应，全年无休保障服务' },
  { icon: '💰', title: '免押金起步', desc: '零门槛合作，降低您的创业成本' },
  { icon: '⚙️', title: '设备灵活选配', desc: '打酒机、啤酒车均支持出售或租赁' },
  { icon: '📊', title: '300+ 合作档口', desc: '经过市场验证的稳定供应商' }
]
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $color-bg;
}

.brand-header {
  background: $color-primary-dark;
  padding: $spacing-xxl $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;

  .brand-logo {
    width: 160rpx;
    height: 160rpx;
    border-radius: $radius-lg;
    margin-bottom: $spacing-md;
  }

  .brand-name {
    font-size: $font-xxl;
    font-weight: 700;
    color: $color-text-white;
    margin-bottom: $spacing-xs;
  }

  .brand-slogan {
    font-size: $font-base;
    color: rgba(255, 255, 255, 0.7);
  }
}

.section-title {
  display: block;
  font-size: $font-lg;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: $spacing-md;
}

.brand-intro {
  font-size: $font-base;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.highlight-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .highlight-item {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;

    .highlight-icon { font-size: 40rpx; flex-shrink: 0; }
    .highlight-title {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $color-text-primary;
    }
    .highlight-desc {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      margin-top: 4rpx;
    }
  }
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  .contact-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: $color-bg;
    border-radius: $radius-sm;

    .contact-icon { font-size: 40rpx; }
    .contact-label {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
    }
    .contact-value {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $color-text-primary;
    }
    .contact-btn {
      margin-left: auto;
      width: 160rpx;
    }
  }
}
</style>
