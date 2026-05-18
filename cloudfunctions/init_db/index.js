/**
 * 云开发数据库初始化脚本
 *
 * 用途：在云开发控制台「云函数」或本地 Node.js 环境一次性执行，
 *       创建所有集合并写入种子数据（plans + 示例 products）。
 *
 * 执行方式：
 *   方式一（推荐）：复制下方各集合的 JSON 数据，在云开发控制台
 *                   「数据库」→ 对应集合 → 「添加记录」手动粘贴。
 *
 *   方式二：部署为云函数 init_db：会先 `createCollection` 建 `plans` / `products` / `users` / `customers`（已存在则忽略），再写入种子数据；管理员 users 会去重或升权。
 *           管理员 openid 来源（合并去重，可多选）：
 *           - 下方 SEED_ADMIN_OPENIDS 预设（与本地 .env 的 ADMIN_OPEN_ID 对齐，可多人追加）；
 *           - callFunction data：adminOpenid 单字符串，或 adminOpenids 数组，或 adminOpenids 逗号分隔字符串；
 *           - 云函数环境变量：ADMIN_OPEN_IDS（逗号分隔）、ADMIN_OPEN_ID / ADMIN_OPENID。
 *
 * ⚠️  仅需执行一次；重复执行会再次插入 plans/products，管理员 users 会去重或升权。
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/** 预设管理员 openid（可多人追加；与 beer-miniapp/.env 中 ADMIN_OPEN_ID 对齐备忘） */
const SEED_ADMIN_OPENIDS = ['obMhl3Q1ZcwR-oq0J3VkTGOIaQjU']

function parseOpenidList(str) {
  if (!str || typeof str !== 'string') return []
  return str
    .split(/[,;\s\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function collectAdminOpenids(event = {}) {
  const ids = new Set()
  const add = (raw) => {
    if (raw == null || raw === '') return
    if (Array.isArray(raw)) {
      raw.forEach((x) => add(x))
      return
    }
    if (typeof raw === 'string') {
      parseOpenidList(raw).forEach((id) => ids.add(id))
    }
  }

  add(event.adminOpenids)
  add(event.adminOpenid)
  add(event.admin_open_id)

  add(parseOpenidList(process.env.ADMIN_OPEN_IDS || ''))
  add(process.env.ADMIN_OPEN_ID)
  add(process.env.ADMIN_OPENID)

  SEED_ADMIN_OPENIDS.forEach((id) => add(id))

  return [...ids]
}

exports.main = async (event = {}) => {
  const results = {}

  // ── 0. 确保集合存在（部分环境 add 不会隐式建表 → DATABASE_COLLECTION_NOT_EXIST / -502005）
  const collectionNames = ['plans', 'products', 'users', 'customers']
  results.ensureCollections = []
  for (const name of collectionNames) {
    try {
      await db.createCollection(name)
      results.ensureCollections.push({ name, status: 'created' })
    } catch (e) {
      const msg = (e && (e.message || e.errMsg)) || String(e)
      if (/exist|已存在|duplicate|重复/i.test(msg) || (e && e.errCode === -1)) {
        results.ensureCollections.push({ name, status: 'exists' })
      } else {
        results.ensureCollections.push({ name, status: 'skipped_or_fail', error: msg })
      }
    }
  }

  // ── 1. plans 合作方案（种子数据） ──────────────────────────────────────
  try {
    const plansData = [
      {
        name: '基础版',
        level: 'basic',
        description: '轻松起步，零门槛合作。适合刚起步的宵夜档、夜市摊。',
        features: [
          '免押金起步',
          '每周1次配送',
          '桶装鲜啤直供',
          '72小时维修响应',
          '专属业务对接'
        ],
        excluded: ['不含打酒机', '不含啤酒车（可单独选配）'],
        is_active: true,
        sort_order: 1
      },
      {
        name: '标准版',
        level: 'standard',
        description: '最受欢迎，性价比之选。大多数大排档、宵夜店的优选方案。',
        features: [
          '免押金起步',
          '每周2次配送',
          '桶装鲜啤直供',
          '提供打酒机1台',
          '48小时维修响应',
          '专属业务对接',
          '优先发货保障'
        ],
        excluded: ['不含啤酒车（可单独选配）'],
        is_active: true,
        sort_order: 2
      },
      {
        name: '旗舰版',
        level: 'premium',
        description: '全方位支持，高销量档口首选。高客流档口、连锁夜市摊位尊享。',
        features: [
          '免押金起步',
          '每日配送',
          '桶装鲜啤直供',
          '提供打酒机1台',
          '4小时紧急维修响应',
          '专属客户经理',
          '优先发货保障',
          '定期设备保养'
        ],
        excluded: ['不含啤酒车（可单独选配）'],
        is_active: true,
        sort_order: 3
      }
    ]

    const planResults = await Promise.all(
      plansData.map(p => db.collection('plans').add({ data: p }))
    )
    results.plans = `已插入 ${planResults.length} 条`
  } catch (e) {
    results.plans = `失败: ${e.message}`
  }

  // ── 2. products 示例产品 ────────────────────────────────────────────────
  try {
    const now = new Date().toISOString()
    const productsData = [
      {
        name: '桶装精酿鲜啤 30L',
        category: 'beer',
        description: '新鲜桶装直供，珠三角当日达。采用德式工艺酿造，口感醇厚清爽，适合大排档、宵夜档日常销售。',
        spec: '30L / 50L 两种规格可选',
        price_range: '面议',
        supply_type: 'both',
        cover_image: null,
        images: [],
        is_active: true,
        sort_order: 100,
        tags: ['hot'],
        created_at: now,
        updated_at: now
      },
      {
        name: '台式精酿打酒机',
        category: 'beer_machine',
        description: '专业级台式打酒机，制冷效果好，适合桶装鲜啤销售场景。支持出售和租赁两种方式。',
        spec: '制冷功率 1200W，适配 30L/50L 桶',
        price_range: '面议',
        supply_type: 'both',
        cover_image: null,
        images: [],
        is_active: true,
        sort_order: 90,
        tags: ['recommend'],
        created_at: now,
        updated_at: now
      },
      {
        name: '移动啤酒售卖车',
        category: 'beer_car',
        description: '定制移动啤酒车，可快速部署于夜市、广场等场景。整车含打酒机、储桶空间，开箱即营业。',
        spec: '标准款 / 豪华款，含制冷系统',
        price_range: '面议',
        supply_type: 'both',
        cover_image: null,
        images: [],
        is_active: true,
        sort_order: 80,
        tags: ['new'],
        created_at: now,
        updated_at: now
      }
    ]

    const productResults = await Promise.all(
      productsData.map(p => db.collection('products').add({ data: p }))
    )
    results.products = `已插入 ${productResults.length} 条`
  } catch (e) {
    results.products = `失败: ${e.message}`
  }

  // ── 3. users 管理员（可多 openid，合并去重后 upsert）────────────────────
  const adminIds = collectAdminOpenids(event)
  if (adminIds.length === 0) {
    results.admin = '⚠️  跳过：未配置管理员 openid（见文件头 SEED / data / 环境变量）'
  } else {
    const details = []
    for (const openid of adminIds) {
      try {
        const existing = await db.collection('users').where({ openid }).limit(1).get()
        if (existing.data.length === 0) {
          await db.collection('users').add({
            data: {
              openid,
              nickname: '管理员',
              avatar_url: null,
              role: 'admin',
              created_at: new Date().toISOString()
            }
          })
          details.push({ openid, action: 'created' })
        } else {
          await db.collection('users').where({ openid }).update({ data: { role: 'admin' } })
          details.push({ openid, action: 'promoted' })
        }
      } catch (e) {
        details.push({ openid, action: 'fail', error: e.message })
      }
    }
    results.admin = { count: adminIds.length, details }
  }

  return results
}

/*
 * ════════════════════════════════════════════════════════════════
 *  云开发数据库权限配置说明（在控制台手动设置，无法用代码配置）
 * ════════════════════════════════════════════════════════════════
 *
 *  集合       | 权限模板
 *  -----------|--------------------------------------------------
 *  products   | C 端列表需「所有人可读上架商品」，切勿用「仅创建者可读写」整表模板
 *             |   若读权限被限制为本人文档，控制台会看到 where 自动带上 _openid，
 *             |   种子数据由云函数写入，_openid 与小程序用户不一致 → 列表长期为空、
 *             |   并提示为 (is_active, _openid, sort_order) 建索引，甚至查询超时。
 *             | → 自定义安全规则示例（读全开；写仅限创建者，管理员可用云函数或改规则）:
 *             |   { "read": true, "write": "auth.openid == doc._openid" }
 *             |   （若需小程序端管理员改任意商品，需单独设计 write 条件或走云函数。）
 *  plans      | 所有用户可读
 *             |   { "read": true, "write": false }
 *  customers  | 合作意向：小程序走云函数 submitIntention 写入（会自动 createCollection）
 *             |   读：本人记录 { "read": "doc.openid == auth.openid || !doc.openid", "write": false }
 *             |   或管理员后台读全开需另配；写建议仅云函数，客户端 write: false
 *  users      | 创建者可读写
 *             |   { "read": "doc.openid == auth.openid",
 *             |     "write": "doc.openid == auth.openid" }
 *
 *  ── products 索引建议（云开发控制台 → 数据库 → products → 索引管理）────────
 *  在 read: true 且 C 端查询为 is_active + orderBy(sort_order desc) 的前提下：
 *    1) 分类为「全部」时：组合字段 is_active(升序) + sort_order(降序)
 *    2) 带 category 时：is_active(升序) + category(升序) + sort_order(降序)
 *  若短期内无法改权限、仍出现 is_active + _openid + sort_order，可临时按控制台
 *  「一键创建索引」链接建立该组合索引以减轻告警与超时（根本仍应修正读权限）。
 *
 * ════════════════════════════════════════════════════════════════
 */
