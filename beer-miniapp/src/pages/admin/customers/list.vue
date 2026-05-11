<template>
  <view class="page-container">
    <!-- 搜索 + 筛选 -->
    <view class="top-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索姓名或电话"
          placeholder-class="search-placeholder"
          @input="onSearch"
        />
      </view>
    </view>

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

    <scroll-view scroll-y class="list-scroll">
      <view v-if="loading" class="loading-state">加载中...</view>
      <view v-else-if="customers.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无客户记录</text>
      </view>
      <view v-else class="customer-list">
        <view
          class="customer-card card"
          v-for="customer in customers"
          :key="customer.id"
          @tap="goDetail(customer.id)"
        >
          <view class="customer-row">
            <view class="customer-main">
              <text class="customer-name">{{ customer.name }}</text>
              <text class="customer-phone">{{ customer.phone }}</text>
            </view>
            <StatusBadge type="customer" :status="customer.status" />
          </view>
          <view class="customer-meta-row">
            <text class="meta-item">{{ bizTypeLabel(customer.biz_type) }}</text>
            <text class="meta-sep">·</text>
            <text class="meta-item">{{ volumeLabel(customer.daily_volume) }}</text>
            <text class="meta-sep" v-if="customer.interested_plan">·</text>
            <text class="meta-item" v-if="customer.interested_plan">{{ planLabel(customer.interested_plan) }}</text>
          </view>
          <text class="customer-time">{{ relativeTime(customer.created_at) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import StatusBadge from '../../../components/StatusBadge/index.vue'
import { useCustomers } from '../../../composables/useCustomers'
import { formatBizType, formatVolume, formatPlan, formatRelativeTime } from '../../../utils/format'
import type { Customer } from '../../../types/database'

const { fetchAllCustomers } = useCustomers()

const customers = ref<Customer[]>([])
const loading = ref(false)
const keyword = ref('')
const activeStatus = ref('all')

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待跟进', value: 'pending' },
  { label: '已联系', value: 'contacted' },
  { label: '已签约', value: 'signed' },
  { label: '已流失', value: 'lost' }
]

function bizTypeLabel(t: string | null) { return formatBizType(t) }
function volumeLabel(v: string | null) { return formatVolume(v) }
function planLabel(p: string | null) { return formatPlan(p) }
function relativeTime(t: string) { return formatRelativeTime(t) }

async function loadCustomers() {
  loading.value = true
  try {
    customers.value = await fetchAllCustomers({
      status: activeStatus.value as Customer['status'] | 'all',
      keyword: keyword.value || undefined
    })
  } finally {
    loading.value = false
  }
}

function setStatus(val: string) {
  activeStatus.value = val
  loadCustomers()
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadCustomers, 500)
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/admin/customers/detail?id=${id}` })
}

onShow(() => {
  loadCustomers()
})
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.top-bar {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-card;

  .search-input-wrap {
    display: flex;
    align-items: center;
    background: $color-bg;
    border-radius: $radius-full;
    padding: $spacing-xs $spacing-sm;

    .search-icon { font-size: 28rpx; margin-right: $spacing-xs; }

    .search-input {
      flex: 1;
      height: 64rpx;
      font-size: $font-base;
      color: $color-text-primary;
    }

    .search-placeholder { color: $color-text-placeholder; }
  }
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

.customer-list {
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  .customer-card {
    .customer-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: $spacing-xs;

      .customer-main {
        .customer-name {
          display: block;
          font-size: $font-base;
          font-weight: 700;
          color: $color-text-primary;
        }
        .customer-phone {
          display: block;
          font-size: $font-sm;
          color: $color-text-secondary;
          margin-top: 4rpx;
        }
      }
    }

    .customer-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      margin-bottom: $spacing-xs;

      .meta-item { font-size: $font-sm; color: $color-text-secondary; }
      .meta-sep { font-size: $font-sm; color: $color-text-placeholder; }
    }

    .customer-time {
      font-size: $font-xs;
      color: $color-text-tertiary;
    }
  }
}
</style>
