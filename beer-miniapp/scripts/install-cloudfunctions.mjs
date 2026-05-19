/**
 * 为仓库根目录 cloudfunctions/* 安装 npm 依赖（含 wx-server-sdk），
 * 供 copy-cloudfunctions 一并复制到 dist，避免云端报 Cannot find module 'wx-server-sdk'。
 */
import { execSync } from 'child_process'
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoCfRoot = join(__dirname, '..', '..', 'cloudfunctions')

const FUNCTION_NAMES = ['wxLogin', 'init_db', 'updateProfile', 'productAdmin', 'submitIntention', 'customerAdmin']

function installOne(name) {
  const dir = join(repoCfRoot, name)
  const pkg = join(dir, 'package.json')
  if (!fs.existsSync(pkg)) {
    console.warn(`[install-cloudfunctions] 跳过 ${name}：无 package.json`)
    return
  }
  console.log(`[install-cloudfunctions] npm install → ${name}/`)
  execSync('npm install --omit=dev', { cwd: dir, stdio: 'inherit' })
}

if (!fs.existsSync(repoCfRoot)) {
  console.warn('[install-cloudfunctions] 未找到', repoCfRoot)
  process.exit(0)
}

for (const name of FUNCTION_NAMES) {
  installOne(name)
}

console.log('[install-cloudfunctions] 完成')
