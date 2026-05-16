import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types/database'

/** 构建时写入（.env 的 VITE_ADMIN_OPENIDS），与云库 users.role 任一满足即视为管理员 UI */
function adminOpenidAllowlist(): Set<string> {
  const raw = (import.meta.env.VITE_ADMIN_OPENIDS as string | undefined) || ''
  return new Set(raw.split(/[,;\s\n\r]+/).map(s => s.trim()).filter(Boolean))
}

const ADMIN_OPENIDS = adminOpenidAllowlist()

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => {
    const oid = user.value?.openid
    if (user.value?.role === 'admin') return true
    return !!oid && ADMIN_OPENIDS.has(oid)
  })

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
