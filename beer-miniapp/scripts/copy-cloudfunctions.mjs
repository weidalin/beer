/**
 * 将仓库根目录 cloudfunctions/{wxLogin,init_db} 同步到 dist/build/mp-weixin/cloudfunctions，
 * 便于微信开发者工具识别 cloudfunctionRoot（不复制 SKILL.md、dist-zips 等）。
 *
 * Windows：若微信开发者工具正在占用 dist 下的 cloudfunctions，rmSync 会 EPERM；
 * 先重试删除，仍失败则跳过删除、直接覆盖复制。
 */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const distWx = join(root, 'dist', 'build', 'mp-weixin')
const destRoot = join(distWx, 'cloudfunctions')
/** 与 beer-miniapp 同级的仓库根目录下的 cloudfunctions */
const repoCfRoot = join(root, '..', 'cloudfunctions')
const FUNCTION_NAMES = ['wxLogin', 'init_db']

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function removeDestIfPossible(dir) {
  if (!fs.existsSync(dir)) return
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
      return
    } catch (e) {
      const code = e && e.code
      if ((code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') && attempt < 4) {
        console.warn(
          `[copy-cloudfunctions] 无法删除旧 cloudfunctions（${code}，可能被微信开发者工具占用），400ms 后重试 (${attempt + 1}/5)…`
        )
        await sleep(400)
        continue
      }
      console.warn('[copy-cloudfunctions] 跳过清空目录:', (e && e.message) || e)
      console.warn(
        '[copy-cloudfunctions] 将直接覆盖复制。若需彻底删除旧文件，请先关闭微信开发者工具再执行 build。'
      )
      return
    }
  }
}

async function main() {
  if (!fs.existsSync(distWx)) {
    console.warn('[copy-cloudfunctions] 未找到 dist/build/mp-weixin，请先执行 uni build -p mp-weixin')
    process.exit(0)
  }

  await removeDestIfPossible(destRoot)
  fs.mkdirSync(destRoot, { recursive: true })

  if (!fs.existsSync(repoCfRoot)) {
    console.warn('[copy-cloudfunctions] 未找到', repoCfRoot)
    process.exit(0)
  }

  for (const name of FUNCTION_NAMES) {
    const src = join(repoCfRoot, name)
    if (!fs.existsSync(src)) {
      console.warn(`[copy-cloudfunctions] 跳过 ${name}：不存在 ${src}`)
      continue
    }
    fs.cpSync(src, join(destRoot, name), { recursive: true })
    console.log(`[copy-cloudfunctions] 已复制 ${name}/ → dist/build/mp-weixin/cloudfunctions/${name}/`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
