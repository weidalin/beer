<template>
  <view class="page-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view
        v-for="f in filters"
        :key="f.value"
        class="filter-tag"
        :class="{ 'filter-tag--active': activeFilter === f.value }"
        @tap="setFilter(f.value)"
      >{{ f.label }}</view>
    </view>

    <scroll-view scroll-y class="list-scroll">
      <view v-if="loading" class="loading-state">加载中...</view>

      <view v-else-if="filtered.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无意向记录</text>
      </view>

      <view v-else class="customer-list">
        <view
          v-for="c in filtered"
          :key="c._id"
          class="customer-card card"
          @tap="goDetail(c._id)"
        >
          <!-- 标星标记 -->
          <view v-if="c.is_starred" class="star-badge">⭐ 重要</view>

          <view class="card-main">
            <view class="card-left">
              <text class="customer-name">{{ c.nickname }}</text>
              <text class="customer-contact">{{ formatContact(c) }}</text>
              <view class="customer-tags">
                <text v-if="c.biz_type" class="tag">{{ bizTypeLabel(c.biz_type) }}</text>
                <text v-if="c.interested_plan" class="tag tag--plan">{{ planLabel(c.interested_plan) }}</text>
                <text v-if="c.daily_volume" class="tag tag--vol">{{ volumeLabel(c.daily_volume) }}</text>
              </view>
              <text class="customer-time">{{ relativeTime(c.created_at) }}</text>
            </view>
            <view class="card-actions" @tap.stop>
              <text
                class="action-star"
                :class="{ 'action-star--on': c.is_starred }"
                @tap="toggleStar(c)"
              >{{ c.is_starred ? '★' : '☆' }}</text>
              <text class="action-del" @tap="confirmDelete(c)">🗑</text>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 48rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useCustomers } from '../../../composables/useCustomers'
import {
  formatBizType, formatPlan, formatVolume, formatRelativeTime
} from '../../../utils/format'
import type { Customer } from '../../../types/database'

const { fetchAllCustomers, starCustomer, deleteCustomer } = useCustomers()

const loading = ref(false)
const customers = ref<Customer[]>([])
const activeFilter = ref<'all' | 'starred'>('all')

const filters = [
  { label: '全部', value: 'all' },
  { label: '⭐ 重要', value: 'starred' }
]

const filtered = computed(() =>
  activeFilter.value === 'starred'
    ? customers.value.filter(c => c.is_starred)
    : customers.value
)

function setFilter(v: 'all' | 'starred') {
  activeFilter.value = v
}

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
function relativeTime(t: string) { return formatRelativeTime(t) }

async function loadData() {
  loading.value = true
  try {
    customers.value = await fetchAllCustomers()
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(() => { void loadData() })

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/admin/customers/detail?id=${id}` })
}

async function toggleStar(c: Customer) {
  const next = !c.is_starred
  try {
    await starCustomer(c._id, next)
    c.is_starred = next
    uni.showToast({ title: next ? '已标为重要' : '已取消标星', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '操作失败', icon: 'none' })
  }
}

function confirmDelete(c: Customer) {
  uni.showModal({
    title: '确认删除',
    content: `删除「${c.nickname}」的意向记录？此操作不可恢复。`,
    confirmColor: '#E84C3D',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteCustomer(c._id)
        customers.value = customers.value.filter(x => x._id !== c._id)
        uni.showToast({ title: '已删除', icon: 'success' })
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

.filter-bar {
  display: flex;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border;

  .filter-tag {
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-full;
    font-size: $font-sm;
    color: $color-text-secondary;
    background: $color-bg;
    border: 1rpx solid $color-border;

    &--active {
      background: $color-primary;
      color: $color-text-white;
      border-color: $color-primary;
      font-weight: 600;
    }
  }
}

.list-scroll {
  flex: 1;
  height: 0;
}

.customer-list {
  padding: $spacing-sm;
}

.customer-card {
  margin-bottom: $spacing-sm;
  position: relative;
  overflow: hidden;

  .star-badge {
    font-size: $font-xs;
    color: #F5A623;
    font-weight: 600;
    margin-bottom: $spacing-xs;
  }
}

.card-main {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
}

.card-left {
  flex: 1;
  min-width: 0;

  .customer-name {
    display: block;
    font-size: $font-base;
    font-weight: 700;
    color: $color-text-primary;
  }

  .customer-contact {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-top: 4rpx;
  }

  .customer-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-top: $spacing-xs;
  }

  .tag {
    font-size: $font-xs;
    color: $color-primary;
    background: $color-primary-light;
    border-radius: $radius-full;
    padding: 2rpx 12rpx;

    &--plan { color: #7B68EE; background: rgba(123, 104, 238, 0.1); }
    &--vol  { color: $color-success; background: rgba(45, 184, 132, 0.1); }
  }

  .customer-time {
    display: block;
    font-size: $font-xs;
    color: $color-text-tertiary;
    margin-top: $spacing-xs;
  }
}

.card-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  flex-shrink: 0;
  padding-top: 4rpx;

  .action-star {
    font-size: 44rpx;
    color: $color-border;
    line-height: 1;
    &--on { color: #F5A623; }
  }

  .action-del {
    font-size: 36rpx;
    line-height: 1;
  }
}
</style>
