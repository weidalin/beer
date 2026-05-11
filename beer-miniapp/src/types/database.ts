// 数据库表类型定义（与 Supabase 表结构对齐）

export interface User {
  id: string
  openid: string
  nickname: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: 'beer' | 'beer_machine' | 'beer_car'
  sort_order: number
}

export interface Product {
  id: string
  name: string
  category: 'beer' | 'beer_machine' | 'beer_car'
  description: string | null
  spec: string | null
  price_range: string | null
  supply_type: 'sell' | 'rent' | 'both'
  cover_image: string | null
  images: string[]
  is_active: boolean
  sort_order: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string | null
  name: string
  phone: string
  address: string | null
  location: { latitude: number; longitude: number } | null
  biz_type: 'night_stall' | 'open_restaurant' | 'market' | 'other' | null
  daily_volume: '<50' | '50-100' | '>100' | null
  interested_plan: 'basic' | 'standard' | 'premium' | 'undecided' | null
  need_beer_car: boolean
  beer_car_type: 'buy' | 'rent' | null
  delivery_area: 'prd' | 'other' | null
  status: 'pending' | 'contacted' | 'signed' | 'lost'
  source: string | null
  notes: string | null
  follow_note: string | null
  created_at: string
  updated_at: string
}

export interface RepairOrder {
  id: string
  user_id: string | null
  customer_name: string
  phone: string
  device_type: 'beer_machine' | 'beer_car' | 'other'
  issue_desc: string
  issue_images: string[]
  preferred_time: string | null
  status: 'pending' | 'assigned' | 'processing' | 'done'
  assignee: string | null
  handler_notes: string | null
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  level: 'basic' | 'standard' | 'premium'
  description: string | null
  features: string[]
  excluded: string[]
  is_active: boolean
  sort_order: number
}
