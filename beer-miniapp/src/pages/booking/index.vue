<template>
  <view class="page-container booking-root">
    <view class="form-header">
      <text class="form-title">合作意向登记</text>
      <text class="form-subtitle">昵称与联系方式必填，其余选填（联系方式可填手机号或微信号）</text>
    </view>

    <form class="intention-form" @submit="onFormSubmit">
      <view class="form-body card" style="margin: 24rpx;">
        <!-- 昵称（必填） -->
        <view class="form-item">
          <text class="form-label">您的昵称 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.nickname"
            name="nickname"
            placeholder="请输入您的称呼"
            placeholder-class="form-placeholder"
          />
        </view>

        <!-- 联系方式（电话或微信号） -->
        <view class="form-item">
          <text class="form-label">联系方式 <text class="required">*</text></text>
          <input
            class="form-input"
            v-model="form.contact"
            name="contact"
            maxlength="64"
            placeholder="手机号或微信号"
            placeholder-class="form-placeholder"
            confirm-type="done"
          />
          <text v-if="contactError" class="field-error">{{ contactError }}</text>
        </view>

        <!-- 档口地址（选填，支持定位） -->
        <view class="form-item">
          <text class="form-label">档口地址 <text class="optional">（选填）</text></text>
          <view class="address-row">
            <input
              class="form-input"
              style="flex: 1;"
              v-model="form.address"
              name="address"
              placeholder="详细地址（点击右侧图标自动定位）"
              placeholder-class="form-placeholder"
            />
            <view class="locate-btn" @tap.stop="getLocation">
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
            name="notes"
            placeholder="其他想说的，例如期望合作时间、特殊需求等"
            placeholder-class="form-placeholder"
            maxlength="300"
            :auto-height="true"
            :show-confirm-bar="false"
          />
        </view>
      </view>

      <view class="submit-section">
        <button class="btn-primary submit-btn" form-type="submit" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交合作意向' }}
        </button>
      </view>
    </form>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useCustomers, type IntentionForm } from '../../composables/useCustomers'

const { createIntention } = useCustomers()

const submitting = ref(false)
const contactError = ref('')

const form = reactive<IntentionForm>({
  nickname: '',
  contact: '',
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

onShow(() => {
  try {
    const plan = uni.getStorageSync('intention_plan_prefill')
    if (plan) {
      form.interested_plan = plan as IntentionForm['interested_plan']
      uni.removeStorageSync('intention_plan_prefill')
    }
  } catch {
    /* ignore */
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
  contactError.value = ''
  if (!form.nickname.trim()) {
    uni.showToast({ title: '请填写昵称', icon: 'none' })
    return false
  }

  if (!form.contact.trim()) {
    contactError.value = '请填写联系方式'
    return false
  }
  return true
}

function onFormSubmit() {
  if (submitting.value) return
  uni.hideKeyboard()
  void submit()
}

function resetForm() {
  form.nickname = ''
  form.contact = ''
  form.address = ''
  form.biz_type = undefined
  form.daily_volume = undefined
  form.interested_plan = undefined
  form.need_beer_car = undefined
  form.delivery_area = undefined
  form.notes = ''
  form.location = undefined
  contactError.value = ''
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  uni.showLoading({ title: '提交中...', mask: true })
  try {
    await createIntention(form)
    uni.hideLoading()
    uni.showToast({ title: '已提交，我们会尽快联系您', icon: 'success', duration: 2000 })
    resetForm()
    uni.pageScrollTo({ scrollTop: 0, duration: 300 })
  } catch (e) {
    uni.hideLoading()
    let title = e instanceof Error ? e.message : '提交失败，请重试'
    if (title.length > 40) {
      title = title.slice(0, 40) + '…'
    }
    uni.showToast({ title, icon: 'none', duration: 4000 })
    console.error('[submitIntention]', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.booking-root.page-container {
  min-height: 100vh;
  background: $color-bg;
  /* 为底部 tabBar 留出空间，避免提交按钮被挡住 */
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.intention-form {
  display: block;
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
    line-height: 1.5;
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

.submit-section {
  margin: $spacing-md $spacing-md $spacing-lg;

  .submit-btn {
    width: 100%;
  }
}
</style>
