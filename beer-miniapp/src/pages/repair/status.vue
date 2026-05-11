<template>
  <view class="page-container">
    <view v-if="loading" class="loading-state" style="height: 60vh;">加载中...</view>

    <scroll-view v-else scroll-y>
      <view v-if="orders.length === 0" class="empty-state" style="height: 60vh;">
        <text class="empty-icon">🔧</text>
        <text class="empty-text">暂无报修工单</text>
        <button class="btn-primary" style="margin-top: 32rpx; width: 320rpx;" @tap="goForm">
          立即报修
        </button>
      </view>

      <view v-else class="order-list">
        <view class="order-card card" v-for="order in orders" :key="order.id">
          <view class="order-header">
            <view>
              <text class="order-device">{{ deviceLabel(order.device_type) }}</text>
              <text class="order-time">{{ formatDate(order.created_at, 'MM-DD HH:mm') }}</text>
            </view>
            <StatusBadge type="repair" :status="order.status" />
          </view>

          <text class="order-desc">{{ order.issue_desc }}</text>

          <!-- 故障图片 -->
          <view class="order-images" v-if="order.issue_images?.length">
            <image
              v-for="(img, i) in order.issue_images.slice(0, 3)"
              :key="i"
              :src="img"
              mode="aspectFill"
              class="order-img"
              @tap="previewImages(order.issue_images, i)"
            />
          </view>

          <!-- 状态进度 -->
          <view class="status-steps">
            <view
              v-for="(step, i) in statusSteps"
              :key="step.status"
              class="step"
              :class="{
                'step--done': isStepDone(order.status, step.status),
                'step--active': order.status === step.status
              }"
            >
              <view class="step-dot"></view>
              <text class="step-label">{{ step.label }}</text>
              <view class="step-line" v-if="i < statusSteps.length - 1"></view>
            </view>
          </view>

          <!-- 处理信息（仅对客户展示已派单的指派说明不展示，只展示 handler_notes） -->
          <view class="order-handler" v-if="order.handler_notes">
            <text class="handler-label">处理备注：</text>
            <text class="handler-note">{{ order.handler_notes }}</text>
          </view>

          <!-- 期望时间 -->
          <view class="order-meta" v-if="order.preferred_time">
            <text class="meta-label">期望上门：</text>
            <text class="meta-value">{{ formatDate(order.preferred_time, 'YYYY-MM-DD HH:mm') }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar" v-if="!loading && orders.length > 0">
      <button class="btn-primary" style="width: 100%;" @tap="goForm">再次报修</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StatusBadge from '../../components/StatusBadge/index.vue'
import { useRepairOrders } from '../../composables/useRepairOrders'
import { formatDate, formatDeviceType } from '../../utils/format'
import type { RepairOrder } from '../../types/database'

const { fetchMyRepairOrders } = useRepairOrders()

const orders = ref<RepairOrder[]>([])
const loading = ref(true)

const statusSteps = [
  { status: 'pending', label: '已提交' },
  { status: 'assigned', label: '已派单' },
  { status: 'processing', label: '处理中' },
  { status: 'done', label: '已完成' }
]

const statusOrder = ['pending', 'assigned', 'processing', 'done']

function isStepDone(current: string, step: string): boolean {
  return statusOrder.indexOf(current) >= statusOrder.indexOf(step)
}

function deviceLabel(type: string) {
  return formatDeviceType(type)
}

function previewImages(images: string[], idx: number) {
  uni.previewImage({ urls: images, current: images[idx] })
}

function goForm() {
  uni.navigateTo({ url: '/pages/repair/form' })
}

onMounted(async () => {
  try {
    orders.value = await fetchMyRepairOrders()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $color-bg;
}

.order-list {
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding-bottom: 140rpx;
}

.order-card {
  .order-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: $spacing-sm;

    .order-device {
      display: block;
      font-size: $font-base;
      font-weight: 700;
      color: $color-text-primary;
    }

    .order-time {
      display: block;
      font-size: $font-sm;
      color: $color-text-tertiary;
      margin-top: 2rpx;
    }
  }

  .order-desc {
    display: block;
    font-size: $font-base;
    color: $color-text-secondary;
    margin-bottom: $spacing-sm;
    line-height: $line-height-base;
  }

  .order-images {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;

    .order-img {
      width: 128rpx;
      height: 128rpx;
      border-radius: $radius-sm;
    }
  }

  .status-steps {
    display: flex;
    align-items: center;
    margin: $spacing-sm 0;
    padding: $spacing-sm;
    background: $color-bg;
    border-radius: $radius-sm;

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;

      .step-dot {
        width: 20rpx;
        height: 20rpx;
        border-radius: 50%;
        background: $color-border;
        margin-bottom: 8rpx;
      }

      .step-label {
        font-size: $font-xs;
        color: $color-text-tertiary;
      }

      .step-line {
        position: absolute;
        top: 10rpx;
        left: 50%;
        width: 100%;
        height: 4rpx;
        background: $color-border;
      }

      &--done {
        .step-dot { background: $color-success; }
        .step-label { color: $color-success; }
        .step-line { background: $color-success; }
      }

      &--active {
        .step-dot { background: $color-primary; border: 4rpx solid $color-primary-light; }
        .step-label { color: $color-primary; font-weight: 600; }
      }
    }
  }

  .order-handler {
    padding: $spacing-xs;
    background: $color-bg;
    border-radius: $radius-sm;
    margin-top: $spacing-xs;

    .handler-label {
      font-size: $font-sm;
      color: $color-text-secondary;
    }

    .handler-note {
      font-size: $font-sm;
      color: $color-text-primary;
    }
  }

  .order-meta {
    display: flex;
    gap: $spacing-xs;
    margin-top: $spacing-xs;

    .meta-label {
      font-size: $font-sm;
      color: $color-text-secondary;
    }

    .meta-value {
      font-size: $font-sm;
      color: $color-text-primary;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: $spacing-sm $spacing-md;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: $color-bg-card;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.08);
}
</style>
