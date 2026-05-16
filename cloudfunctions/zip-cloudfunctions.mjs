/**
 * 将 wxLogin、init_db 打成控制台「本地上传」用的 zip（根目录为 index.js + package.json）。
 * 在仓库根目录执行：node cloudfunctions/zip-cloudfunctions.mjs
 */
import { execSync } from 'child_process'
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cfRoot = __dirname
const outDir = join(cfRoot, 'dist-zips')
const names = ['wxLogin', 'init_db', 'updateProfile', 'productAdmin']

fs.mkdirSync(outDir, { recursive: true })

function zipOne(name) {
  const srcDir = join(cfRoot, name)
  const outZip = join(outDir, `${name}.zip`)
  if (!fs.existsSync(join(srcDir, 'index.js')) || !fs.existsSync(join(srcDir, 'package.json'))) {
    console.warn(`[zip] 跳过 ${name}：缺少 index.js 或 package.json`)
    return
  }
  if (!fs.existsSync(join(srcDir, 'node_modules', 'wx-server-sdk'))) {
    console.log(`[zip] ${name} 安装依赖…`)
    execSync('npm install --omit=dev', { cwd: srcDir, stdio: 'inherit' })
  }
  if (fs.existsSync(outZip)) fs.rmSync(outZip, { force: true })

  if (os.platform() === 'win32') {
    const dest = outZip.replace(/'/g, "''")
    const cmd = `Compress-Archive -LiteralPath index.js,package.json,node_modules -DestinationPath '${dest}' -Force`
    execSync(`powershell.exe -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, {
      cwd: srcDir,
      stdio: 'inherit'
    })
  } else {
    execSync(`zip -r "${outZip}" index.js package.json node_modules`, { cwd: srcDir, stdio: 'inherit' })
  }
  console.log(`[zip] ${outZip}`)
}

for (const name of names) {
  zipOne(name)
}
