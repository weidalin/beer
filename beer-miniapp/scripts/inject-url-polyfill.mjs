/**
 * Post-build script: prepend a self-contained URL polyfill to
 * dist/build/mp-weixin/common/vendor.js so that it executes before
 * any supabase-js code, regardless of how WeChat's JS engine resolves
 * the `URL` global inside the vendor chunk.
 *
 * Background: supabase-js calls `new URL(supabaseUrl)` inside its
 * SupabaseClient constructor. WeChat miniapp's native URL implementation
 * (base library 3.x) can reject otherwise-valid URLs. Setting
 * `globalThis.URL` from a separate module file does not reliably
 * override the identifier resolved by code inside vendor.js in WeChat's
 * JS engine. Prepending the polyfill directly into vendor.js guarantees
 * it runs first and in the same scope.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const vendorPath = join(__dirname, '../dist/build/mp-weixin/common/vendor.js')

if (!existsSync(vendorPath)) {
  console.error('[inject-url-polyfill] vendor.js not found:', vendorPath)
  process.exit(1)
}

// Self-contained URL polyfill (no imports, works in WeChat JS runtime).
// Handles both:
//   new URL('https://host/path')            — absolute URL
//   new URL('relative/path', baseUrlOrStr)  — relative URL with base
const POLYFILL = `(function(){
  function _URLImpl(url,base){
    var full;
    if(base){
      var baseStr=typeof base==="string"?base:(base.href||String(base));
      if(/^[a-z][a-z0-9+\\-.]*:\\/\\//i.test(url)){
        full=url;
      }else{
        var bm=baseStr.match(/^([a-z][a-z0-9+\\-.]*:\\/\\/[^/]+)/i);
        if(!bm)throw new TypeError("Invalid base URL: "+baseStr);
        full=url.startsWith("/")?bm[1]+url:bm[1]+"/"+url;
      }
    }else{
      full=url;
    }
    var m=full.match(/^([a-z][a-z0-9+\\-.]*:)\\/\\/([^/?#:]+)(?::(\\d+))?(\\/?[^?#]*)?(\\?[^#]*)?(#.*)?$/i);
    if(!m)throw new TypeError("Failed to construct URL: Invalid URL: "+full);
    this.protocol=m[1];
    this.hostname=m[2];
    this.port=m[3]||"";
    this.pathname=m[4]||"/";
    this.search=m[5]||"";
    this.hash=m[6]||"";
    this.host=this.port?this.hostname+":"+this.port:this.hostname;
    this.origin=this.protocol+"//"+this.host;
    this.href=this.origin+this.pathname+this.search+this.hash;
  }
  _URLImpl.prototype.toString=function(){return this.href;};
  _URLImpl.prototype.toJSON=function(){return this.href;};
  globalThis.URL=_URLImpl;
})();
`

const original = readFileSync(vendorPath, 'utf8')

if (original.startsWith('(function(){function _URLImpl')) {
  console.log('[inject-url-polyfill] Polyfill already injected, skipping.')
  process.exit(0)
}

writeFileSync(vendorPath, POLYFILL + original, 'utf8')
console.log('[inject-url-polyfill] URL polyfill prepended to vendor.js ✓')
