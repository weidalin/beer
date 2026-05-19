<template>
  <view class="page-container">
    <scroll-view scroll-y class="detail-scroll">
      <view v-if="loading" class="loading-state">加载中...</view>

      <view v-else-if="!customer" class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">未找到该意向记录</text>
      </view>

      <view v-else>
        <!-- 头部 -->
        <view class="detail-header card" style="margin: 24rpx 24rpx 16rpx;">
          <view class="header-row">
            <text class="name">{{ customer.nickname }}</text>
            <view
              class="star-btn"
              @tap="toggleStar"
            >
              <text class="star-icon" :class="{ 'star-icon--on': customer.is_starred }">
                {{ customer.is_starred ? '★' : '☆' }}
              </text>
              <text class="star-label">{{ customer.is_starred ? '重要' : '标星' }}</text>
            </view>
          </view>
          <text class="created-time">提交于 {{ fullTime(customer.created_at) }}</text>
        </view>

        <!-- 联系方式 -->
        <view class="section card" style="margin: 0 24rpx 16rpx;">
          <text class="section-title">联系方式</text>
          <view class="detail-row">
            <text class="row-label">联系</text>
            <text class="row-value">{{ formatContact(customer) }}</text>
          </view>
          <view v-if="customer.address" class="detail-row">
            <text class="row-label">地址</text>
            <text class="row-value">{{ customer.address }}</text>
          </view>
          <view v-if="customer.location" class="detail-row">
            <text class="row-label">坐标</text>
            <text class="row-value">{{ customer.location.latitude.toFixed(4) }}, {{ customer.location.longitude.toFixed(4) }}</text>
          </view>
        </view>

        <!-- 经营信息 -->
        <view class="section card" style="margin: 0 24rpx 16rpx;">
          <text class="section-title">经营信息</text>
          <view class="detail-row">
            <text class="row-label">营业类型</text>
            <text class="row-value">{{ bizTypeLabel(customer.biz_type) }}</text>
          </view>
          <view class="detail-row">
            <text class="row-label">月均销量</text>
            <text class="row-value">{{ volumeLabel(customer.daily_volume) }}</text>
          </view>
          <view class="detail-row">
            <text class="row-label">感兴趣方案</text>
            <text class="row-value">{{ planLabel(customer.interested_plan) }}</text>
          </view>
          <view class="detail-row">
            <text class="row-label">啤酒车需求</text>
            <text class="row-value">{{ beerCarLabel(customer.need_beer_car) }}</text>
          </view>
          <view class="detail-row" style="border-bottom: none;">
            <text class="row-label">配送区域</text>
            <text class="row-value">{{ deliveryLabel(customer.delivery_area) }}</text>
          </view>
        </view>

        <!-- 备注 -->
        <view v-if="customer.notes" class="section card" style="margin: 0 24rpx 16rpx;">
          <text class="section-title">备注</text>
          <text class="notes-text">{{ customer.notes }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-bar">
          <view
            class="action-btn action-btn--star"
            :class="{ 'action-btn--star-on': customer.is_starred }"
            @tap="toggleStar"
          >{{ customer.is_starred ? '取消标星' : '设为重要' }}</view>
          <view class="action-btn action-btn--del" @tap="confirmDelete">删除意向</view>
        </view>

        <view style="height: 48rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCustomers } from '../../../composables/useCustomers'
import {
  formatBizType, formatPlan, formatVolume, formatDeliveryArea, formatDate
} from '../../../utils/format'
import type { Customer } from '../../../types/database'

const { fetchAllCustomers, starCustomer, deleteCustomer } = useCustomers()

const loading = ref(true)
const customer = ref<Customer | null>(null)

onLoad(async (options) => {
  const id = options?.id as string | undefined
  if (!id) { loading.value = false; return }
  try {
    const list = await fetchAllCustomers()
    customer.value = list.find(c => c._id === id) ?? null
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

function formatContact(c: Customer): string {
  if (c.contact?.trim()) return c.contact.trim()
  const parts: string[] = []
  if (c.phone) parts.push(c.phone)
  if (c.wechat_id) parts.push(`微信:${c.wechat_id}`)
  return parts.join(' / ') || '未留联系方式'
}

function bizTypeLabel(v: string | null) { return formatBizType(v) }
function planLabel(v: string | null) { return formatPlan(v) }
function volumeLabel(v: string | null) { return formatVolume(v) }
function deliveryLabel(v: string | null) { return formatDeliveryArea(v) }
function fullTime(t: string) { return formatDate(t, 'YYYY-MM-DD HH:mm') }

function beerCarLabel(v: string | null): string {
  if (!v) return '—'
  const map: Record<string, string> = { no: '不需要', buy: '需要购买', rent: '需要租赁' }
  return map[v] || v
}

async function toggleStar() {
  if (!customer.value) return
  const next = !customer.value.is_starred
  try {
    await starCustomer(customer.value._id, next)
    customer.value.is_starred = next
    uni.showToast({ title: next ? '已标为重要' : '已取消标星', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}

function confirmDelete() {
  if (!customer.value) return
  uni.showModal({
    title: '确认删除',
    content: '删除此意向记录？此操作不可恢复。',
    confirmColor: '#E84C3D',
    success: async (res) => {
      if (!res.confirm || !customer.value) return
      try {
        await deleteCustomer(customer.value._id)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 1200)
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.detail-scroll { flex: 1; }

.detail-header {
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-xs;
  }

  .name {
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-primary;
  }

  .star-btn {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-full;
    background: $color-bg;
    border: 1rpx solid $color-border;
  }

  .star-icon {
    font-size: 36rpx;
    color: $color-border;
    &--on { color: #F5A623; }
  }

  .star-label {
    font-size: $font-sm;
    color: $color-text-secondary;
  }

  .created-time {
    font-size: $font-sm;
    color: $color-text-tertiary;
  }
}

.section {
  .section-title {
    display: block;
    font-size: $font-sm;
    font-weight: 700;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 2rpx;
    margin-bottom: $spacing-sm;
  }
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: $spacing-sm 0;
  border-bottom: 1rpx solid $color-border-light;
  gap: $spacing-md;

  .row-label {
    flex-shrink: 0;
    width: 140rpx;
    font-size: $font-sm;
    color: $color-text-secondary;
    line-height: 1.6;
  }

  .row-value {
    flex: 1;
    font-size: $font-base;
    color: $color-text-primary;
    line-height: 1.6;
    word-break: break-all;
  }
}

.notes-text {
  display: block;
  font-size: $font-base;
  color: $color-text-primary;
  line-height: 1.7;
}

.action-bar {
  display: flex;
  gap: $spacing-sm;
  margin: 0 $spacing-md $spacing-md;

  .action-btn {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    border-radius: $radius-md;
    font-size: $font-base;
    font-weight: 600;

    &--star {
      background: $color-bg-card;
      color: $color-primary;
      border: 2rpx solid $color-primary;
      &-on {
        background: rgba(245, 166, 35, 0.1);
        color: #F5A623;
        border-color: #F5A623;
      }
    }

    &--del {
      background: rgba(232, 76, 61, 0.1);
      color: $color-danger;
      border: 2rpx solid $color-danger;
    }
  }
}
</style>
