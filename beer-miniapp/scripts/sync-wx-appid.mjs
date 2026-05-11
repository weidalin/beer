/**
 * 将 .env 中的 VITE_WX_APPID 写入 src/manifest.json 的 mp-weixin.appid，
 * 避免与微信开发者工具里「填了 AppID 但工程 manifest 仍是占位符」不一致。
 * 未设置或仍是占位时跳过，不修改文件。
 */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envPath = join(root, '.env')
const manifestPath = join(root, 'src', 'manifest.json')

function loadWxAppId() {
  if (!fs.existsSync(envPath)) return ''
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\n/)) {
    const t = line.trim()
    if (t.startsWith('#') || !t) continue
    const m = t.match(/^VITE_WX_APPID\s*=\s*(.+)$/)
    if (m) {
      return m[1]
        .trim()
        .replace(/^["']|["']$/g, '')
        .trim()
    }
  }
  return ''
}

const appid = loadWxAppId()
if (!appid || appid === '你的小程序AppID' || appid === '你的AppID') {
  console.warn(
    '[sync-wx-appid] 未设置 VITE_WX_APPID（或仍为占位符），跳过写入 manifest。请在 .env 中配置后重新 build。'
  )
  process.exit(0)
}

// 微信小游戏/公众号 id 也有 wx 开头，小程序一般为 wx + 16 位十六进制
if (!/^wx[0-9a-f]{16}$/i.test(appid)) {
  console.warn(`[sync-wx-appid] VITE_WX_APPID 格式异常（应为 wx + 16 位十六进制）: ${appid}`)
  process.exit(0)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (!manifest['mp-weixin']) manifest['mp-weixin'] = {}
const prev = manifest['mp-weixin'].appid
manifest['mp-weixin'].appid = appid
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n', 'utf8')
if (prev !== appid) {
  console.log(`[sync-wx-appid] 已更新 mp-weixin.appid: ${appid}`)
} else {
  console.log(`[sync-wx-appid] mp-weixin.appid 已是 ${appid}，未变化`)
}
