/**
 * 云函数：productAdmin
 * 管理员对产品增删改（服务端写库，不受「仅创建者可写」限制）。
 */
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const SEED_ADMIN_OPENIDS = ['obMhl3Q1ZcwR-oq0J3VkTGOIaQjU']

function parseOpenidList(str) {
  if (!str || typeof str !== 'string') return []
  return str.split(/[,;\s\n\r]+/).map((s) => s.trim()).filter(Boolean)
}

async function assertAdmin(openid) {
  if (!openid) throw new Error('未登录')

  const { data } = await db.collection('users').where({ openid }).limit(1).get()
  const user = data && data[0]
  if (user && user.role === 'customer') {
    throw new Error('无管理员权限')
  }
  if (user && user.role === 'admin') {
    return
  }

  const allow = new Set(SEED_ADMIN_OPENIDS)
  parseOpenidList(process.env.ADMIN_OPEN_IDS || '').forEach((id) => allow.add(id))
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
  const now = new Date().toISOString()

  try {
    if (action === 'create') {
      const product = event.product || {}
      const payload = {
        name: product.name || '',
        category: product.category || 'beer',
        description: product.description ?? null,
        spec: product.spec ?? null,
        price_range: product.price_range ?? null,
        supply_type: product.supply_type ?? 'both',
        cover_image: product.cover_image ?? null,
        images: product.images ?? [],
        is_active: product.is_active ?? false,
        sort_order: product.sort_order ?? 0,
        tags: product.tags ?? [],
        created_at: now,
        updated_at: now
      }
      const { _id } = await db.collection('products').add({ data: payload })
      return { ok: true, product: { _id, ...payload } }
    }

    if (action === 'update') {
      const id = event.id
      if (!id) return { error: '缺少产品 id' }
      const updates = { ...(event.updates || {}), updated_at: now }
      delete updates._id
      delete updates.created_at
      await db.collection('products').doc(id).update({ data: updates })
      return { ok: true }
    }

    if (action === 'toggleActive') {
      const id = event.id
      if (!id) return { error: '缺少产品 id' }
      await db.collection('products').doc(id).update({
        data: { is_active: !!event.isActive, updated_at: now }
      })
      return { ok: true }
    }

    if (action === 'delete') {
      const id = event.id
      if (!id) return { error: '缺少产品 id' }
      await db.collection('products').doc(id).remove()
      return { ok: true }
    }

    return { error: '未知 action' }
  } catch (e) {
    return { error: e.message || '操作失败' }
  }
}
