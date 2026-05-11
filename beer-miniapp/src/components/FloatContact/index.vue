<template>
  <view class="float-contact" @tap="showSheet">
    <image class="float-icon" src="/static/icons/phone.png" mode="aspectFit" />
    <text class="float-text">联系我们</text>
  </view>

  <!-- ActionSheet -->
  <uni-popup ref="popupRef" type="bottom" background-color="#fff">
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
  </uni-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()
const popupRef = ref()

function showSheet() {
  popupRef.value?.open()
}

function closeSheet() {
  popupRef.value?.close()
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

.sheet-container {
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
