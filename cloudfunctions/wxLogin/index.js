/**
 * 云函数：wxLogin
 * 接收小程序端 wx.login() 返回的 code，
 * 在服务端安全地用 appSecret 换取 openid，返回给前端。
 *
 * 部署后在云开发控制台 → 云函数 → wxLogin 可查看日志。
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  // wx-server-sdk 2.x 在云函数内可直接获取调用者 openid
  // 不需要再用 code 换，这是最安全的方式
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return { error: 'OPENID not found' }
  }

  return { openid: OPENID }
}
