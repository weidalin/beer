/**
 * Supabase Edge Function: upload-token
 *
 * 为前端生成七牛云 UpToken，AK/SK 仅在服务端保存，前端不可见。
 *
 * 环境变量（在 Supabase Dashboard → Edge Functions → Secrets 中配置）：
 *   QINIU_ACCESS_KEY  - 七牛云 AccessKey
 *   QINIU_SECRET_KEY  - 七牛云 SecretKey
 *   QINIU_BUCKET      - 存储空间名称
 *   QINIU_CDN_DOMAIN  - CDN 域名，例如 https://cdn.example.com
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Base64URL 编码（不含填充符） */
function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * 生成七牛云 UpToken
 * 规范：https://developer.qiniu.com/kodo/1208/upload-token
 */
async function generateUpToken(
  accessKey: string,
  secretKey: string,
  bucket: string,
  key: string,
): Promise<string> {
  const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 小时有效期
  const policy = JSON.stringify({ scope: `${bucket}:${key}`, deadline })
  const encodedPolicy = base64url(new TextEncoder().encode(policy))

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(encodedPolicy))
  const encodedSig = base64url(sig)

  return `${accessKey}:${encodedSig}:${encodedPolicy}`
}

serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const ext = (body.ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')

    const accessKey = Deno.env.get('QINIU_ACCESS_KEY')
    const secretKey = Deno.env.get('QINIU_SECRET_KEY')
    const bucket = Deno.env.get('QINIU_BUCKET')
    const domain = Deno.env.get('QINIU_CDN_DOMAIN')

    if (!accessKey || !secretKey || !bucket || !domain) {
      return new Response(
        JSON.stringify({ error: '服务端七牛云环境变量未配置，请在 Supabase Secrets 中设置 QINIU_ACCESS_KEY / QINIU_SECRET_KEY / QINIU_BUCKET / QINIU_CDN_DOMAIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 生成唯一文件 key
    const timestamp = Date.now()
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    const key = `uploads/${timestamp}-${random}.${ext}`

    const token = await generateUpToken(accessKey, secretKey, bucket, key)

    return new Response(
      JSON.stringify({ token, key, domain }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
