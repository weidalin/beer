/**
 * 微信开发者工具 / 部分基础库下 createClient 可能对任意 URL 抛出 malformed，
 * 未配置 Supabase 时不应调用 @supabase/supabase-js 的 createClient，改用本 stub 避免整包崩溃。
 */
const MSG =
  'Supabase 未配置：请在 beer-miniapp/.env 设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 后重新执行 npm run build:mp-weixin'

function cfgError() {
  const e = new Error(MSG)
  return e
}

/** Postgrest 风格链式调用，最终以 Promise<{data,error}> 结束 */
function queryChain(): any {
  const done = Promise.resolve({ data: null, error: cfgError() })
  const chain: any = {}
  const forward = () => chain
  const names = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'csv',
    'match',
    'not',
    'or',
    'filter'
  ]
  for (const n of names) {
    chain[n] = forward
  }
  chain.then = (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    done.then(onFulfilled, onRejected)
  chain.catch = (onRejected: (e: unknown) => unknown) => done.catch(onRejected)
  return chain
}

function storageFrom(): any {
  return {
    upload: async () => ({ data: null, error: cfgError() }),
    /** 与 storage-js 一致：同步返回 publicUrl */
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `https://placeholder.invalid/${path}` }
    }),
    remove: async () => ({ data: null, error: cfgError() })
  }
}

/**
 * 最小可用的「假」客户端，类型上与 SupabaseClient 兼容用法即可（仅未配置时使用）。
 */
export function createDisconnectedSupabaseClient(): import('@supabase/supabase-js').SupabaseClient {
  const auth = {
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: cfgError() }),
    signUp: async () => ({ data: { user: null, session: null }, error: cfgError() }),
    signOut: async () => ({ error: cfgError() }),
    getSession: async () => ({ data: { session: null }, error: cfgError() }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => undefined } }
    })
  }

  return {
    from: () => queryChain(),
    auth: auth as any,
    storage: {
      from: () => storageFrom()
    } as any,
    functions: {
      invoke: async () => ({ data: null, error: cfgError() })
    } as any,
    channel: () =>
      ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) })
      }) as any,
    removeAllChannels: async () => undefined,
    removeChannel: async () => undefined,
    getChannels: () => []
  } as unknown as import('@supabase/supabase-js').SupabaseClient
}
