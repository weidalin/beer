/**
 * wx.cloud 封装层
 *
 * 统一管理云开发初始化、数据库操作、文件上传，替代 Supabase。
 * 只在微信小程序环境下可用（wx.cloud 由微信基础库注入）。
 *
 * 使用方式：
 *   import { db, uploadFile, callFunction } from '../lib/cloud'
 *   const res = await db.collection('products').get()
 */

// 微信小程序环境中 wx 由全局注入，这里声明类型以避免 TS 报错
declare const wx: Record<string, unknown> & {
  cloud: WxCloud
}

interface WxCloud {
  /** 与开发者工具「云开发」当前选中环境一致，真机用小程序已关联环境 */
  readonly DYNAMIC_CURRENT_ENV?: string
  init(options: { env: string; traceUser?: boolean }): void
  database(options?: { env?: string }): WxDatabase
  uploadFile(options: WxUploadOptions): WxRequestTask
  getTempFileURL(options: WxGetTempFileURLOptions): void
  callFunction(options: WxCallFunctionOptions): Promise<WxCallFunctionResult>
}

interface WxDatabase {
  collection(name: string): WxCollection
  command: WxCommand
}

interface WxCollection {
  doc(id: string): WxDoc
  add(options: { data: Record<string, unknown> }): Promise<{ _id: string }>
  where(condition: Record<string, unknown>): WxQuery
  orderBy(field: string, order: 'asc' | 'desc'): WxQuery
  limit(n: number): WxQuery
  skip(n: number): WxQuery
  get(): Promise<{ data: Record<string, unknown>[] }>
  count(): Promise<{ total: number }>
  field(definition: Record<string, boolean>): WxQuery
}

interface WxDoc {
  get(): Promise<{ data: Record<string, unknown> | null }>
  update(options: { data: Record<string, unknown> }): Promise<unknown>
  remove(): Promise<unknown>
  set(options: { data: Record<string, unknown> }): Promise<unknown>
}

interface WxQuery {
  doc?(id: string): WxDoc
  where(condition: Record<string, unknown>): WxQuery
  orderBy(field: string, order: 'asc' | 'desc'): WxQuery
  limit(n: number): WxQuery
  skip(n: number): WxQuery
  get(): Promise<{ data: Record<string, unknown>[] }>
  count(): Promise<{ total: number }>
  update(options: { data: Record<string, unknown> }): Promise<unknown>
  field(definition: Record<string, boolean>): WxQuery
}

interface WxCommand {
  eq(val: unknown): unknown
  neq(val: unknown): unknown
  gt(val: unknown): unknown
  gte(val: unknown): unknown
  lt(val: unknown): unknown
  lte(val: unknown): unknown
  in(vals: unknown[]): unknown
  nin(vals: unknown[]): unknown
  and(...conditions: unknown[]): unknown
  or(...conditions: unknown[]): unknown
  set(val: unknown): unknown
  inc(val: number): unknown
  push(val: unknown): unknown
  pull(val: unknown): unknown
  regex(val: RegExp | string, flags?: string): unknown
}

interface WxUploadOptions {
  cloudPath: string
  filePath: string
  config?: { env?: string }
  success?: (res: { fileID: string }) => void
  fail?: (err: unknown) => void
}

interface WxGetTempFileURLOptions {
  fileList: string[]
  success?: (res: { fileList: Array<{ fileID: string; tempFileURL: string }> }) => void
  fail?: (err: unknown) => void
}

interface WxCallFunctionOptions {
  name: string
  data?: Record<string, unknown>
  config?: { env?: string }
}

interface WxCallFunctionResult {
  result: unknown
  errMsg: string
}

interface WxRequestTask {
  abort?(): void
}

// 云开发环境 ID（打包进小程序）；须与当前小程序在微信侧已关联的环境一致
const ENV_ID_FROM_VITE = ((import.meta.env.VITE_CLOUD_ENV_ID as string) || '').trim()
/** 设为 true/1 时：仅用 .env 里的 ID，不再用 DYNAMIC（多环境且必须写死时用） */
const FORCE_EXPLICIT =
  import.meta.env.VITE_CLOUD_ENV_FORCE_EXPLICIT === 'true' ||
  import.meta.env.VITE_CLOUD_ENV_FORCE_EXPLICIT === '1'

let _inited = false

/**
 * 解析要传给 wx.cloud.init 的 env。
 * 已配置 VITE_CLOUD_ENV_ID 时优先使用（与已部署云函数环境一致），避免工具里选中其它环境导致 callFunction 一直等到 timeout。
 * 未配置 .env 时再回退 DYNAMIC_CURRENT_ENV。
 */
function resolveCloudEnvId(): string {
  if (typeof wx === 'undefined' || !wx.cloud) return ''
  const dynamic = wx.cloud.DYNAMIC_CURRENT_ENV
  const explicit = ENV_ID_FROM_VITE
  if (FORCE_EXPLICIT) {
    if (explicit) return explicit
    if (dynamic) return dynamic
    return ''
  }
  if (explicit) return explicit
  if (dynamic) return dynamic
  return ''
}

/** 客户端云请求超时（毫秒） */
const CLOUD_REQUEST_MS = 20000

function formatCloudError(e: unknown, label: string): string {
  const msg =
    e && typeof e === 'object' && 'errMsg' in e
      ? String((e as { errMsg?: string }).errMsg)
      : e instanceof Error
        ? e.message
        : String(e)
  if (/timeout|超时|TIMEOUT/i.test(msg)) {
    return `${label} 超时：请确认开发者工具「云开发」环境与 .env 的 VITE_CLOUD_ENV_ID（${ENV_ID_FROM_VITE || '未配置'}）一致，并已部署云函数`
  }
  return msg || `${label} 失败`
}

/** 为云开发 Promise 增加客户端超时，避免一直挂起无 Network 记录 */
export function withCloudTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = CLOUD_REQUEST_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} 超时（${ms / 1000}s）：请检查云开发环境与云函数是否已部署到 ${ENV_ID_FROM_VITE || '当前环境'}`
        )
      )
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(new Error(formatCloudError(e, label)))
      }
    )
  })
}

/**
 * 初始化云开发，在 App.vue onLaunch 时调用一次即可。
 * 若已初始化则跳过。
 */
export function initCloud(): void {
  if (_inited) return
  if (typeof wx === 'undefined' || !wx.cloud) {
    console.warn('[cloud] wx.cloud 不可用（非微信小程序环境）')
    return
  }
  const env = resolveCloudEnvId()
  if (!env) {
    console.warn(
      '[cloud] 无法解析云环境：无 DYNAMIC_CURRENT_ENV 且未配置 VITE_CLOUD_ENV_ID。请在 .env 设置 VITE_CLOUD_ENV_ID 后重新 build，或在开发者工具云开发里选中环境'
    )
    return
  }
  wx.cloud.init({ env, traceUser: true })
  _inited = true
  if (import.meta.env.DEV) {
    console.info('[cloud] 已初始化，env =', env)
  }
}

function activeCloudEnvId(): string {
  if (typeof wx === 'undefined' || !wx.cloud) return ''
  return resolveCloudEnvId()
}

/**
 * 获取云数据库实例（惰性初始化）。
 */
export function getDB(): WxDatabase {
  if (!_inited) initCloud()
  const env = activeCloudEnvId()
  if (env) return wx.cloud.database({ env })
  return wx.cloud.database()
}

/**
 * 便捷访问：云数据库实例
 */
export const db: WxDatabase = new Proxy({} as WxDatabase, {
  get(_target, prop: string) {
    const database = getDB()
    const value = (database as unknown as Record<string, unknown>)[prop]
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(database)
    }
    return value
  }
})

/**
 * 调用云函数（Promise 封装）
 */
export async function callFunction<T = unknown>(
  name: string,
  data?: Record<string, unknown>
): Promise<T> {
  if (!_inited) initCloud()
  const env = activeCloudEnvId()
  if (!env) {
    throw new Error(
      '云开发未初始化：未解析到环境 ID。请在 .env 配置 VITE_CLOUD_ENV_ID 并重新编译，或在微信开发者工具云开发中选择环境'
    )
  }
  try {
    const res = await withCloudTimeout(
      wx.cloud.callFunction({
        name,
        data,
        config: { env }
      }),
      `云函数 ${name}`
    )
    return res.result as T
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/FUNCTION_NOT_FOUND|FUNCTION_NOT_EXIST|could not find/i.test(msg)) {
      throw new Error(`云函数 ${name} 未找到，请在开发者工具上传并部署该云函数（云端安装依赖）`)
    }
    throw e instanceof Error ? e : new Error(msg)
  }
}

/**
 * 上传图片至微信云存储，返回 fileID
 */
export function uploadFile(cloudPath: string, filePath: string): Promise<string> {
  if (!_inited) initCloud()
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success(res) {
        resolve(res.fileID)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 批量将 fileID 转换为临时可访问 URL
 */
export function getTempFileURLs(fileIDs: string[]): Promise<string[]> {
  if (!fileIDs.length) return Promise.resolve([])
  if (!_inited) initCloud()
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList: fileIDs,
      success(res) {
        resolve(res.fileList.map(f => f.tempFileURL))
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 将单个 fileID 转换为临时 URL，失败时返回 fallback 或空字符串
 */
export async function fileIDToURL(
  fileID: string | null | undefined,
  fallback = ''
): Promise<string> {
  if (!fileID) return fallback
  if (fileID.startsWith('http')) return fileID
  try {
    const urls = await getTempFileURLs([fileID])
    return urls[0] || fallback
  } catch {
    return fallback
  }
}
