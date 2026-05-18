import { callFunction, db } from '../lib/cloud'
import { useUserStore } from '../stores/user'
import { useUpload } from './useUpload'
import type { User } from '../types/database'

/** 资料完善表单（微信头像昵称 + 手填微信号 + 手机号授权 code） */
export type UserProfileInput = {
  nickname?: string
  avatarUrl?: string
  wechatId?: string
  phoneCode?: string
}

const PLACEHOLDER_NICK = '微信用户'

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
    return '云函数未部署，请在云开发中上传并部署 wxLogin、updateProfile、productAdmin、submitIntention'
  }
  if (msg.includes('云开发未初始化')) {
    return msg
  }
  return '登录失败，请稍后重试'
}

/** 是否仍需完善资料（昵称、手机号） */
export function needsProfileSetup(user: User | null | undefined): boolean {
  if (!user) return false
  const nick = user.nickname?.trim()
  const hasNick = !!nick && nick !== PLACEHOLDER_NICK
  return !hasNick || !user.phone?.trim()
}

export function useAuth() {
  const userStore = useUserStore()
  const { uploadImage } = useUpload()

  /**
   * 微信登录流程：
   * 1. wx.login 获取 code
   * 2. 调用云函数 wxLogin，code 换取 openid（服务端安全处理）
   * 3. 查询 users 集合，首次登录自动创建记录
   * 4. isAdmin：云库 role=admin；role=customer 恒为 false；否则可看 VITE_ADMIN_OPENIDS
   */
  async function wxLogin(): Promise<void> {
    userStore.isLoading = true
    try {
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        })
      })

      if (!loginRes.code) throw new Error('微信登录失败：未获取到 code')

      const { openid } = await callFunction<{ openid: string }>('wxLogin', {
        code: loginRes.code
      })

      if (!openid) throw new Error('获取 openid 失败')

      const { data: users } = await db
        .collection('users')
        .where({ openid })
        .limit(1)
        .get()

      let userRecord: User

      if (users && users.length > 0) {
        userRecord = users[0] as unknown as User
      } else {
        const now = new Date().toISOString()
        const { _id } = await db.collection('users').add({
          data: {
            openid,
            nickname: null,
            avatar_url: null,
            wechat_id: null,
            phone: null,
            role: 'customer',
            created_at: now
          }
        })
        userRecord = {
          _id,
          openid,
          nickname: null,
          avatar_url: null,
          wechat_id: null,
          phone: null,
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
   * 保存用户资料到云库（仅填空字段，不覆盖已有值）。
   * 头像临时路径会先上传至云存储。
   */
  async function saveUserProfile(input: UserProfileInput): Promise<User> {
    const openid = userStore.user?.openid
    if (!openid) throw new Error('请先登录')

    let avatar_url: string | undefined
    const rawAvatar = input.avatarUrl?.trim()
    if (rawAvatar) {
      if (rawAvatar.startsWith('cloud://')) {
        avatar_url = rawAvatar
      } else {
        avatar_url = await uploadImage(rawAvatar, 'avatars')
      }
    }

    const nickname = input.nickname?.trim()
    const wechat_id = input.wechatId?.trim()
    const phoneCode = input.phoneCode?.trim()

    const payload: Record<string, string> = {}
    if (nickname) payload.nickname = nickname
    if (avatar_url) payload.avatar_url = avatar_url
    if (wechat_id) payload.wechat_id = wechat_id
    if (phoneCode) payload.phoneCode = phoneCode

    if (Object.keys(payload).length === 0) {
      throw new Error('无更新内容')
    }

    const res = await callFunction<{
      ok?: boolean
      skipped?: boolean
      error?: string
      user?: User
    }>('updateProfile', payload)

    if (res?.error) throw new Error(res.error)

    // 仅保存手机号时：skipped 表示库中已有号码，仍视为成功
    if (res?.skipped && phoneCode && !res?.user?.phone && !userStore.user?.phone) {
      throw new Error('手机号未写入，请重新部署 updateProfile 云函数后重试')
    }

    const user = (res?.user || userStore.user) as User
    userStore.setUser(user)
    return user
  }

  async function syncUserFromCloud(): Promise<void> {
    const openid = userStore.user?.openid
    if (!openid) return
    try {
      const { data } = await db.collection('users').where({ openid }).limit(1).get()
      const row = data?.[0] as unknown as User | undefined
      if (row?._id) {
        userStore.setUser(row)
      }
    } catch (e) {
      console.warn('syncUserFromCloud', e)
    }
  }

  async function silentLogin(): Promise<boolean> {
    return userStore.loadFromStorage()
  }

  function logout(): void {
    userStore.clearUser()
    uni.reLaunch({ url: '/pages/index/index' })
  }

  return {
    wxLogin,
    saveUserProfile,
    silentLogin,
    logout,
    syncUserFromCloud,
    needsProfileSetup
  }
}
