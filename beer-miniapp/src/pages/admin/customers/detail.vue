<template>
  <view class="page-container" v-if="customer">
    <scroll-view scroll-y>
      <!-- 客户基本信息 -->
      <view class="info-card card" style="margin: 24rpx 24rpx 16rpx;">
        <view class="info-header">
          <text class="customer-name">{{ customer.name }}</text>
          <StatusBadge type="customer" :status="customer.status" />
        </view>

        <view class="info-row" @tap="callCustomer">
          <text class="info-label">联系电话</text>
          <text class="info-value info-value--link">{{ customer.phone }} 📞</text>
        </view>
        <view class="info-row" v-if="customer.address">
          <text class="info-label">档口地址</text>
          <text class="info-value">{{ customer.address }}</text>
        </view>
        <view class="info-row" v-if="customer.biz_type">
          <text class="info-label">营业类型</text>
          <text class="info-value">{{ formatBizType(customer.biz_type) }}</text>
        </view>
        <view class="info-row" v-if="customer.daily_volume">
          <text class="info-label">日均销量</text>
          <text class="info-value">{{ formatVolume(customer.daily_volume) }}</text>
        </view>
        <view class="info-row" v-if="customer.interested_plan">
          <text class="info-label">意向方案</text>
          <text class="info-value">{{ formatPlan(customer.interested_plan) }}</text>
        </view>
        <view class="info-row" v-if="customer.need_beer_car">
          <text class="info-label">啤酒车需求</text>
          <text class="info-value">{{ customer.beer_car_type === 'buy' ? '购买' : '租赁' }}</text>
        </view>
        <view class="info-row" v-if="customer.delivery_area">
          <text class="info-label">配送地区</text>
          <text class="info-value">{{ formatDeliveryArea(customer.delivery_area) }}</text>
        </view>
        <view class="info-row" v-if="customer.notes">
          <text class="info-label">客户备注</text>
          <text class="info-value">{{ customer.notes }}</text>
        </view>
        <view class="info-row" style="border-bottom: none;">
          <text class="info-label">提交时间</text>
          <text class="info-value">{{ formatDate(customer.created_at, 'YYYY-MM-DD HH:mm') }}</text>
        </view>
      </view>

      <!-- 跟进状态更新 -->
      <view class="follow-card card" style="margin: 0 24rpx 16rpx;">
        <text class="section-title">跟进状态</text>
        <view class="status-options">
          <view
            v-for="opt in statusOptions"
            :key="opt.value"
            class="status-opt"
            :class="{ 'status-opt--active': customer.status === opt.value }"
            :style="customer.status === opt.value ? { borderColor: opt.color, background: opt.color + '20', color: opt.color } : {}"
            @tap="updateStatus(opt.value)"
          >
            {{ opt.label }}
          </view>
        </view>
      </view>

      <!-- 内部跟进备注 -->
      <view class="note-card card" style="margin: 0 24rpx 48rpx;">
        <view class="note-header">
          <text class="section-title">内部跟进备注</text>
          <text class="note-hint">（仅内部可见）</text>
        </view>
        <textarea
          class="note-textarea"
          v-model="followNote"
          placeholder="记录跟进内容、沟通情况、客户反馈等..."
          placeholder-class="note-placeholder"
          :auto-height="true"
          maxlength="500"
        />
        <button
          class="btn-primary note-save-btn"
          :loading="savingNote"
          @tap="saveFollowNote"
        >
          保存备注
        </button>
      </view>
    </scroll-view>
  </view>

  <view v-else-if="loading" class="loading-state" style="height: 100vh;">加载中...</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import StatusBadge from '../../../components/StatusBadge/index.vue'
import { useCustomers } from '../../../composables/useCustomers'
import {
  formatBizType,
  formatVolume,
  formatPlan,
  formatDeliveryArea,
  formatDate
} from '../../../utils/format'
import type { Customer } from '../../../types/database'

const { fetchCustomerDetail, updateCustomerStatus, updateFollowNote } = useCustomers()

const customer = ref<Customer | null>(null)
const loading = ref(true)
const followNote = ref('')
const savingNote = ref(false)

const statusOptions = [
  { label: '待跟进', value: 'pending', color: '#FF9900' },
  { label: '已联系', value: 'contacted', color: '#409EFF' },
  { label: '已签约', value: 'signed', color: '#2DB884' },
  { label: '已流失', value: 'lost', color: '#999999' }
]

onLoad(async (options) => {
  if (!options?.id) {
    loading.value = false
    return
  }
  customer.value = await fetchCustomerDetail(options.id)
  if (customer.value) {
    followNote.value = customer.value.follow_note || ''
  }
  loading.value = false
})

function callCustomer() {
  if (customer.value) {
    uni.makePhoneCall({ phoneNumber: customer.value.phone })
  }
}

async function updateStatus(status: Customer['status']) {
  if (!customer.value) return
  try {
    await updateCustomerStatus(customer.value.id, status)
    customer.value.status = status
    uni.showToast({ title: '状态已更新', icon: 'success' })
  } catch {
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

async function saveFollowNote() {
  if (!customer.value) return
  savingNote.value = true
  try {
    await updateFollowNote(customer.value.id, followNote.value)
    customer.value.follow_note = followNote.value
    uni.showToast({ title: '备注已保存', icon: 'success' })
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    savingNote.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $color-bg;
}

.info-card {
  .info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;

    .customer-name {
      font-size: $font-xl;
      font-weight: 700;
      color: $color-text-primary;
    }
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $color-border-light;

    .info-label {
      width: 160rpx;
      font-size: $font-sm;
      color: $color-text-secondary;
      flex-shrink: 0;
    }

    .info-value {
      flex: 1;
      font-size: $font-base;
      color: $color-text-primary;
      line-height: $line-height-base;

      &--link { color: $color-primary; }
    }
  }
}

.follow-card {
  .section-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-md;
  }

  .status-options {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .status-opt {
      padding: $spacing-xs $spacing-md;
      border: 2rpx solid $color-border;
      border-radius: $radius-full;
      font-size: $font-sm;
      color: $color-text-secondary;

      &--active {
        font-weight: 600;
      }
    }
  }
}

.note-card {
  .note-header {
    display: flex;
    align-items: baseline;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;

    .section-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $color-text-primary;
    }

    .note-hint {
      font-size: $font-sm;
      color: $color-text-tertiary;
    }
  }

  .note-textarea {
    width: 100%;
    min-height: 200rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border: 1rpx solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  .note-placeholder { color: $color-text-placeholder; }

  .note-save-btn {
    width: 100%;
  }
}
</style>
