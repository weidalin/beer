import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/database'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setUser(userData: User) {
    user.value = userData
    uni.setStorageSync('user_info', JSON.stringify(userData))
  }

  /** 从本地 Storage 恢复登录态，返回是否成功 */
  function loadFromStorage(): boolean {
    try {
      const stored = uni.getStorageSync('user_info')
      if (stored) {
        user.value = JSON.parse(stored) as User
        return true
      }
    } catch {
      user.value = null
    }
    return false
  }

  function clearUser() {
    user.value = null
    uni.removeStorageSync('user_info')
  }

  return {
    user,
    isLoading,
    isLoggedIn,
    isAdmin,
    setUser,
    loadFromStorage,
    clearUser
  }
})
