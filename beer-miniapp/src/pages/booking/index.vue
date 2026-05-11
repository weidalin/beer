<template>
  <view class="page-container">
    <scroll-view scroll-y class="form-scroll">
      <view class="form-header">
        <text class="form-title">填写合作意向信息</text>
        <text class="form-subtitle">我们将在1个工作日内与您联系</text>
      </view>

      <view class="form-body card" style="margin: 24rpx;">
        <!-- 姓名 -->
        <view class="form-item">
          <text class="form-label">您的姓名 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="请输入您的姓名"
            placeholder-class="form-placeholder"
          />
        </view>

        <!-- 联系电话 -->
        <view class="form-item">
          <text class="form-label">联系电话 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.phone"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
            placeholder-class="form-placeholder"
          />
        </view>

        <!-- 档口地址 -->
        <view class="form-item">
          <text class="form-label">档口地址 <text class="required">*</text></text>
          <view class="address-row">
            <input
              class="form-input"
              style="flex: 1;"
              v-model="form.address"
              placeholder="详细地址（可点击右侧定位自动填写）"
              placeholder-class="form-placeholder"
            />
            <view class="locate-btn" @tap="getLocation">
              <text class="locate-icon">📍</text>
            </view>
          </view>
        </view>

        <!-- 营业类型 -->
        <view class="form-item">
          <text class="form-label">营业类型</text>
          <view class="radio-group">
            <view
              v-for="opt in bizTypeOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.biz_type === opt.value }"
              @tap="form.biz_type = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 日均销量 -->
        <view class="form-item">
          <text class="form-label">日均啤酒销量（估算）</text>
          <view class="radio-group">
            <view
              v-for="opt in volumeOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.daily_volume === opt.value }"
              @tap="form.daily_volume = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 感兴趣的方案 -->
        <view class="form-item">
          <text class="form-label">感兴趣的方案</text>
          <view class="radio-group">
            <view
              v-for="opt in planOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.interested_plan === opt.value }"
              @tap="form.interested_plan = opt.value"
            >
              {{ opt.label }}
            </view>
          </view>
        </view>

        <!-- 是否需要啤酒车 -->
        <view class="form-item">
          <text class="form-label">是否需要啤酒车？</text>
          <view class="radio-group">
            <view
              class="radio-item"
              :class="{ 'radio-item--active': !form.need_beer_car }"
              @tap="form.need_beer_car = false; form.beer_car_type = undefined"
            >不需要</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.need_beer_car && form.beer_car_type === 'buy' }"
              @tap="form.need_beer_car = true; form.beer_car_type = 'buy'"
            >需要（购买）</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.need_beer_car && form.beer_car_type === 'rent' }"
              @tap="form.need_beer_car = true; form.beer_car_type = 'rent'"
            >需要（租赁）</view>
          </view>
        </view>

        <!-- 配送地区 -->
        <view class="form-item">
          <text class="form-label">您的配送地区</text>
          <view class="radio-group">
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.delivery_area === 'prd' }"
              @tap="form.delivery_area = 'prd'"
            >珠三角（当日达）</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.delivery_area === 'other' }"
              @tap="form.delivery_area = 'other'"
            >其他省市（走物流）</view>
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea
            class="form-textarea"
            v-model="form.notes"
            placeholder="其他想说的，例如：期望合作时间、特殊需求等"
            placeholder-class="form-placeholder"
            maxlength="300"
            :auto-height="true"
          />
        </view>
      </view>

      <view style="height: 160rpx;"></view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="bottom-bar">
      <button
        class="btn-primary"
        style="width: 100%;"
        :loading="submitting"
        :disabled="submitting"
        @tap="submit"
      >
        {{ submitting ? '提交中...' : '提交预约申请' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCustomers } from '../../composables/useCustomers'
import { useUserStore } from '../../stores/user'
import type { BookingForm } from '../../types/api'

const { createCustomer } = useCustomers()
const userStore = useUserStore()

const submitting = ref(false)

const form = reactive<Partial<BookingForm>>({
  name: '',
  phone: '',
  address: '',
  biz_type: undefined,
  daily_volume: undefined,
  interested_plan: undefined,
  need_beer_car: false,
  beer_car_type: undefined,
  delivery_area: undefined,
  notes: ''
})

onLoad((options) => {
  if (options?.plan) {
    form.interested_plan = options.plan as BookingForm['interested_plan']
  }
})

const bizTypeOptions = [
  { label: '宵夜档', value: 'night_stall' },
  { label: '大排档', value: 'open_restaurant' },
  { label: '夜市摊', value: 'market' },
  { label: '其他', value: 'other' }
]

const volumeOptions = [
  { label: '50桶以下', value: '<50' },
  { label: '50-100桶', value: '50-100' },
  { label: '100桶以上', value: '>100' }
]

const planOptions = [
  { label: '基础版', value: 'basic' },
  { label: '标准版', value: 'standard' },
  { label: '旗舰版', value: 'premium' },
  { label: '还没想好', value: 'undecided' }
]

function getLocation() {
  uni.showLoading({ title: '定位中...' })
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      form.location = { latitude: res.latitude, longitude: res.longitude }
      // 逆地理编码获取地址（需腾讯地图API）
      form.address = `纬度:${res.latitude.toFixed(4)}, 经度:${res.longitude.toFixed(4)}`
      uni.hideLoading()
      uni.showToast({ title: '定位成功', icon: 'success' })
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '定位失败，请手动填写地址', icon: 'none' })
    }
  })
}

function validate(): string | null {
  if (!form.name?.trim()) return '请填写姓名'
  if (!form.phone?.trim()) return '请填写联系电话'
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return '请填写正确的手机号'
  if (!form.address?.trim()) return '请填写档口地址'
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
      content: '提交预约需要先登录，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/profile/index' })
        }
      }
    })
    return
  }

  submitting.value = true
  try {
    await createCustomer(form as BookingForm)
    uni.showModal({
      title: '提交成功！',
      content: '我们已收到您的预约申请，将在1个工作日内与您联系。',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $color-bg;
}

.form-scroll {
  flex: 1;
}

.form-header {
  background: $color-primary-dark;
  padding: $spacing-lg $spacing-lg;

  .form-title {
    display: block;
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-white;
    margin-bottom: $spacing-xs;
  }

  .form-subtitle {
    font-size: $font-base;
    color: rgba(255, 255, 255, 0.7);
  }
}

.form-body {
  .form-item {
    padding: $spacing-md 0;
    border-bottom: 1rpx solid $color-border-light;

    &:last-child {
      border-bottom: none;
    }
  }

  .form-label {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;

    .required {
      color: $color-danger;
    }
  }

  .form-input {
    height: 72rpx;
    font-size: $font-base;
    color: $color-text-primary;
    border-bottom: 1rpx solid $color-border;
    padding-bottom: $spacing-xs;
    width: 100%;
  }

  .form-placeholder {
    color: $color-text-placeholder;
  }

  .address-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .locate-btn {
      flex-shrink: 0;
      width: 72rpx;
      height: 72rpx;
      background: $color-primary-light;
      border-radius: $radius-sm;
      display: flex;
      align-items: center;
      justify-content: center;

      .locate-icon {
        font-size: 36rpx;
      }
    }
  }

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
      background: $color-bg;

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
    box-sizing: border-box;
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
