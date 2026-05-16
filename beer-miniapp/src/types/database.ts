/**
 * 数据库类型定义 — 对齐微信云开发（CloudBase）NoSQL 集合结构
 *
 * wx.cloud 云数据库约定：
 *   _id      — 文档 ID（自动生成字符串）
 *   _openid  — 写入时由云函数填充，或由权限规则自动注入
 */

/** users 集合 */
export interface User {
  _id: string
  openid: string
  nickname: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  created_at: string
}

/** products 集合 */
export interface Product {
  _id: string
  name: string
  category: 'beer' | 'beer_machine' | 'beer_car'
  description: string | null
  spec: string | null
  price_range: string | null
  supply_type: 'sell' | 'rent' | 'both'
  cover_image: string | null   // wx.cloud fileID
  images: string[]             // wx.cloud fileID 数组
  is_active: boolean
  sort_order: number
  tags: string[]
  created_at: string
  updated_at: string
}

/** customers 集合（合作意向） */
export interface Customer {
  _id: string
  openid: string | null          // 已登录时写入，否则为 null
  nickname: string               // 昵称（必填）
  phone: string                  // 联系电话（必填）
  address: string | null         // 档口地址（选填）
  location: { latitude: number; longitude: number } | null  // GPS 坐标（选填）
  biz_type: 'night_stall' | 'open_restaurant' | 'market' | 'other' | null
  daily_volume: '<50' | '50-100' | '>100' | null
  interested_plan: 'basic' | 'standard' | 'premium' | 'undecided' | null
  need_beer_car: 'no' | 'buy' | 'rent' | null
  delivery_area: 'prd' | 'other' | null
  notes: string | null
  created_at: string
}

/** plans 集合（合作方案） */
export interface Plan {
  _id: string
  name: string
  level: 'basic' | 'standard' | 'premium'
  description: string | null
  features: string[]
  excluded: string[]
  is_active: boolean
  sort_order: number
}
