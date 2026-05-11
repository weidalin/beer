<template>
  <view class="page-container" v-if="isAdmin">
    <scroll-view scroll-y @scrolltolower="() => {}" :refresher-enabled="true"
      @refresherrefresh="refresh" :refresher-triggered="refreshing">

      <!-- 统计看板 -->
      <view class="stats-row">
        <view class="stat-card card">
          <text class="stat-value">{{ todayNew }}</text>
          <text class="stat-label">今日新增客户</text>
        </view>
        <view class="stat-card card">
          <text class="stat-value">{{ pendingOrders }}</text>
          <text class="stat-label">待处理工单</text>
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
          <view class="action-item" @tap="goOrders">
            <text class="action-icon">🔧</text>
            <text class="action-label">查看工单</text>
          </view>
          <view class="action-item" @tap="goCustomers">
            <text class="action-icon">👥</text>
            <text class="action-label">客户列表</text>
          </view>
          <view class="action-item" @tap="goProducts">
            <text class="action-icon">🍺</text>
            <text class="action-label">产品管理</text>
          </view>
        </view>
      </view>

      <!-- 最新预约申请 -->
      <view class="section-card card" style="margin: 0 24rpx 24rpx;">
        <view class="section-header-row">
          <text class="section-title">最新预约申请</text>
          <text class="section-more" @tap="goCustomers">查看全部</text>
        </view>

        <view v-if="latestCustomers.length === 0" class="empty-state-sm">
          <text class="empty-text-sm">暂无预约申请</text>
        </view>

        <view
          v-for="customer in latestCustomers"
          :key="customer.id"
          class="customer-item"
          @tap="goCustomerDetail(customer.id)"
        >
          <view class="customer-info">
            <text class="customer-name">{{ customer.name }}</text>
            <text class="customer-meta">{{ bizTypeLabel(customer.biz_type) }} · {{ relativeTime(customer.created_at) }}</text>
          </view>
          <StatusBadge type="customer" :status="customer.status" />
        </view>
      </view>

      <!-- 最新工单 -->
      <view class="section-card card" style="margin: 0 24rpx 48rpx;">
        <view class="section-header-row">
          <text class="section-title">最新报修工单</text>
          <text class="section-more" @tap="goOrders">查看全部</text>
        </view>

        <view v-if="latestOrders.length === 0" class="empty-state-sm">
          <text class="empty-text-sm">暂无报修工单</text>
        </view>

        <view
          v-for="order in latestOrders"
          :key="order.id"
          class="order-item"
        >
          <view class="order-info">
            <text class="order-name">{{ order.customer_name }} · {{ deviceLabel(order.device_type) }}</text>
            <text class="order-meta">{{ relativeTime(order.created_at) }}</text>
          </view>
          <StatusBadge type="repair" :status="order.status" />
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
import StatusBadge from '../../../components/StatusBadge/index.vue'
import { useUserStore } from '../../../stores/user'
import { useCustomers } from '../../../composables/useCustomers'
import { useRepairOrders } from '../../../composables/useRepairOrders'
import { formatBizType, formatDeviceType, formatRelativeTime } from '../../../utils/format'
import type { Customer, RepairOrder } from '../../../types/database'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin

const { getTodayNewCount, fetchAllCustomers } = useCustomers()
const { getPendingCount, fetchAllRepairOrders } = useRepairOrders()

const todayNew = ref(0)
const pendingOrders = ref(0)
const latestCustomers = ref<Customer[]>([])
const latestOrders = ref<RepairOrder[]>([])
const refreshing = ref(false)

function bizTypeLabel(t: string | null) {
  return formatBizType(t)
}

function deviceLabel(t: string) {
  return formatDeviceType(t)
}

function relativeTime(t: string) {
  return formatRelativeTime(t)
}

async function loadData() {
  try {
    const [newCount, pendingCount, customers, orders] = await Promise.all([
      getTodayNewCount(),
      getPendingCount(),
      fetchAllCustomers(),
      fetchAllRepairOrders()
    ])
    todayNew.value = newCount
    pendingOrders.value = pendingCount
    latestCustomers.value = customers.slice(0, 5)
    latestOrders.value = orders.slice(0, 5)
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
  if (isAdmin) loadData()
})

function goAddProduct() {
  uni.navigateTo({ url: '/pages/admin/products/edit' })
}

function goProducts() {
  uni.navigateTo({ url: '/pages/admin/products/list' })
}

function goCustomers() {
  uni.navigateTo({ url: '/pages/admin/customers/list' })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/admin/orders/list' })
}

function goCustomerDetail(id: string) {
  uni.navigateTo({ url: `/pages/admin/customers/detail?id=${id}` })
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

// 统计卡片
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

// 快捷操作
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

// 区块
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

    .section-more {
      font-size: $font-sm;
      color: $color-primary;
    }
  }

  .customer-item,
  .order-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm 0;
    border-bottom: 1rpx solid $color-border-light;

    &:last-child { border-bottom: none; }

    .customer-info,
    .order-info {
      flex: 1;
      margin-right: $spacing-sm;
    }

    .customer-name,
    .order-name {
      display: block;
      font-size: $font-base;
      color: $color-text-primary;
      font-weight: 600;
    }

    .customer-meta,
    .order-meta {
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
