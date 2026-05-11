/**
 * 微信小程序内置的 URL 对象残缺（某些合法 https URL 会抛异常），
 * supabase-js 内部用 new URL() 验证 supabaseUrl，因此直接替换为可靠实现。
 */

// @ts-ignore
globalThis.URL = class URL {
  href: string
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string

  constructor(url: string, base?: string) {
    const full = base ? this._resolve(base, url) : url
    const m = full.match(
      /^([a-z][a-z0-9+\-.]*:)\/\/([^/?#:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i
    )
    if (!m) throw new TypeError(`Failed to construct 'URL': Invalid URL: ${full}`)
    this.protocol = m[1]
    this.hostname = m[2]
    this.port = m[3] ?? ''
    this.pathname = m[4] ?? '/'
    this.search = m[5] ?? ''
    this.hash = m[6] ?? ''
    this.host = this.port ? `${this.hostname}:${this.port}` : this.hostname
    this.origin = `${this.protocol}//${this.host}`
    this.href = `${this.origin}${this.pathname}${this.search}${this.hash}`
  }

  private _resolve(base: string | { href?: string; toString(): string }, relative: string): string {
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(relative)) return relative
    // Accept URL objects (e.g. when supabase-js passes a URL instance as base)
    const baseStr = typeof base === 'string' ? base : (base as any).href ?? String(base)
    const bm = baseStr.match(/^([a-z][a-z0-9+\-.]*:\/\/[^/]+)/i)
    if (!bm) throw new TypeError('Invalid base URL')
    return relative.startsWith('/') ? bm[1] + relative : bm[1] + '/' + relative
  }

  toString() { return this.href }
  toJSON() { return this.href }
}
