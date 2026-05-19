/**
 * 云函数：customerAdmin
 * 管理员对合作意向（customers 集合）进行标星/取消标星、删除。
 * 因 customers 文档由云函数写入，_openid 为云端 ID，客户端无法直接写，需走服务端。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SEED_ADMIN_OPENIDS = ['obMhl3Q1ZcwR-oq0J3VkTGOIaQjU']

function parseOpenidList(str) {
  if (!str || typeof str !== 'string') return []
  return str.split(/[,;\s\n\r]+/).map(s => s.trim()).filter(Boolean)
}

async function assertAdmin(openid) {
  if (!openid) throw new Error('未登录')

  const { data } = await db.collection('users').where({ openid }).limit(1).get()
  const user = data && data[0]
  if (user && user.role === 'customer') throw new Error('无管理员权限')
  if (user && user.role === 'admin') return

  const allow = new Set(SEED_ADMIN_OPENIDS)
  parseOpenidList(process.env.ADMIN_OPEN_IDS || '').forEach(id => allow.add(id))
  if (process.env.ADMIN_OPEN_ID) allow.add(process.env.ADMIN_OPEN_ID.trim())
  if (allow.has(openid)) return

  throw new Error('无管理员权限')
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext()
  try {
    await assertAdmin(OPENID)
  } catch (e) {
    return { error: e.message || '无管理员权限' }
  }

  const { action } = event

  if (action === 'list') {
    try {
      const { data } = await db
        .collection('customers')
        .orderBy('created_at', 'desc')
        .limit(200)
        .get()
      return { ok: true, data: data || [] }
    } catch (e) {
      return { error: (e && e.message) || '查询失败' }
    }
  }

  const { id } = event
  if (!id) return { error: '缺少意向 id' }

  try {
    if (action === 'star') {
      await db.collection('customers').doc(id).update({
        data: { is_starred: !!event.starred, updated_at: new Date().toISOString() }
      })
      return { ok: true }
    }

    if (action === 'delete') {
      await db.collection('customers').doc(id).remove()
      return { ok: true }
    }

    return { error: '未知 action' }
  } catch (e) {
    return { error: (e && e.message) || '操作失败' }
  }
}
