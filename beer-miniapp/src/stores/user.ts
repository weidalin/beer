import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/database'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userId = computed(() => user.value?.id ?? null)

  function setUser(userData: User) {
    user.value = userData
    uni.setStorageSync('user_info', JSON.stringify(userData))
  }

  function setToken(t: string) {
    token.value = t
  }

  function clearUser() {
    user.value = null
    token.value = null
    uni.removeStorageSync('user_info')
    uni.removeStorageSync('supabase.auth.token')
  }

  function loadFromStorage() {
    const stored = uni.getStorageSync('user_info')
    if (stored) {
      try {
        user.value = JSON.parse(stored)
      } catch {
        user.value = null
      }
    }
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    isAdmin,
    userId,
    setUser,
    setToken,
    clearUser,
    loadFromStorage
  }
})
