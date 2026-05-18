<template>
  <view class="page-container" v-if="userStore.isAdmin">
    <scroll-view
      scroll-y
      :refresher-enabled="true"
      @refresherrefresh="refresh"
      :refresher-triggered="refreshing"
    >
      <!-- 统计看板 -->
      <view class="stats-row">
        <view class="stat-card card">
          <text class="stat-value">{{ todayNew }}</text>
          <text class="stat-label">今日新增意向</text>
        </view>
        <view class="stat-card card">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label">累计意向客户</text>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="quick-actions card" style="margin: 0 24rpx 24rpx;">
        <text class="section-title">快捷操作</text>
        <view class="actions-grid">
          <view class="action-item" @tap="goAddProduct">
            <text class="action-icon">➕</text>
            <text class="action-label">新增产品</text>
          </view>
          <view class="action-item" @tap="goProducts">
            <text class="action-icon">🍺</text>
            <text class="action-label">产品管理</text>
          </view>
        </view>
      </view>

      <!-- 最新意向申请 -->
      <view class="section-card card" style="margin: 0 24rpx 48rpx;">
        <view class="section-header-row">
          <text class="section-title">最新合作意向</text>
        </view>

        <view v-if="latestCustomers.length === 0" class="empty-state-sm">
          <text class="empty-text-sm">暂无意向申请</text>
        </view>

        <view
          v-for="customer in latestCustomers"
          :key="customer._id"
          class="customer-item"
        >
          <view class="customer-info">
            <text class="customer-name">{{ customer.nickname }} · {{ formatContact(customer) }}</text>
            <text class="customer-meta">
              {{ bizTypeLabel(customer.biz_type) }} · {{ relativeTime(customer.created_at) }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>

  <!-- 未授权 -->
  <view v-else class="empty-state" style="height: 100vh;">
    <text class="empty-icon">🔒</text>
    <text class="empty-text">仅管理员可访问后台</text>
    <button class="btn-primary" style="margin-top: 32rpx; width: 320rpx;" @tap="goHome">
      返回首页
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../../stores/user'
import { useCustomers } from '../../../composables/useCustomers'
import { formatBizType, formatRelativeTime } from '../../../utils/format'
import type { Customer } from '../../../types/database'

const userStore = useUserStore()

const { getTodayNewCount, fetchAllCustomers } = useCustomers()

const todayNew = ref(0)
const totalCount = ref(0)
const latestCustomers = ref<Customer[]>([])
const refreshing = ref(false)

function bizTypeLabel(t: string | null) {
  return formatBizType(t)
}

function formatContact(c: Customer) {
  if (c.contact?.trim()) return c.contact.trim()
  const parts: string[] = []
  if (c.phone) parts.push(c.phone)
  if (c.wechat_id) parts.push(`微信:${c.wechat_id}`)
  return parts.length ? parts.join(' / ') : '未留联系方式'
}

function relativeTime(t: string) {
  return formatRelativeTime(t)
}

async function loadData() {
  try {
    const [newCount, customers] = await Promise.all([
      getTodayNewCount(),
      fetchAllCustomers()
    ])
    todayNew.value = newCount
    totalCount.value = customers.length
    latestCustomers.value = customers.slice(0, 5)
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function refresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}

onMounted(() => {
  if (userStore.isAdmin) loadData()
})

function goAddProduct() {
  uni.navigateTo({ url: '/pages/admin/products/edit' })
}

function goProducts() {
  uni.navigateTo({ url: '/pages/admin/products/list' })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.page-container {
  background: $color-bg;
  min-height: 100vh;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-sm;
  padding: $spacing-md;

  .stat-card {
    text-align: center;
    padding: $spacing-lg;

    .stat-value {
      display: block;
      font-size: 72rpx;
      font-weight: 700;
      color: $color-primary;
      line-height: 1.2;
    }

    .stat-label {
      display: block;
      font-size: $font-sm;
      color: $color-text-secondary;
      margin-top: $spacing-xs;
    }
  }
}

.quick-actions {
  .section-title {
    display: block;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-md;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-sm;

    .action-item {
      background: $color-bg;
      border-radius: $radius-sm;
      padding: $spacing-md;
      text-align: center;

      .action-icon { display: block; font-size: 48rpx; margin-bottom: $spacing-xs; }
      .action-label { font-size: $font-sm; color: $color-text-primary; font-weight: 600; }
    }
  }
}

.section-card {
  .section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-sm;

    .section-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $color-text-primary;
    }
  }

  .customer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $color-border-light;

    &:last-child { border-bottom: none; }

    .customer-info {
      flex: 1;
    }

    .customer-name {
      display: block;
      font-size: $font-base;
      color: $color-text-primary;
      font-weight: 600;
    }

    .customer-meta {
      display: block;
      font-size: $font-sm;
      color: $color-text-tertiary;
      margin-top: 2rpx;
    }
  }
}

.empty-state-sm {
  padding: $spacing-md;
  text-align: center;

  .empty-text-sm {
    font-size: $font-base;
    color: $color-text-tertiary;
  }
}
</style>
