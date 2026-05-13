<template>
  <view class="float-contact" @tap="showSheet">
    <image class="float-icon" src="/static/icons/phone.png" mode="aspectFit" />
    <text class="float-text">联系我们</text>
  </view>

  <!-- ActionSheet -->
  <uni-popup ref="popupRef" type="bottom" background-color="#fff">
    <view class="sheet-container">
      <view class="sheet-title">联系我们</view>

      <!-- ① 拨打电话 -->
      <view class="sheet-item" @tap="onCall">
        <text class="sheet-icon">📞</text>
        <text class="sheet-label">拨打电话</text>
        <text class="sheet-meta">{{ appStore.contactPhone }}</text>
      </view>

      <!-- ② 复制微信号 -->
      <view class="sheet-item" @tap="onCopyWechat">
        <text class="sheet-icon">💬</text>
        <text class="sheet-label">复制微信号</text>
        <text class="sheet-meta">{{ appStore.contactWechat }}</text>
      </view>

      <!-- ③ 查看微信二维码 -->
      <view class="sheet-item" @tap="onShowQR">
        <text class="sheet-icon">📷</text>
        <text class="sheet-label">查看微信二维码</text>
        <text class="sheet-meta">长按识别加好友</text>
      </view>

      <!-- ④ 在线咨询（微信客服） -->
      <button class="sheet-item sheet-item--btn" open-type="contact" @tap="closeSheet">
        <text class="sheet-icon">🎧</text>
        <text class="sheet-label">在线咨询</text>
        <text class="sheet-meta">微信客服在线回复</text>
      </button>

      <view class="sheet-cancel" @tap="closeSheet">取消</view>
    </view>
  </uni-popup>

  <!-- 二维码预览弹窗 -->
  <uni-popup ref="qrPopupRef" type="center">
    <view class="qr-modal">
      <text class="qr-title">微信二维码</text>
      <image
        class="qr-image"
        :src="qrImagePath"
        mode="aspectFit"
        @longpress="onLongPressQR"
      />
      <text class="qr-hint">长按图片可保存或识别二维码</text>
      <view class="qr-close" @tap="closeQR">关闭</view>
    </view>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()
const popupRef = ref()
const qrPopupRef = ref()

const qrImagePath = import.meta.env.VITE_CONTACT_WECHAT_QR || '/static/images/wechat-qr.png'

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

function onShowQR() {
  closeSheet()
  setTimeout(() => {
    qrPopupRef.value?.open()
  }, 300)
}

function closeQR() {
  qrPopupRef.value?.close()
}

function onLongPressQR() {
  uni.previewImage({
    urls: [qrImagePath],
    current: qrImagePath
  })
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
    min-height: 88rpx;

    &--btn {
      // 覆盖 button 默认样式
      border: none;
      font-size: $font-base;
      text-align: left;
      line-height: normal;
      &::after { border: none; }
    }

    .sheet-icon {
      font-size: 40rpx;
      margin-right: $spacing-sm;
    }

    .sheet-label {
      flex: 1;
      font-size: $font-base;
      color: $color-text-primary;
    }

    .sheet-meta {
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

.qr-modal {
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-xl $spacing-lg;
  width: 560rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .qr-title {
    font-size: $font-xl;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: $spacing-md;
  }

  .qr-image {
    width: 400rpx;
    height: 400rpx;
    border-radius: $radius-md;
    border: 1rpx solid $color-border;
  }

  .qr-hint {
    font-size: $font-sm;
    color: $color-text-tertiary;
    margin-top: $spacing-sm;
    text-align: center;
  }

  .qr-close {
    margin-top: $spacing-lg;
    padding: $spacing-sm $spacing-xl;
    background: $color-primary-light;
    color: $color-primary;
    border-radius: $radius-full;
    font-size: $font-base;
    font-weight: 600;
  }
}
</style>
