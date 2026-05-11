<template>
  <view class="image-uploader">
    <view class="upload-list">
      <!-- 已上传图片 -->
      <view
        v-for="(url, idx) in modelValue"
        :key="url"
        class="upload-item"
      >
        <image :src="url" mode="aspectFill" class="upload-preview" @tap="previewImage(idx)" />
        <view class="upload-delete" @tap.stop="removeImage(idx)">×</view>
      </view>

      <!-- 上传按钮 -->
      <view
        v-if="modelValue.length < maxCount"
        class="upload-btn"
        :class="{ 'upload-btn--loading': uploading }"
        @tap="chooseImage"
      >
        <text v-if="!uploading" class="upload-plus">+</text>
        <text v-else class="upload-loading-text">上传中...</text>
      </view>
    </view>

    <text class="upload-hint" v-if="hint">{{ hint }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUpload } from '../../composables/useUpload'

const props = defineProps<{
  modelValue: string[]
  maxCount?: number
  bucket?: 'products' | 'repairs'
  hint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [urls: string[]]
}>()

const uploading = ref(false)
const { uploadImage } = useUpload()
const maxCount = props.maxCount ?? 4
const bucket = props.bucket ?? 'products'

async function chooseImage() {
  if (uploading.value) return
  uni.chooseMedia({
    count: maxCount - props.modelValue.length,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    maxDuration: 30,
    camera: 'back',
    success: async (res) => {
      uploading.value = true
      try {
        const newUrls: string[] = []
        for (const file of res.tempFiles) {
          const url = await uploadImage(file.tempFilePath, bucket)
          newUrls.push(url)
        }
        emit('update:modelValue', [...props.modelValue, ...newUrls])
      } catch (e) {
        uni.showToast({ title: '上传失败，请重试', icon: 'none' })
      } finally {
        uploading.value = false
      }
    }
  })
}

function removeImage(idx: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        const newList = [...props.modelValue]
        newList.splice(idx, 1)
        emit('update:modelValue', newList)
      }
    }
  })
}

function previewImage(idx: number) {
  uni.previewImage({
    urls: props.modelValue,
    current: props.modelValue[idx]
  })
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .upload-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  .upload-item {
    position: relative;
    width: 180rpx;
    height: 180rpx;

    .upload-preview {
      width: 100%;
      height: 100%;
      border-radius: $radius-sm;
      object-fit: cover;
    }

    .upload-delete {
      position: absolute;
      top: -16rpx;
      right: -16rpx;
      width: 40rpx;
      height: 40rpx;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      border-radius: $radius-full;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $font-lg;
      line-height: 1;
    }
  }

  .upload-btn {
    width: 180rpx;
    height: 180rpx;
    border: 2rpx dashed $color-border;
    border-radius: $radius-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: $color-bg-gray;

    &--loading {
      opacity: 0.6;
    }

    .upload-plus {
      font-size: 64rpx;
      color: $color-text-placeholder;
      line-height: 1;
    }

    .upload-loading-text {
      font-size: $font-sm;
      color: $color-text-secondary;
    }
  }

  .upload-hint {
    display: block;
    font-size: $font-sm;
    color: $color-text-tertiary;
    margin-top: $spacing-xs;
  }
}
</style>
