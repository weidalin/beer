import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/user'
import type { User } from '../types/database'

export function useAuth() {
  const userStore = useUserStore()

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

      // 2. 调用 Supabase Edge Function 用 code 换 openid
      const { data: wxData, error: fnError } = await supabase.functions.invoke('wx-login', {
        body: { code: loginRes.code }
      })

      if (fnError || !wxData?.openid) {
        throw new Error('获取用户信息失败')
      }

      const { openid } = wxData

      // 3. 用 openid 作为自定义账号登录 Supabase
      //    规则：email = openid@wx.beer，password = openid（首次注册时自动创建）
      const fakeEmail = `${openid}@wx.beer`
      const fakePassword = openid

      let session = null

      // 先尝试登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword
      })

      if (signInError) {
        // 账号不存在时，注册新账号
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: fakePassword
        })
        if (signUpError) throw new Error('用户注册失败')
        session = signUpData.session
      } else {
        session = signInData.session
      }

      if (!session) throw new Error('登录失败：会话创建失败')

      // 4. 查询或创建 users 表记录
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
