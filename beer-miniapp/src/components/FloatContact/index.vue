<template>
  <view class="float-contact" @tap="showSheet">
    <image class="float-icon" src="/static/icons/phone.png" mode="aspectFit" />
    <text class="float-text">联系我们</text>
  </view>

  <!-- 底部弹层：不用 uni-popup，避免未配置 easycom 时小程序端 instance 为 null 报 ctx 错误 -->
  <view v-if="sheetVisible" class="sheet-mask" @tap="closeSheet">
    <view class="sheet-panel" @tap.stop>
      <view class="sheet-container">
        <view class="sheet-title">联系我们</view>
        <view class="sheet-item" @tap="onCall">
          <text class="sheet-icon">📞</text>
          <text class="sheet-label">拨打电话</text>
          <text class="sheet-phone">{{ appStore.contactPhone }}</text>
        </view>
        <view class="sheet-item" @tap="onCopyWechat">
          <text class="sheet-icon">💬</text>
          <text class="sheet-label">复制微信号</text>
          <text class="sheet-phone">{{ appStore.contactWechat }}</text>
        </view>
        <view class="sheet-cancel" @tap="closeSheet">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()
const sheetVisible = ref(false)

function showSheet() {
  sheetVisible.value = true
}

function closeSheet() {
  sheetVisible.value = false
}

function onCall() {
  closeSheet()
  appStore.callPhone()
}

function onCopyWechat() {
  closeSheet()
  appStore.copyWechat()
}
</script>

<style lang="scss" scoped>
.float-contact {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 96rpx;
  height: 96rpx;
  background: $color-primary;
  border-radius: $radius-full;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;

  .float-icon {
    width: 40rpx;
    height: 40rpx;
  }

  .float-text {
    font-size: 18rpx;
    color: $color-text-white;
    margin-top: 4rpx;
    line-height: 1;
  }
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet-panel {
  width: 100%;
  animation: sheet-up 0.22s ease-out;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-container {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  padding: $spacing-md;
  padding-bottom: calc(#{$spacing-md} + env(safe-area-inset-bottom));

  .sheet-title {
    text-align: center;
    font-size: $font-lg;
    font-weight: 600;
    color: $color-text-primary;
    padding: $spacing-sm 0 $spacing-md;
  }

  .sheet-item {
    display: flex;
    align-items: center;
    padding: $spacing-md;
    background: $color-primary-light;
    border-radius: $radius-md;
    margin-bottom: $spacing-sm;

    .sheet-icon {
      font-size: 40rpx;
      margin-right: $spacing-sm;
    }

    .sheet-label {
      flex: 1;
      font-size: $font-base;
      color: $color-text-primary;
    }

    .sheet-phone {
      font-size: $font-sm;
      color: $color-text-secondary;
    }
  }

  .sheet-cancel {
    text-align: center;
    padding: $spacing-md;
    font-size: $font-base;
    color: $color-text-secondary;
    margin-top: $spacing-sm;
  }
}
</style>
