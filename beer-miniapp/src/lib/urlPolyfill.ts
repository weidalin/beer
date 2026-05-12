/**
 * 微信小程序 URL / URLSearchParams polyfill
 *
 * supabase-js（内部用 @supabase/postgrest-js）在构建查询时会调用：
 *   this.url.searchParams.set(...)   ← 必须实现 URLSearchParams
 *   this.url.searchParams.append(...)
 *   this.url.toString() / this.url.href ← 必须随 searchParams 变化而更新
 *
 * 同时修复微信基础库 3.x 原生 URL 拒绝合法 https URL 的问题。
 */

class WxURLSearchParams {
  private _pairs: [string, string][] = []
  /** 反向引用所属 URL，供 set/append/delete 后同步 href */
  _owner: WxURL | null = null

  constructor(search?: string) {
    if (!search) return
    const qs = search.startsWith('?') ? search.slice(1) : search
    if (!qs) return
    for (const part of qs.split('&')) {
      const idx = part.indexOf('=')
      if (idx === -1) {
        this._pairs.push([_dec(part), ''])
      } else {
        this._pairs.push([_dec(part.slice(0, idx)), _dec(part.slice(idx + 1))])
      }
    }
  }

  set(name: string, value: string) {
    this._pairs = this._pairs.filter(([k]) => k !== name)
    this._pairs.push([name, value])
    this._owner?._sync()
  }
  append(name: string, value: string) {
    this._pairs.push([name, value])
    this._owner?._sync()
  }
  delete(name: string) {
    this._pairs = this._pairs.filter(([k]) => k !== name)
    this._owner?._sync()
  }
  get(name: string): string | null {
    return this._pairs.find(([k]) => k === name)?.[1] ?? null
  }
  getAll(name: string): string[] {
    return this._pairs.filter(([k]) => k === name).map(([, v]) => v)
  }
  has(name: string): boolean {
    return this._pairs.some(([k]) => k === name)
  }
  forEach(cb: (value: string, key: string) => void) {
    for (const [k, v] of this._pairs) cb(v, k)
  }
  entries(): [string, string][] {
    return [...this._pairs]
  }
  toString(): string {
    return this._pairs
      .map(([k, v]) => `${_enc(k)}=${_enc(v)}`)
      .join('&')
  }
}

function _dec(s: string) {
  try { return decodeURIComponent(s.replace(/\+/g, ' ')) } catch { return s }
}
function _enc(s: string) {
  try { return encodeURIComponent(s) } catch { return s }
}

class WxURL {
  href!: string
  protocol!: string
  host!: string
  hostname!: string
  port!: string
  pathname!: string
  search!: string
  hash!: string
  origin!: string
  searchParams!: WxURLSearchParams

  constructor(url: string, base?: string | WxURL) {
    const baseStr =
      !base ? undefined
      : typeof base === 'string' ? base
      : base.href
    const full = baseStr ? this._resolve(baseStr, url) : url
    const m = full.match(
      /^([a-z][a-z0-9+\-.]*:)\/\/([^/?#:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i
    )
    if (!m) throw new TypeError(`Failed to construct 'URL': Invalid URL: ${full}`)
    this.protocol = m[1]
    this.hostname = m[2]
    this.port     = m[3] ?? ''
    this.pathname = m[4] ?? '/'
    this.search   = m[5] ?? ''
    this.hash     = m[6] ?? ''
    this.host   = this.port ? `${this.hostname}:${this.port}` : this.hostname
    this.origin = `${this.protocol}//${this.host}`
    this.searchParams = new WxURLSearchParams(this.search)
    this.searchParams._owner = this
    this._sync()
  }

  /** Called by WxURLSearchParams after mutations to keep href / search in sync */
  _sync() {
    const qs = this.searchParams.toString()
    this.search = qs ? `?${qs}` : ''
    this.href = `${this.origin}${this.pathname}${this.search}${this.hash}`
  }

  private _resolve(base: string, relative: string): string {
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(relative)) return relative
    const bm = base.match(/^([a-z][a-z0-9+\-.]*:\/\/[^/]+)/i)
    if (!bm) throw new TypeError('Invalid base URL')
    return relative.startsWith('/') ? bm[1] + relative : bm[1] + '/' + relative
  }

  toString() { return this.href }
  toJSON()   { return this.href }
}

// @ts-ignore
globalThis.URL = WxURL
// @ts-ignore
globalThis.URLSearchParams = WxURLSearchParams
