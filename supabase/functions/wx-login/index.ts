/**
 * Supabase Edge Function: wx-login
 *
 * 用微信临时 code 换取 openid（服务端调用，AppSecret 不暴露给前端）。
 *
 * 环境变量（在 Supabase Dashboard → Edge Functions → Secrets 中配置）：
 *   WX_APPID   - 微信小程序 AppID
 *   WX_SECRET  - 微信小程序 AppSecret
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
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
    const { code } = await req.json()

    if (!code) {
      return new Response(JSON.stringify({ error: '缺少 code 参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appid = Deno.env.get('WX_APPID')
    const secret = Deno.env.get('WX_SECRET')

    if (!appid || !secret) {
      return new Response(
        JSON.stringify({ error: 'WX_APPID 或 WX_SECRET 未配置，请在 Supabase Secrets 中设置' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 调用微信 jscode2session 接口
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    const wxRes = await fetch(wxUrl)
    const wxData = await wxRes.json()

    if (wxData.errcode) {
      return new Response(
        JSON.stringify({ error: `微信接口错误: ${wxData.errmsg} (${wxData.errcode})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!wxData.openid) {
      return new Response(
        JSON.stringify({ error: '微信接口未返回 openid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ openid: wxData.openid, session_key: wxData.session_key }),
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
