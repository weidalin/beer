// 微信订阅消息（M4 阶段实现）
// M2-M3 阶段：预约/工单以 Toast + 站内列表刷新为准，不强制订阅消息

// 模板 ID（M4 阶段在微信小程序后台申请后填入）
const TEMPLATE_IDS = {
  // 新预约 → 供应商（M4 申请）
  NEW_BOOKING: '',
  // 工单状态变更 → 客户（M4 申请）
  ORDER_UPDATE: ''
}

export function useSubscribe() {
  /**
   * 请求订阅消息授权（M4 阶段在提交预约/工单时调用）
   * @param type 订阅类型
   */
  async function requestSubscribe(type: 'booking' | 'order'): Promise<boolean> {
    const tmplId = type === 'booking' ? TEMPLATE_IDS.NEW_BOOKING : TEMPLATE_IDS.ORDER_UPDATE

    if (!tmplId) {
      // M2-M3 阶段：模板 ID 未配置，跳过订阅
      console.log('[Subscribe] 模板 ID 未配置，跳过订阅（M4 阶段再实现）')
      return false
    }

    return new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: [tmplId],
        success: (res) => {
          resolve(res[tmplId] === 'accept')
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  return { requestSubscribe }
}
