/**
 * 云函数：updateProfile
 * 在服务端按 openid 更新 users 昵称/头像，避免 init_db 写入的文档 _openid 与小程序用户不一致导致客户端 update 失败。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { error: '未获取到 OPENID' }

  const nickname = event.nickname != null ? String(event.nickname).trim() : ''
  const avatar_url = event.avatar_url != null ? String(event.avatar_url).trim() : ''

  if (!nickname && !avatar_url) {
    return { error: '无更新内容' }
  }

  const patch = {}
  if (nickname) patch.nickname = nickname
  if (avatar_url) patch.avatar_url = avatar_url

  const { data } = await db.collection('users').where({ openid: OPENID }).limit(1).get()
  if (!data || data.length === 0) {
    return { error: '用户不存在，请先完成登录' }
  }

  await db.collection('users').doc(data[0]._id).update({ data: patch })
  return { ok: true, user: { ...data[0], ...patch } }
}
