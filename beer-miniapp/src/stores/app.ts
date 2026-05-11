import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const contactPhone = ref(import.meta.env.VITE_CONTACT_PHONE || '13800000000')
  const contactWechat = ref(import.meta.env.VITE_CONTACT_WECHAT || 'jiuhaocang')
  const brandName = ref('广东精酿啤酒一站式供应链')
  const brandSlogan = ref('鲜啤直供 · 珠三角当日达')

  // 全局加载状态
  const globalLoading = ref(false)

  function setGlobalLoading(val: boolean) {
    globalLoading.value = val
  }

  // 拨打电话
  function callPhone(phone?: string) {
    const tel = phone || contactPhone.value
    uni.makePhoneCall({ phoneNumber: tel })
  }

  // 复制微信号
  function copyWechat() {
    uni.setClipboardData({
      data: contactWechat.value,
      success() {
        uni.showToast({ title: '微信号已复制', icon: 'success' })
      }
    })
  }

  return {
    contactPhone,
    contactWechat,
    brandName,
    brandSlogan,
    globalLoading,
    setGlobalLoading,
    callPhone,
    copyWechat
  }
})
