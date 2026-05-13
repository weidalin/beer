<template>
  <view class="page-container">
    <scroll-view scroll-y>
      <view class="faq-header">
        <text class="faq-header-title">常见问题</text>
      </view>

      <view class="faq-list">
        <view
          class="faq-item card"
          v-for="(item, idx) in faqs"
          :key="idx"
          @tap="toggle(idx)"
        >
          <view class="faq-question">
            <text class="faq-index">Q{{ idx + 1 }}</text>
            <text class="faq-q">{{ item.q }}</text>
            <text class="faq-toggle">{{ item.open ? '▲' : '▼' }}</text>
          </view>
          <view v-if="item.open" class="faq-answer">
            <text class="faq-a">{{ item.a }}</text>
          </view>
        </view>
      </view>

      <!-- 未找到答案 -->
      <view class="contact-tip card" style="margin: 0 24rpx 48rpx;">
        <text class="tip-title">没找到你想要的答案？</text>
        <text class="tip-desc">直接联系我们，专属客服为您解答</text>
        <view class="tip-btns">
          <button class="btn-primary" style="flex: 1;" @tap="callPhone">拨打电话</button>
          <button class="btn-outline" style="flex: 1;" open-type="contact">微信客服</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAppStore } from '../../stores/app'
import { FAQ_DATA } from '../../constants/faqData'

const appStore = useAppStore()

const faqs = reactive(FAQ_DATA.map(item => ({ ...item, open: false })))

function toggle(idx: number) {
  faqs[idx].open = !faqs[idx].open
}

function callPhone() {
  appStore.callPhone()
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $color-bg;
}

.faq-header {
  background: $color-primary-dark;
  padding: $spacing-xl $spacing-lg;

  .faq-header-title {
    font-size: $font-xxl;
    font-weight: 700;
    color: $color-text-white;
  }
}

.faq-list {
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .faq-item {
    .faq-question {
      display: flex;
      align-items: flex-start;
      gap: $spacing-sm;

      .faq-index {
        flex-shrink: 0;
        width: 48rpx;
        height: 48rpx;
        background: $color-primary;
        color: $color-text-white;
        border-radius: $radius-sm;
        font-size: $font-xs;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .faq-q {
        flex: 1;
        font-size: $font-base;
        font-weight: 600;
        color: $color-text-primary;
        line-height: $line-height-base;
      }

      .faq-toggle {
        color: $color-text-tertiary;
        font-size: $font-sm;
        flex-shrink: 0;
      }
    }

    .faq-answer {
      margin-top: $spacing-sm;
      padding-top: $spacing-sm;
      border-top: 1rpx solid $color-border-light;
      padding-left: 64rpx;

      .faq-a {
        font-size: $font-base;
        color: $color-text-secondary;
        line-height: $line-height-loose;
      }
    }
  }
}

.contact-tip {
  .tip-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  .tip-desc {
    display: block;
    font-size: $font-base;
    color: $color-text-secondary;
    margin-bottom: $spacing-md;
  }

  .tip-btns {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
