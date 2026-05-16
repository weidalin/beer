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

/** 产品筛选参数 */
export interface ProductFilter {
  category?: 'beer' | 'beer_machine' | 'beer_car' | 'all'
  keyword?: string
  page?: number
  pageSize?: number
}

/** 微信云函数登录返回 */
export interface WxLoginResult {
  openid: string
}
