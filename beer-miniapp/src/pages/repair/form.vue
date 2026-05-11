<template>
  <view class="page-container">
    <scroll-view scroll-y class="form-scroll">
      <view class="form-body card" style="margin: 24rpx;">

        <!-- 联系人 -->
        <view class="form-item">
          <text class="form-label">联系人 <text class="required">*</text></text>
          <input class="form-input" v-model="form.customer_name" placeholder="您的姓名"
            placeholder-class="form-placeholder" />
        </view>

        <!-- 联系电话 -->
        <view class="form-item">
          <text class="form-label">联系电话 <text class="required">*</text></text>
          <input class="form-input" v-model="form.phone" type="number" maxlength="11" placeholder="手机号"
            placeholder-class="form-placeholder" />
        </view>

        <!-- 设备类型 -->
        <view class="form-item">
          <text class="form-label">设备类型 <text class="required">*</text></text>
          <view class="radio-group">
            <view
              v-for="opt in deviceOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.device_type === opt.value }"
              @tap="form.device_type = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 故障描述 -->
        <view class="form-item">
          <text class="form-label">故障描述 <text class="required">*</text></text>
          <textarea
            class="form-textarea"
            v-model="form.issue_desc"
            placeholder="请详细描述故障情况，如：出酒口漏酒、制冷不足、不出酒等"
            placeholder-class="form-placeholder"
            maxlength="500"
            :auto-height="true"
          />
        </view>

        <!-- 故障照片 -->
        <view class="form-item">
          <text class="form-label">故障照片（可选，最多3张）</text>
          <ImageUploader
            v-model="form.issue_images"
            :max-count="3"
            bucket="repairs"
            hint="拍摄或选择故障部位照片，有助于技术人员提前了解情况"
          />
        </view>

        <!-- 期望上门时间 -->
        <view class="form-item" style="border-bottom: none;">
          <text class="form-label">期望上门时间（可选）</text>
          <picker
            mode="dateTime"
            :value="form.preferred_time"
            :start="minDate"
            @change="onTimeChange"
          >
            <view class="time-picker">
              <text class="time-value">{{ form.preferred_time || '选择日期时间 📅' }}</text>
              <text class="time-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 快速查看工单 -->
      <view class="tip-bar" @tap="goStatus">
        <text class="tip-icon">📋</text>
        <text class="tip-text">查看我的工单进度</text>
        <text class="tip-arrow">›</text>
      </view>

      <view style="height: 160rpx;"></view>
    </scroll-view>

    <!-- 底部提交 -->
    <view class="bottom-bar">
      <button
        class="btn-primary"
        style="width: 100%;"
        :loading="submitting"
        :disabled="submitting"
        @tap="submit"
      >
        {{ submitting ? '提交中...' : '提交报修申请' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ImageUploader from '../../components/ImageUploader/index.vue'
import { useRepairOrders } from '../../composables/useRepairOrders'
import { useUserStore } from '../../stores/user'
import type { RepairForm } from '../../types/api'

const { createRepairOrder } = useRepairOrders()
const userStore = useUserStore()

const submitting = ref(false)

const form = reactive<Partial<RepairForm> & { issue_images: string[] }>({
  customer_name: '',
  phone: '',
  device_type: undefined,
  issue_desc: '',
  issue_images: [],
  preferred_time: undefined
})

const deviceOptions = [
  { label: '打酒机', value: 'beer_machine' },
  { label: '啤酒车', value: 'beer_car' },
  { label: '其他', value: 'other' }
]

const now = new Date()
const minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`

function onTimeChange(e: { detail: { value: string } }) {
  form.preferred_time = e.detail.value
}

function validate(): string | null {
  if (!form.customer_name?.trim()) return '请填写联系人姓名'
  if (!form.phone?.trim()) return '请填写联系电话'
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return '请填写正确的手机号'
  if (!form.device_type) return '请选择设备类型'
  if (!form.issue_desc?.trim()) return '请填写故障描述'
  return null
}

async function submit() {
  const err = validate()
  if (err) {
    uni.showToast({ title: err, icon: 'none' })
    return
  }

  if (!userStore.isLoggedIn) {
    uni.showModal({
      title: '提示',
      content: '提交报修需要先登录，是否立即登录？',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/profile/index' })
      }
    })
    return
  }

  submitting.value = true
  try {
    const result = await createRepairOrder(form as RepairForm)
    uni.showModal({
      title: '提交成功！',
      content: '我们已收到您的报修申请，将尽快安排上门处理。',
      confirmText: '查看进度',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          uni.redirectTo({ url: `/pages/repair/status?id=${result.id}` })
        } else {
          uni.navigateBack()
        }
      }
    })
  } catch {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function goStatus() {
  uni.navigateTo({ url: '/pages/repair/status' })
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.form-scroll { flex: 1; }

.form-body {
  .form-item {
    padding: $spacing-md 0;
    border-bottom: 1rpx solid $color-border-light;
  }

  .form-label {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;

    .required { color: $color-danger; }
  }

  .form-input {
    height: 72rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border-bottom: 1rpx solid $color-border;
    width: 100%;
  }

  .form-placeholder { color: $color-text-placeholder; }

  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-xs;

    .radio-item {
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

  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border: 1rpx solid $color-border;
    border-radius: $radius-sm;
    padding: $spacing-sm;
    margin-top: $spacing-xs;
  }

  .time-picker {
    display: flex;
    align-items: center;
    height: 72rpx;
    border-bottom: 1rpx solid $color-border;

    .time-value {
      flex: 1;
      font-size: $font-base;
      color: $color-text-secondary;
    }

    .time-arrow {
      color: $color-text-placeholder;
      font-size: $font-xl;
    }
  }
}

.tip-bar {
  margin: 0 $spacing-md $spacing-md;
  padding: $spacing-md;
  background: $color-primary-light;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  border: 1rpx solid rgba(245, 166, 35, 0.3);

  .tip-icon { font-size: 36rpx; }
  .tip-text { flex: 1; font-size: $font-base; color: $color-primary-dark; font-weight: 600; }
  .tip-arrow { color: $color-primary; font-size: $font-xl; }
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
