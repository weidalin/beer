// 日期/时间格式化

export function formatDate(dateStr: string | null | undefined, format = 'YYYY-MM-DD'): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(dateStr, 'MM-DD')
}

// 营业类型映射
const bizTypeMap: Record<string, string> = {
  night_stall: '宵夜档',
  open_restaurant: '大排档',
  market: '夜市摊',
  other: '其他'
}

export function formatBizType(type: string | null | undefined): string {
  if (!type) return '—'
  return bizTypeMap[type] || type
}

// 月均销量映射
const volumeMap: Record<string, string> = {
  '<50': '50桶以下',
  '50-100': '50-100桶',
  '>100': '100桶以上'
}

export function formatVolume(vol: string | null | undefined): string {
  if (!vol) return '—'
  return volumeMap[vol] || vol
}

// 合作方案映射
const planMap: Record<string, string> = {
  basic: '基础版',
  standard: '标准版',
  premium: '旗舰版',
  undecided: '还没想好'
}

export function formatPlan(plan: string | null | undefined): string {
  if (!plan) return '—'
  return planMap[plan] || plan
}

// 客户状态映射
const customerStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待跟进', color: '#FF9900' },
  contacted: { label: '已联系', color: '#409EFF' },
  signed: { label: '已签约', color: '#2DB884' },
  lost: { label: '已流失', color: '#999999' }
}

export function formatCustomerStatus(status: string): { label: string; color: string } {
  return customerStatusMap[status] || { label: status, color: '#999999' }
}

// 工单状态映射
const repairStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#FF9900' },
  assigned: { label: '已派单', color: '#409EFF' },
  processing: { label: '处理中', color: '#F5A623' },
  done: { label: '已完成', color: '#2DB884' }
}

export function formatRepairStatus(status: string): { label: string; color: string } {
  return repairStatusMap[status] || { label: status, color: '#999999' }
}

// 设备类型映射
const deviceTypeMap: Record<string, string> = {
  beer_machine: '打酒机',
  beer_car: '啤酒车',
  other: '其他'
}

export function formatDeviceType(type: string | null | undefined): string {
  if (!type) return '—'
  return deviceTypeMap[type] || type
}

// 配送区域映射
export function formatDeliveryArea(area: string | null | undefined): string {
  if (!area) return '—'
  return area === 'prd' ? '珠三角（当日达）' : '其他省市（走物流）'
}

// 供货方式映射
export function formatSupplyType(type: string | null | undefined): string {
  if (!type) return '—'
  const map: Record<string, string> = { sell: '出售', rent: '租赁', both: '出售/租赁均可' }
  return map[type] || type
}

// 手机号脱敏
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
