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

const appStore = useAppStore()

const faqs = reactive([
  { q: '如何开始合作？', a: '填写在线预约申请，我们会在1个工作日内联系您，了解您的需求后安排专属业务对接。', open: false },
  { q: '押金是多少？', a: '我们所有合作方案均免押金起步，签约后即可开始合作，无需支付押金。', open: false },
  { q: '配送范围覆盖哪些地区？', a: '珠三角核心区域（广州、深圳、佛山、东莞、中山、珠海等）提供当日达配送。其他省市可走物流，起订量另议。', open: false },
  { q: '桶装鲜啤的规格有哪些？', a: '提供30L、50L等多种规格，具体可咨询业务了解适合您档口的规格。', open: false },
  { q: '打酒机坏了怎么处理？', a: '拨打我们的服务电话或在小程序提交报修工单，标准版48小时、旗舰版4小时上门响应。基础版72小时内处理。', open: false },
  { q: '啤酒车可以只租不买吗？', a: '可以！啤酒车支持出售和租赁两种方式，不与任何合作方案强绑定，可单独选配，价格面议。', open: false },
  { q: '合同期有多长？', a: '合同期灵活，最短3个月起，具体可与我们的业务沟通确定适合您的合作周期。', open: false },
  { q: '付款方式是什么？', a: '本期采用线下/转账结算，价格面议。不接入在线支付，确保灵活便捷的合作方式。', open: false },
  { q: '小程序怎么管理产品和订单？', a: '供应商（管理员账号）在「我的」页面底部进入管理后台，可自主上下架产品、查看客户意向、处理报修工单。', open: false },
  { q: '如何申请成为合作商？', a: '点击小程序底部「预约」Tab，填写合作意向表单提交，或直接拨打电话咨询。', open: false }
])

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
