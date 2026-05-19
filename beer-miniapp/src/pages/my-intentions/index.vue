<template>
  <view class="page-container">
    <scroll-view scroll-y class="list-scroll">
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="list.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无提交记录</text>
        <text class="empty-hint">您还没有提交过合作意向</text>
        <view class="btn-primary empty-btn" @tap="goSubmit">去提交意向</view>
      </view>

      <view v-else class="intention-list">
        <view
          v-for="item in list"
          :key="item._id"
          class="intention-card card"
        >
          <view class="card-header">
            <text class="card-time">{{ relativeTime(item.created_at) }}</text>
            <text v-if="item.is_starred" class="card-starred">⭐ 重要</text>
          </view>

          <view class="card-row">
            <text class="row-label">联系方式</text>
            <text class="row-value">{{ item.contact || '—' }}</text>
          </view>

          <view v-if="item.biz_type" class="card-row">
            <text class="row-label">营业类型</text>
            <text class="row-value">{{ bizTypeLabel(item.biz_type) }}</text>
          </view>

          <view v-if="item.interested_plan" class="card-row">
            <text class="row-label">感兴趣方案</text>
            <text class="row-value tag tag--plan">{{ planLabel(item.interested_plan) }}</text>
          </view>

          <view v-if="item.daily_volume" class="card-row">
            <text class="row-label">月均销量</text>
            <text class="row-value">{{ volumeLabel(item.daily_volume) }}</text>
          </view>

          <view v-if="item.delivery_area" class="card-row">
            <text class="row-label">配送区域</text>
            <text class="row-value">{{ deliveryAreaLabel(item.delivery_area) }}</text>
          </view>

          <view v-if="item.address" class="card-row">
            <text class="row-label">档口地址</text>
            <text class="row-value row-value--wrap">{{ item.address }}</text>
          </view>

          <view v-if="item.notes" class="card-row">
            <text class="row-label">备注</text>
            <text class="row-value row-value--wrap">{{ item.notes }}</text>
          </view>
        </view>
      </view>

      <view style="height: 48rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCustomers } from '../../composables/useCustomers'
import { formatBizType, formatPlan, formatVolume, formatDeliveryArea, formatRelativeTime } from '../../utils/format'
import { useUserStore } from '../../stores/user'

const { fetchMyIntentions } = useCustomers()
const userStore = useUserStore()

const loading = ref(false)
const list = ref<Awaited<ReturnType<typeof fetchMyIntentions>>>([])

function bizTypeLabel(v: string | null) { return formatBizType(v) }
function planLabel(v: string | null) { return formatPlan(v) }
function volumeLabel(v: string | null) { return formatVolume(v) }
function deliveryAreaLabel(v: string | null) { return formatDeliveryArea(v) }
function relativeTime(t: string) { return formatRelativeTime(t) }

function goSubmit() {
  uni.switchTab({ url: '/pages/booking/index' })
}

async function loadData() {
  if (!userStore.isLoggedIn) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await fetchMyIntentions()
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => { void loadData() })
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.list-scroll {
  flex: 1;
  height: 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;

  .loading-text {
    font-size: $font-base;
    color: $color-text-tertiary;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx $spacing-lg;
  gap: $spacing-sm;

  .empty-icon {
    font-size: 80rpx;
    line-height: 1;
    margin-bottom: $spacing-xs;
  }

  .empty-text {
    font-size: $font-lg;
    font-weight: 600;
    color: $color-text-primary;
  }

  .empty-hint {
    font-size: $font-sm;
    color: $color-text-tertiary;
    margin-bottom: $spacing-sm;
  }

  .empty-btn {
    margin-top: $spacing-sm;
    padding: $spacing-sm $spacing-xl;
    border-radius: $radius-full;
    font-size: $font-base;
  }
}

.intention-list {
  padding: $spacing-sm;
}

.intention-card {
  margin-bottom: $spacing-sm;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;
    padding-bottom: $spacing-xs;
    border-bottom: 1rpx solid $color-border-light;

    .card-time {
      font-size: $font-xs;
      color: $color-text-tertiary;
    }

    .card-starred {
      font-size: $font-xs;
      color: #F5A623;
      font-weight: 600;
    }
  }
}

.card-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-xs 0;

  .row-label {
    flex-shrink: 0;
    width: 140rpx;
    font-size: $font-sm;
    color: $color-text-secondary;
  }

  .row-value {
    flex: 1;
    font-size: $font-sm;
    color: $color-text-primary;
    font-weight: 500;

    &--wrap {
      white-space: pre-wrap;
      word-break: break-all;
    }

    &.tag--plan {
      color: #7B68EE;
      background: rgba(123, 104, 238, 0.1);
      border-radius: $radius-full;
      padding: 2rpx 16rpx;
      font-size: $font-xs;
      font-weight: 600;
      flex: none;
    }
  }
}
</style>
