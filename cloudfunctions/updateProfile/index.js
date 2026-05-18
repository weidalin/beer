/**
 * 云函数：updateProfile
 * 在服务端按 openid 更新 users 资料；手机号通过 openapi 解密。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function isEmpty(val) {
  return !String(val || '').trim()
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { error: '未获取到 OPENID' }

  const nickname = event.nickname != null ? String(event.nickname).trim() : ''
  const avatar_url = event.avatar_url != null ? String(event.avatar_url).trim() : ''
  const wechat_id = event.wechat_id != null ? String(event.wechat_id).trim() : ''
  const phoneCode = String(event.phoneCode || event.phone_code || '').trim()

  const { data } = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  if (!data || data.length === 0) {
    return { error: '用户不存在，请先完成登录' }
  }

  const existing = data[0]
  const patch = {}

  if (nickname && isEmpty(existing.nickname)) patch.nickname = nickname
  if (avatar_url && isEmpty(existing.avatar_url)) patch.avatar_url = avatar_url
  if (wechat_id && isEmpty(existing.wechat_id)) patch.wechat_id = wechat_id

  if (phoneCode) {
    if (!isEmpty(existing.phone)) {
      return { ok: true, skipped: true, user: existing }
    }
    try {
      const res = await cloud.openapi.phonenumber.getPhoneNumber({ code: phoneCode })
      const info = (res && res.phoneInfo) || res || {}
      const phone = info.purePhoneNumber || info.phoneNumber
      if (!phone) {
        return { error: '未能解析手机号，请重新授权' }
      }
      patch.phone = String(phone)
    } catch (e) {
      const msg = (e && (e.message || e.errMsg)) || String(e)
      return { error: `手机号获取失败：${msg}` }
    }
  }

  const hasInput = !!(nickname || avatar_url || wechat_id || phoneCode)
  if (!hasInput) {
    return { error: '无更新内容' }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true, skipped: true, user: existing }
  }

  await db.collection('users').doc(existing._id).update({ data: patch })
  return { ok: true, user: { ...existing, ...patch } }
}
