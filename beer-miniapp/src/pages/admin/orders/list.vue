<template>
  <view class="page-container">
    <!-- 状态筛选 -->
    <scroll-view scroll-x class="status-bar">
      <view class="status-inner">
        <view
          v-for="f in statusFilters"
          :key="f.value"
          class="status-tag"
          :class="{ 'status-tag--active': activeStatus === f.value }"
          @tap="setStatus(f.value)"
        >
          {{ f.label }}
        </view>
      </view>
    </scroll-view>

    <scroll-view scroll-y class="list-scroll" @scrolltolower="() => {}">
      <view v-if="loading" class="loading-state">加载中...</view>
      <view v-else-if="orders.length === 0" class="empty-state">
        <text class="empty-icon">🔧</text>
        <text class="empty-text">暂无报修工单</text>
      </view>
      <view v-else class="order-list">
        <view
          class="order-card card"
          v-for="order in orders"
          :key="order.id"
          @tap="openOrderDetail(order)"
        >
          <view class="order-header">
            <view>
              <text class="order-name">{{ order.customer_name }}</text>
              <text class="order-phone" @tap.stop="callCustomer(order.phone)">
                {{ order.phone }} 📞
              </text>
            </view>
            <StatusBadge type="repair" :status="order.status" />
          </view>

          <view class="order-meta">
            <text class="meta-item">{{ deviceLabel(order.device_type) }}</text>
            <text class="meta-sep">·</text>
            <text class="meta-item">{{ relativeTime(order.created_at) }}</text>
          </view>

          <text class="order-desc">{{ order.issue_desc }}</text>

          <view class="order-images" v-if="order.issue_images?.length">
            <image
              v-for="(img, i) in order.issue_images.slice(0, 3)"
              :key="i"
              :src="img"
              mode="aspectFill"
              class="order-img"
              @tap.stop="previewImages(order.issue_images, i)"
            />
          </view>

          <!-- 已派单信息 -->
          <view class="order-assignee" v-if="order.assignee">
            <text class="assignee-label">派单给：</text>
            <text class="assignee-value">{{ order.assignee }}</text>
          </view>

          <!-- 处理备注 -->
          <view class="handler-note" v-if="order.handler_notes">
            <text class="handler-label">处理备注：</text>
            <text class="handler-text">{{ order.handler_notes }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 工单详情弹窗 -->
    <uni-popup ref="detailPopup" type="bottom" background-color="#fff">
      <view class="detail-popup" v-if="selectedOrder">
        <view class="popup-title">
          <text>更新工单状态</text>
          <text class="popup-close" @tap="closePopup">✕</text>
        </view>

        <!-- 状态更新 -->
        <view class="popup-section">
          <text class="popup-label">工单状态</text>
          <view class="status-options">
            <view
              v-for="s in orderStatuses"
              :key="s.value"
              class="status-opt"
              :class="{ 'status-opt--active': selectedOrder.status === s.value }"
              @tap="selectedOrder.status = s.value"
            >
              {{ s.label }}
            </view>
          </view>
        </view>

        <!-- 指派说明（仅 assigned 状态显示） -->
        <view class="popup-section" v-if="selectedOrder.status === 'assigned'">
          <text class="popup-label">指派说明（如：派给张师傅）</text>
          <input
            class="popup-input"
            v-model="selectedOrder.assignee"
            placeholder="填写指派对象（师傅姓名等）"
            placeholder-class="popup-placeholder"
          />
        </view>

        <!-- 处理备注 -->
        <view class="popup-section">
          <text class="popup-label">处理备注</text>
          <textarea
            class="popup-textarea"
            v-model="selectedOrder.handler_notes"
            placeholder="填写处理情况、结果等..."
            placeholder-class="popup-placeholder"
            :auto-height="true"
          />
        </view>

        <button
          class="btn-primary popup-save-btn"
          :loading="saving"
          @tap="saveOrder"
        >
          保存
        </button>
        <view style="height: calc(24rpx + env(safe-area-inset-bottom));"></view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatusBadge from '../../../components/StatusBadge/index.vue'
import { useRepairOrders } from '../../../composables/useRepairOrders'
import { formatDeviceType, formatRelativeTime } from '../../../utils/format'
import type { RepairOrder } from '../../../types/database'

const { fetchAllRepairOrders, updateOrderStatus } = useRepairOrders()

const orders = ref<RepairOrder[]>([])
const loading = ref(false)
const activeStatus = ref('all')
const selectedOrder = ref<RepairOrder | null>(null)
const saving = ref(false)
const detailPopup = ref()

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '已派单', value: 'assigned' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'done' }
]

const orderStatuses = [
  { label: '待处理', value: 'pending' },
  { label: '已派单', value: 'assigned' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'done' }
]

function deviceLabel(t: string) { return formatDeviceType(t) }
function relativeTime(t: string) { return formatRelativeTime(t) }

async function loadOrders() {
  loading.value = true
  try {
    orders.value = await fetchAllRepairOrders({
      status: activeStatus.value as RepairOrder['status'] | 'all'
    })
  } finally {
    loading.value = false
  }
}

function setStatus(val: string) {
  activeStatus.value = val
  loadOrders()
}

function openOrderDetail(order: RepairOrder) {
  selectedOrder.value = { ...order }
  detailPopup.value?.open()
}

function closePopup() {
  detailPopup.value?.close()
  selectedOrder.value = null
}

async function saveOrder() {
  if (!selectedOrder.value) return
  saving.value = true
  try {
    await updateOrderStatus(
      selectedOrder.value.id,
      selectedOrder.value.status,
      {
        assignee: selectedOrder.value.assignee || undefined,
        handler_notes: selectedOrder.value.handler_notes || undefined
      }
    )
    const idx = orders.value.findIndex(o => o.id === selectedOrder.value!.id)
    if (idx >= 0) orders.value[idx] = { ...selectedOrder.value! }
    closePopup()
    uni.showToast({ title: '工单已更新', icon: 'success' })
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function callCustomer(phone: string) {
  uni.makePhoneCall({ phoneNumber: phone })
}

function previewImages(images: string[], idx: number) {
  uni.previewImage({ urls: images, current: images[idx] })
}

onShow(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.status-bar {
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border;
  white-space: nowrap;

  .status-inner {
    display: inline-flex;
    padding: $spacing-xs $spacing-sm;
    gap: $spacing-xs;
  }

  .status-tag {
    display: inline-block;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-full;
    font-size: $font-sm;
    color: $color-text-secondary;
    background: $color-bg;

    &--active {
      background: $color-primary;
      color: $color-text-white;
      font-weight: 600;
    }
  }
}

.list-scroll { flex: 1; }

.order-list {
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .order-card {
    .order-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: $spacing-xs;

      .order-name {
        display: block;
        font-size: $font-base;
        font-weight: 700;
        color: $color-text-primary;
      }

      .order-phone {
        display: block;
        font-size: $font-sm;
        color: $color-primary;
        margin-top: 4rpx;
      }
    }

    .order-meta {
      display: flex;
      gap: 8rpx;
      margin-bottom: $spacing-xs;

      .meta-item { font-size: $font-sm; color: $color-text-secondary; }
      .meta-sep { font-size: $font-sm; color: $color-text-placeholder; }
    }

    .order-desc {
      display: block;
      font-size: $font-base;
      color: $color-text-secondary;
      line-height: $line-height-base;
      margin-bottom: $spacing-xs;
    }

    .order-images {
      display: flex;
      gap: $spacing-xs;
      margin-bottom: $spacing-xs;

      .order-img {
        width: 120rpx;
        height: 120rpx;
        border-radius: $radius-sm;
      }
    }

    .order-assignee,
    .handler-note {
      display: flex;
      gap: $spacing-xs;
      padding: $spacing-xs;
      background: $color-bg;
      border-radius: $radius-sm;
      margin-top: $spacing-xs;

      .assignee-label,
      .handler-label { font-size: $font-sm; color: $color-text-secondary; }
      .assignee-value,
      .handler-text { font-size: $font-sm; color: $color-text-primary; }
    }
  }
}

// 弹窗
.detail-popup {
  padding: $spacing-md;
  min-height: 60vh;

  .popup-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-md;

    .popup-close {
      font-size: $font-lg;
      color: $color-text-secondary;
    }
  }

  .popup-section {
    margin-bottom: $spacing-md;

    .popup-label {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      margin-bottom: $spacing-xs;
    }

    .status-options {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-xs;

      .status-opt {
        padding: $spacing-xs $spacing-sm;
        border: 2rpx solid $color-border;
        border-radius: $radius-full;
        font-size: $font-sm;
        color: $color-text-secondary;

        &--active {
          border-color: $color-primary;
          color: $color-primary;
          background: $color-primary-light;
          font-weight: 600;
        }
      }
    }

    .popup-input {
      height: 72rpx;
      font-size: $font-base;
      color: $color-text-primary;
      border-bottom: 1rpx solid $color-border;
      width: 100%;
    }

    .popup-placeholder { color: $color-text-placeholder; }

    .popup-textarea {
      width: 100%;
      min-height: 120rpx;
      font-size: $font-base;
      color: $color-text-primary;
      border: 1rpx solid $color-border;
      border-radius: $radius-sm;
      padding: $spacing-sm;
    }
  }

  .popup-save-btn {
    width: 100%;
    margin-top: $spacing-sm;
  }
}
</style>
