// API 相关类型定义

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

// 预约提交表单
export interface BookingForm {
  name: string
  phone: string
  address: string
  location?: { latitude: number; longitude: number }
  biz_type: 'night_stall' | 'open_restaurant' | 'market' | 'other'
  daily_volume: '<50' | '50-100' | '>100'
  interested_plan: 'basic' | 'standard' | 'premium' | 'undecided'
  need_beer_car: boolean
  beer_car_type?: 'buy' | 'rent'
  delivery_area: 'prd' | 'other'
  notes?: string
}

// 报修工单提交表单
export interface RepairForm {
  customer_name: string
  phone: string
  device_type: 'beer_machine' | 'beer_car' | 'other'
  issue_desc: string
  issue_images?: string[]
  preferred_time?: string
}

// 产品筛选参数
export interface ProductFilter {
  category?: 'beer' | 'beer_machine' | 'beer_car' | 'all'
  keyword?: string
  page?: number
  pageSize?: number
}

// 后台客户筛选
export interface CustomerFilter {
  status?: 'pending' | 'contacted' | 'signed' | 'lost' | 'all'
  keyword?: string
}

// 后台工单筛选
export interface OrderFilter {
  status?: 'pending' | 'assigned' | 'processing' | 'done' | 'all'
}

// 微信登录返回
export interface WxLoginResult {
  openid: string
  session_key: string
}
