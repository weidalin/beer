import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/user'
import type { User } from '../types/database'

export function useAuth() {
  const userStore = useUserStore()

  async function wxLogin(): Promise<void> {
    userStore.isLoading = true
    try {
      // ——— 步骤 1：获取微信 code ———
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: (err) => {
            // H5 模式下 uni.login provider=weixin 不可用
            const isH5 = typeof window !== 'undefined' && !('wx' in window)
            if (isH5) {
              reject(new Error('H5_NO_WECHAT'))
            } else {
              reject(new Error(`微信登录失败: ${err.errMsg || '未知错误'}`))
            }
          }
        })
      })

      if (!loginRes.code) throw new Error('微信登录失败：未获取到 code')

      // ——— 步骤 2：用 code 换 openid（通过 Edge Function，AppSecret 不落前端）———
      const { data: wxData, error: fnError } = await supabase.functions.invoke('wx-login', {
        body: { code: loginRes.code }
      })

      if (fnError) {
        throw new Error(`服务端错误: ${fnError.message || fnError}`)
      }
      if (!wxData?.openid) {
        throw new Error(wxData?.error || '获取 openid 失败，请检查 Edge Function 是否已部署')
      }

      const { openid } = wxData

      // ——— 步骤 3：以 openid 登录 / 注册 Supabase Auth ———
      const fakeEmail = `${openid}@wx.beer`
      const fakePassword = openid

      let session = null

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword
      })

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: fakePassword
        })
        if (signUpError) throw new Error(`用户注册失败: ${signUpError.message}`)
        session = signUpData.session
      } else {
        session = signInData.session
      }

      if (!session) throw new Error('登录失败：会话创建失败，请重试')

      // ——— 步骤 4：同步 users 表 ———
      let { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('openid', openid)
        .single()

      if (!userRecord) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({ openid, role: 'customer' })
          .select()
          .single()
        userRecord = newUser
      }

      if (userRecord) {
        userStore.setUser(userRecord as User)
      }
    } finally {
      userStore.isLoading = false
    }
  }

  async function silentLogin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const openid = session.user.email?.replace('@wx.beer', '')
        if (openid) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('*')
            .eq('openid', openid)
            .single()
          if (userRecord) {
            userStore.setUser(userRecord as User)
            return true
          }
        }
      }
      return false
    } catch {
      return false
    }
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    userStore.clearUser()
    uni.reLaunch({ url: '/pages/index/index' })
  }

  return { wxLogin, silentLogin, logout }
}
