/**
 * 微信小程序 fetch polyfill
 *
 * supabase-js 内部通过 globalThis.fetch 发 HTTP 请求。
 * 微信小程序无原生 fetch，用 uni.request 包装一个兼容实现。
 * 若运行环境已有可用的原生 fetch（如 H5、部分高版本基础库），则跳过。
 */

if (!globalThis.fetch) {
  // 轻量 Headers 实现
  class WxHeaders {
    private _map: Record<string, string> = {}

    constructor(init?: Record<string, string> | WxHeaders) {
      if (!init) return
      const src = init instanceof WxHeaders ? init._map : init
      for (const k of Object.keys(src)) {
        this._map[k.toLowerCase()] = src[k]
      }
    }

    get(name: string) { return this._map[name.toLowerCase()] ?? null }
    set(name: string, value: string) { this._map[name.toLowerCase()] = value }
    has(name: string) { return name.toLowerCase() in this._map }
    append(name: string, value: string) { this._map[name.toLowerCase()] = value }
    forEach(cb: (value: string, key: string) => void) {
      for (const k of Object.keys(this._map)) cb(this._map[k], k)
    }
    entries() { return Object.entries(this._map) }
    // 供 supabase-js 内部合并 headers 时访问原始对象
    _raw() { return { ...this._map } }
  }

  // 轻量 Response 实现
  class WxResponse {
    readonly ok: boolean
    readonly status: number
    readonly statusText: string
    readonly headers: WxHeaders
    private _body: string

    constructor(body: string, status: number, headers: Record<string, string>) {
      this.status = status
      this.ok = status >= 200 && status < 300
      this.statusText = String(status)
      this.headers = new WxHeaders(headers as Record<string, string>)
      this._body = body
    }

    async json() {
      return JSON.parse(this._body)
    }
    async text() {
      return this._body
    }
    async arrayBuffer() {
      // 小程序场景下 supabase-js 不会调用 arrayBuffer
      throw new Error('arrayBuffer not supported in wx fetch polyfill')
    }
    clone() {
      return new WxResponse(this._body, this.status, this.headers._raw())
    }
  }

  // fetch 主实现
  ;(globalThis as any).fetch = function wxFetch(
    input: string | { url?: string; href?: string; toString(): string },
    init: {
      method?: string
      headers?: Record<string, string> | WxHeaders
      body?: string
      signal?: { aborted?: boolean }
    } = {}
  ): Promise<WxResponse> {
    const url = typeof input === 'string' ? input : (input as any).href ?? String(input)
    const method = (init.method ?? 'GET').toUpperCase()

    // 展开 headers（兼容 Headers 实例或普通对象）
    let headerMap: Record<string, string> = {}
    if (init.headers) {
      if (typeof (init.headers as any)._raw === 'function') {
        headerMap = (init.headers as any)._raw()
      } else if (typeof (init.headers as any).forEach === 'function') {
        ;(init.headers as any).forEach((v: string, k: string) => { headerMap[k] = v })
      } else {
        headerMap = { ...(init.headers as Record<string, string>) }
      }
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: method as any,
        header: headerMap,
        data: init.body ?? undefined,
        // 让 uni.request 把响应体当字符串返回
        responseType: 'text',
        success(res) {
          // uni.request responseType:'text' 有时仍返回对象，统一序列化
          const bodyStr =
            typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
          const respHeaders: Record<string, string> = {}
          if (res.header) {
            for (const k of Object.keys(res.header)) {
              respHeaders[k.toLowerCase()] = String(res.header[k])
            }
          }
          resolve(new WxResponse(bodyStr, res.statusCode ?? 200, respHeaders) as any)
        },
        fail(err) {
          reject(new TypeError(`wx fetch failed: ${err?.errMsg ?? JSON.stringify(err)}`))
        }
      })
    })
  }

  ;(globalThis as any).Headers = WxHeaders
  ;(globalThis as any).Response = WxResponse
}
