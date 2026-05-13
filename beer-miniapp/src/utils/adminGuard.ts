/**
 * Admin 路由守卫
 *
 * 在需要 admin 权限的页面 onLoad 中调用：
 *   import { requireAdmin } from '../../utils/adminGuard'
 *   onLoad(() => { if (!requireAdmin()) return })
 */

import { useUserStore } from '../stores/user'

/**
 * 检查当前用户是否是 admin，若不是则拦截并返回首页
 * @returns true = 通过，false = 拦截（已处理跳转）
 */
export function requireAdmin(): boolean {
  const userStore = useUserStore()

  // 先尝试从本地缓存恢复登录态（冷启动场景）
  if (!userStore.isLoggedIn) {
    userStore.loadFromStorage()
  }

  if (!userStore.isAdmin) {
    uni.showToast({ title: '无权限访问', icon: 'none', duration: 1500 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
    return false
  }

  return true
}
