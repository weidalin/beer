/**
 * 云函数：submitIntention
 * 提交合作意向。服务端建表 + 写库，不依赖客户端 customers 集合是否已手动创建。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function ensureCustomersCollection() {
  try {
    await db.createCollection('customers')
  } catch (e) {
    const msg = (e && (e.message || e.errMsg)) || String(e)
    if (!/exist|已存在|duplicate|重复/i.test(msg)) {
      throw e
    }
  }
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()

  const nickname = event.nickname != null ? String(event.nickname).trim() : ''
  let contact =
    event.contact != null
      ? String(event.contact).trim().slice(0, 64)
      : ''

  // 表单未填联系方式时，从 users 资料补全（登录时已授权的手机号/微信号）
  if (!contact && OPENID) {
    try {
      const { data: users } = await db.collection('users').where({ openid: OPENID }).limit(1).get()
      const u = users && users[0]
      if (u) {
        contact = String(u.phone || u.wechat_id || '').trim().slice(0, 64)
      }
    } catch (e) {
      console.warn('submitIntention load user contact', e)
    }
  }

  if (!nickname) return { error: '请填写昵称' }
  if (!contact) return { error: '请填写联系电话或微信号（至少一项）' }

  const now = new Date().toISOString()
  const payload = {
    nickname,
    contact,
    phone: null,
    wechat_id: null,
    address: event.address ?? null,
    location: event.location ?? null,
    biz_type: event.biz_type ?? null,
    daily_volume: event.daily_volume ?? null,
    interested_plan: event.interested_plan ?? null,
    need_beer_car: event.need_beer_car ?? null,
    delivery_area: event.delivery_area ?? null,
    notes: event.notes ?? null,
    openid: event.openid || OPENID || null,
    created_at: now
  }

  try {
    const { _id } = await db.collection('customers').add({ data: payload })
    return { ok: true, _id }
  } catch (e) {
    const msg = (e && (e.message || e.errMsg)) || String(e)
    if (/502005|DATABASE_COLLECTION_NOT_EXIST|collection not exist|不存在/i.test(msg)) {
      try {
        await ensureCustomersCollection()
        const { _id } = await db.collection('customers').add({ data: payload })
        return { ok: true, _id }
      } catch (e2) {
        console.error('submitIntention after createCollection', e2)
        return { error: (e2 && e2.message) || '提交失败，请稍后重试' }
      }
    }
    console.error('submitIntention', e)
    return { error: msg || '提交失败，请稍后重试' }
  }
}
