/**
 * Post-build script: prepend URL + fetch polyfills to
 * dist/build/mp-weixin/common/vendor.js so they execute before any
 * supabase-js code, in the same scope as vendor.js.
 *
 * Why prepend into vendor.js instead of a side-effect import?
 *   WeChat's JS engine may resolve built-in identifiers (URL, fetch) from a
 *   scope that predates any user-module side-effect imports, so setting
 *   globalThis.X in a separate required file doesn't always reach the
 *   identifier used inside vendor.js. Prepending guarantees it.
 *
 * Polyfills injected:
 *   1. URL  — WeChat's native URL rejects valid https URLs in some lib versions
 *   2. fetch — supabase-js uses globalThis.fetch; wx only has wx.request
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const vendorPath = join(__dirname, '../dist/build/mp-weixin/common/vendor.js')

if (!existsSync(vendorPath)) {
  console.error('[inject-polyfills] vendor.js not found:', vendorPath)
  process.exit(1)
}

// ─── URL + URLSearchParams polyfill ─────────────────────────────────────────
// postgrest-js calls url.searchParams.set() / .append() when building queries,
// and then accesses url.href (or url.toString()) to get the final request URL.
// Without searchParams the first .select() call throws, breaking the whole chain.
const URL_POLYFILL = `(function(){
  /* ---- URLSearchParams ---- */
  function _SP(search){
    this._p=[];
    if(!search)return;
    var qs=search.charAt(0)==="?"?search.slice(1):search;
    if(!qs)return;
    qs.split("&").forEach(function(part){
      var idx=part.indexOf("=");
      if(idx===-1){this._p.push([_d(part),""]);}
      else{this._p.push([_d(part.slice(0,idx)),_d(part.slice(idx+1))]);}
    },this);
  }
  function _d(s){try{return decodeURIComponent(s.replace(/\\+/g," "));}catch(e){return s;}}
  function _e(s){try{return encodeURIComponent(s);}catch(e){return s;}}
  _SP.prototype.set=function(n,v){
    this._p=this._p.filter(function(p){return p[0]!==n;});
    this._p.push([n,v]);if(this._u)this._u._sync();
  };
  _SP.prototype.append=function(n,v){this._p.push([n,v]);if(this._u)this._u._sync();};
  _SP.prototype.delete=function(n){
    this._p=this._p.filter(function(p){return p[0]!==n;});if(this._u)this._u._sync();
  };
  _SP.prototype.get=function(n){
    var p=this._p.find(function(p){return p[0]===n;});return p?p[1]:null;
  };
  _SP.prototype.getAll=function(n){return this._p.filter(function(p){return p[0]===n;}).map(function(p){return p[1];});};
  _SP.prototype.has=function(n){return this._p.some(function(p){return p[0]===n;});};
  _SP.prototype.forEach=function(cb){this._p.forEach(function(p){cb(p[1],p[0]);});};
  _SP.prototype.entries=function(){return this._p.slice();};
  _SP.prototype.toString=function(){
    return this._p.map(function(p){return _e(p[0])+"="+_e(p[1]);}).join("&");
  };

  /* ---- URL ---- */
  function _URLImpl(url,base){
    var baseStr=!base?null:typeof base==="string"?base:(base.href||String(base));
    var full=baseStr?_resolve(baseStr,url):url;
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
    this.searchParams=new _SP(this.search);
    this.searchParams._u=this;
    this._sync();
  }
  function _resolve(base,rel){
    if(/^[a-z][a-z0-9+\\-.]*:\\/\\//i.test(rel))return rel;
    var bm=base.match(/^([a-z][a-z0-9+\\-.]*:\\/\\/[^/]+)/i);
    if(!bm)throw new TypeError("Invalid base URL: "+base);
    return rel.startsWith("/")?bm[1]+rel:bm[1]+"/"+rel;
  }
  _URLImpl.prototype._sync=function(){
    var qs=this.searchParams.toString();
    this.search=qs?"?"+qs:"";
    this.href=this.origin+this.pathname+this.search+this.hash;
  };
  _URLImpl.prototype.toString=function(){return this.href;};
  _URLImpl.prototype.toJSON=function(){return this.href;};

  globalThis.URL=_URLImpl;
  globalThis.URLSearchParams=_SP;
})();
`

// ─── fetch polyfill ──────────────────────────────────────────────────────────
// supabase-js uses globalThis.fetch for all REST/Auth/Storage requests.
// WeChat miniapp only has wx.request; this wraps it into a fetch-compatible API.
const FETCH_POLYFILL = `(function(){
  if(globalThis.fetch)return;
  function WxHeaders(init){
    this._m={};
    if(!init)return;
    var src=init instanceof WxHeaders?init._m:init;
    var keys=Object.keys(src);
    for(var i=0;i<keys.length;i++){this._m[keys[i].toLowerCase()]=src[keys[i]];}
  }
  WxHeaders.prototype.get=function(n){return this._m[n.toLowerCase()]||null;};
  WxHeaders.prototype.set=function(n,v){this._m[n.toLowerCase()]=v;};
  WxHeaders.prototype.has=function(n){return n.toLowerCase() in this._m;};
  WxHeaders.prototype.append=function(n,v){this._m[n.toLowerCase()]=v;};
  WxHeaders.prototype.forEach=function(cb){
    var keys=Object.keys(this._m);
    for(var i=0;i<keys.length;i++)cb(this._m[keys[i]],keys[i]);
  };
  WxHeaders.prototype._raw=function(){
    var o={};var keys=Object.keys(this._m);
    for(var i=0;i<keys.length;i++)o[keys[i]]=this._m[keys[i]];
    return o;
  };

  function WxResponse(body,status,headers){
    this.status=status;
    this.ok=status>=200&&status<300;
    this.statusText=String(status);
    this.headers=new WxHeaders(headers);
    this._body=body;
  }
  WxResponse.prototype.json=function(){
    var self=this;
    return Promise.resolve().then(function(){return JSON.parse(self._body);});
  };
  WxResponse.prototype.text=function(){
    var self=this;
    return Promise.resolve(self._body);
  };
  WxResponse.prototype.clone=function(){
    return new WxResponse(this._body,this.status,this.headers._raw());
  };

  globalThis.fetch=function wxFetch(input,init){
    init=init||{};
    var url=typeof input==="string"?input:(input.href||String(input));
    var method=(init.method||"GET").toUpperCase();
    var headerMap={};
    if(init.headers){
      if(typeof init.headers._raw==="function"){
        headerMap=init.headers._raw();
      }else if(typeof init.headers.forEach==="function"){
        init.headers.forEach(function(v,k){headerMap[k]=v;});
      }else{
        var hkeys=Object.keys(init.headers);
        for(var i=0;i<hkeys.length;i++)headerMap[hkeys[i]]=init.headers[hkeys[i]];
      }
    }
    return new Promise(function(resolve,reject){
      wx.request({
        url:url,
        method:method,
        header:headerMap,
        data:init.body||undefined,
        responseType:"text",
        success:function(res){
          var bodyStr=typeof res.data==="string"?res.data:JSON.stringify(res.data);
          var rh={};
          if(res.header){
            var rkeys=Object.keys(res.header);
            for(var i=0;i<rkeys.length;i++)rh[rkeys[i].toLowerCase()]=String(res.header[rkeys[i]]);
          }
          resolve(new WxResponse(bodyStr,res.statusCode||200,rh));
        },
        fail:function(err){
          reject(new TypeError("wx fetch failed: "+(err&&err.errMsg||JSON.stringify(err))));
        }
      });
    });
  };
  globalThis.Headers=WxHeaders;
  globalThis.Response=WxResponse;
})();
`

const original = readFileSync(vendorPath, 'utf8')

if (original.startsWith('(function(){if(globalThis.fetch)')) {
  console.log('[inject-polyfills] Polyfills already injected, skipping.')
  process.exit(0)
}

writeFileSync(vendorPath, FETCH_POLYFILL + URL_POLYFILL + original, 'utf8')
console.log('[inject-polyfills] fetch + URL polyfills prepended to vendor.js ✓')
