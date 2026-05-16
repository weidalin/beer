import { callFunction, db } from '../lib/cloud'
import { useUserStore } from '../stores/user'
import type { User } from '../types/database'

function formatCloudCallError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message
    if (
      m.includes('云环境') ||
      m.includes('云函数') ||
      m.includes('云开发未初始化') ||
      m.includes('微信登录失败')
    ) {
      return m
    }
  }
  const msg =
    err && typeof err === 'object' && 'errMsg' in err
      ? String((err as { errMsg?: string }).errMsg)
      : err instanceof Error
        ? err.message
        : String(err)
  if (msg.includes('INVALID_ENV') || msg.includes('Environment not found')) {
    return '云环境无效：请在 .env 配置 VITE_CLOUD_ENV_ID 并重新编译，或在开发者工具云开发选中正确环境'
  }
  if (msg.includes('FUNCTION_NOT_FOUND')) {
    return '云函数未部署，请在云开发中上传 wxLogin'
  }
  if (msg.includes('云开发未初始化')) {
    return msg
  }
  return '登录失败，请稍后重试'
}

export function useAuth() {
  const userStore = useUserStore()

  /**
   * 微信登录流程：
   * 1. wx.login 获取 code
   * 2. 调用云函数 wxLogin，code 换取 openid（服务端安全处理）
   * 3. 查询 users 集合，首次登录自动创建记录
   * 4. role === 'admin' 时 userStore.isAdmin === true
   */
  async function wxLogin(): Promise<void> {
    userStore.isLoading = true
    try {
      // 1. 获取微信 code
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) throw new Error('微信登录失败：未获取到 code')

      // 2. 调用云函数换取 openid（云函数在服务端用 appSecret 换取）
      const { openid } = await callFunction<{ openid: string }>('wxLogin', {
        code: loginRes.code
      })

      if (!openid) throw new Error('获取 openid 失败')

      // 3. 查询 users 集合
      const { data: users } = await db
        .collection('users')
        .where({ openid })
        .limit(1)
        .get()

      let userRecord: User

      if (users && users.length > 0) {
        userRecord = users[0] as unknown as User
      } else {
        // 首次登录：创建用户记录（role 默认 customer，admin 由运营在控制台写入）
        const now = new Date().toISOString()
        const { _id } = await db.collection('users').add({
          data: {
            openid,
            nickname: null,
            avatar_url: null,
            role: 'customer',
            created_at: now
          }
        })
        userRecord = {
          _id,
          openid,
          nickname: null,
          avatar_url: null,
          role: 'customer',
          created_at: now
        }
      }

      userStore.setUser(userRecord)
    } catch (e) {
      console.error('wxLogin', e)
      throw new Error(formatCloudCallError(e))
    } finally {
      userStore.isLoading = false
    }
  }

  /**
   * 从本地 Storage 静默恢复登录态（无需网络，适合 App 启动时调用）
   */
  async function silentLogin(): Promise<boolean> {
    return userStore.loadFromStorage()
  }

  /**
   * 退出登录：清除本地状态
   */
  function logout(): void {
    userStore.clearUser()
    uni.reLaunch({ url: '/pages/index/index' })
  }

  return { wxLogin, silentLogin, logout }
}
