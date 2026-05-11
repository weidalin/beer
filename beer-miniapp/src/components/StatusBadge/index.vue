<template>
  <view class="status-badge" :style="{ background: bgColor, color: textColor }">
    {{ label }}
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCustomerStatus, formatRepairStatus } from '../../utils/format'

const props = defineProps<{
  type: 'customer' | 'repair'
  status: string
}>()

const statusInfo = computed(() => {
  if (props.type === 'customer') return formatCustomerStatus(props.status)
  return formatRepairStatus(props.status)
})

const label = computed(() => statusInfo.value.label)
const bgColor = computed(() => `${statusInfo.value.color}20`)
const textColor = computed(() => statusInfo.value.color)
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-size: $font-xs;
  font-weight: 600;
  line-height: 1.6;
}
</style>
