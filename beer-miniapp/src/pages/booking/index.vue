<template>
  <view class="page-container">
    <scroll-view scroll-y class="form-scroll">
      <view class="form-header">
        <text class="form-title">合作意向登记</text>
        <text class="form-subtitle">仅需昵称和电话，其余全部选填</text>
      </view>

      <view class="form-body card" style="margin: 24rpx;">
        <!-- 昵称（必填） -->
        <view class="form-item">
          <text class="form-label">您的昵称 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.nickname"
            placeholder="请输入您的称呼"
            placeholder-class="form-placeholder"
          />
        </view>

        <!-- 联系电话（必填） -->
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
          <text v-if="phoneError" class="field-error">{{ phoneError }}</text>
        </view>

        <!-- 档口地址（选填，支持定位） -->
        <view class="form-item">
          <text class="form-label">档口地址 <text class="optional">（选填）</text></text>
          <view class="address-row">
            <input
              class="form-input"
              style="flex: 1;"
              v-model="form.address"
              placeholder="详细地址（点击右侧图标自动定位）"
              placeholder-class="form-placeholder"
            />
            <view class="locate-btn" @tap="getLocation">
              <text class="locate-icon">📍</text>
            </view>
          </view>
        </view>

        <!-- 营业类型（选填） -->
        <view class="form-item">
          <text class="form-label">营业类型 <text class="optional">（选填）</text></text>
          <view class="radio-group">
            <view
              v-for="opt in bizTypeOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.biz_type === opt.value }"
              @tap="form.biz_type = opt.value as typeof form.biz_type"
            >{{ opt.label }}</view>
          </view>
        </view>

        <!-- 月均销量（选填） -->
        <view class="form-item">
          <text class="form-label">月均啤酒销量 <text class="optional">（选填）</text></text>
          <view class="radio-group">
            <view
              v-for="opt in volumeOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.daily_volume === opt.value }"
              @tap="form.daily_volume = opt.value as typeof form.daily_volume"
            >{{ opt.label }}</view>
          </view>
        </view>

        <!-- 感兴趣的方案（选填） -->
        <view class="form-item">
          <text class="form-label">感兴趣的方案 <text class="optional">（选填）</text></text>
          <view class="radio-group">
            <view
              v-for="opt in planOptions"
              :key="opt.value"
              class="radio-item"
              :class="{ 'radio-item--active': form.interested_plan === opt.value }"
              @tap="form.interested_plan = opt.value as typeof form.interested_plan"
            >{{ opt.label }}</view>
          </view>
        </view>

        <!-- 啤酒车需求（选填） -->
        <view class="form-item">
          <text class="form-label">啤酒车需求 <text class="optional">（选填）</text></text>
          <view class="radio-group">
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.need_beer_car === 'no' }"
              @tap="form.need_beer_car = 'no'"
            >不需要</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.need_beer_car === 'buy' }"
              @tap="form.need_beer_car = 'buy'"
            >需要购买</view>
            <view
              class="radio-item"
              :class="{ 'radio-item--active': form.need_beer_car === 'rent' }"
              @tap="form.need_beer_car = 'rent'"
            >需要租赁</view>
          </view>
        </view>

        <!-- 配送区域（选填） -->
        <view class="form-item">
          <text class="form-label">配送区域 <text class="optional">（选填）</text></text>
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

        <!-- 备注（选填） -->
        <view class="form-item" style="border-bottom: none;">
          <text class="form-label">备注 <text class="optional">（选填）</text></text>
          <textarea
            class="form-textarea"
            v-model="form.notes"
            placeholder="其他想说的，例如期望合作时间、特殊需求等"
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
        {{ submitting ? '提交中...' : '提交合作意向' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCustomers, type IntentionForm } from '../../composables/useCustomers'

const { createIntention } = useCustomers()

const submitting = ref(false)
const phoneError = ref('')

const form = reactive<IntentionForm>({
  nickname: '',
  phone: '',
  address: '',
  biz_type: undefined,
  daily_volume: undefined,
  interested_plan: undefined,
  need_beer_car: undefined,
  delivery_area: undefined,
  notes: ''
})

onLoad((options) => {
  if (options?.plan) {
    form.interested_plan = options.plan as IntentionForm['interested_plan']
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
      form.address = `经纬度：${res.latitude.toFixed(4)},${res.longitude.toFixed(4)}`
      uni.hideLoading()
      uni.showToast({ title: '定位成功', icon: 'success' })
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '定位失败，请手动填写地址', icon: 'none' })
    }
  })
}

function validate(): boolean {
  phoneError.value = ''
  if (!form.nickname.trim()) {
    uni.showToast({ title: '请填写昵称', icon: 'none' })
    return false
  }
  if (!form.phone.trim()) {
    phoneError.value = '请填写联系电话'
    return false
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
    phoneError.value = '请填写正确的11位手机号'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    await createIntention(form)
    uni.showToast({ title: '已提交，我们会尽快联系您', icon: 'success', duration: 2000 })
    setTimeout(() => uni.navigateBack(), 2200)
  } catch {
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
  }

  .form-label {
    display: block;
    font-size: $font-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
    font-weight: 600;

    .required {
      color: $color-danger;
      margin-left: 2rpx;
    }

    .optional {
      font-size: $font-xs;
      color: $color-text-placeholder;
      font-weight: 400;
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

  .field-error {
    display: block;
    font-size: $font-xs;
    color: $color-danger;
    margin-top: 6rpx;
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
