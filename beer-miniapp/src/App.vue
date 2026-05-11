<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onLaunch(() => {
  // 从本地存储恢复用户信息
  userStore.loadFromStorage()
})

onShow(() => {
  // 小程序每次显示时的处理
})
</script>

<style lang="scss">
/* 全局样式 */

page {
  background-color: $color-bg;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: $font-base;
  color: $color-text-primary;
  line-height: $line-height-base;
}

// 全局 reset
view, text, image, scroll-view, swiper, swiper-item {
  box-sizing: border-box;
}

// 通用按钮
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $btn-height;
  background: $color-primary;
  color: $color-text-white;
  font-size: $font-lg;
  font-weight: 600;
  border-radius: $btn-radius;
  border: none;
  
  &::after {
    border: none;
  }
}

.btn-outline {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $btn-height;
  background: transparent;
  color: $color-primary;
  font-size: $font-lg;
  font-weight: 600;
  border-radius: $btn-radius;
  border: 2rpx solid $color-primary;
  
  &::after {
    border: none;
  }
}

.btn-sm {
  height: $btn-height-sm;
  font-size: $font-sm;
  padding: 0 $spacing-md;
}

// 通用容器
.page-container {
  min-height: 100vh;
  background-color: $color-bg;
  padding-bottom: calc(#{$spacing-lg} + env(safe-area-inset-bottom));
}

// 通用卡片
.card {
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: $spacing-md;
}

// 分割线
.divider {
  height: 1rpx;
  background: $color-border;
  margin: $spacing-sm 0;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xxl $spacing-lg;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: $spacing-md;
  }
  
  .empty-text {
    color: $color-text-tertiary;
    font-size: $font-base;
    text-align: center;
  }
}

// 加载状态
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  color: $color-text-tertiary;
  font-size: $font-sm;
}

// 列表项
.list-item {
  display: flex;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border-light;
  
  .list-item-content {
    flex: 1;
  }
  
  .list-item-arrow {
    color: $color-text-placeholder;
    font-size: $font-lg;
  }
}
</style>
