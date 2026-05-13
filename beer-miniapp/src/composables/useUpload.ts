/**
 * useUpload - 图片上传 composable（v2）
 *
 * 流程：
 *   1. 前端调用 Supabase Edge Function（upload-token）获取七牛云 UpToken + 文件 key
 *   2. 前端用 uni.uploadFile 直传七牛云（AK/SK 不接触前端）
 *   3. 上传成功后返回 CDN 外链
 *
 * 环境变量：
 *   VITE_QINIU_CDN_DOMAIN - 七牛云存储空间绑定的 CDN 域名
 *     （Edge Function 也会返回 domain，此处作为降级备用）
 */

import { supabase } from '../lib/supabase'

/** 七牛云华南区上传端点（根据存储空间区域选择） */
const QINIU_UPLOAD_URL = 'https://up-z2.qiniup.com'

export function useUpload() {
  /**
   * 上传单张图片到七牛云
   * @param filePath  uni.chooseMedia 返回的临时文件路径
   * @param _bucket   保留参数（兼容旧调用方，v2 统一走七牛云，不区分 bucket）
   * @returns         七牛 CDN 外链 URL
   */
  async function uploadImage(
    filePath: string,
    _bucket: 'products' | 'repairs' = 'products',
  ): Promise<string> {
    const ext = filePath.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'

    // ① 向 Edge Function 请求上传凭证
    const { data, error } = await supabase.functions.invoke('upload-token', {
      body: { ext },
    })

    if (error || !data?.token) {
      throw new Error('获取上传凭证失败，请检查网络后重试')
    }

    const { token, key, domain } = data as { token: string; key: string; domain: string }

    // ② 直传七牛云
    await new Promise<void>((resolve, reject) => {
      uni.uploadFile({
        url: QINIU_UPLOAD_URL,
        filePath,
        name: 'file',
        formData: { token, key },
        success(res) {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(new Error(`七牛云上传失败，状态码：${res.statusCode}`))
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || '七牛云上传失败'))
        },
      })
    })

    // ③ 返回 CDN 外链
    const cdnDomain = (domain || import.meta.env.VITE_QINIU_CDN_DOMAIN || '').replace(/\/$/, '')
    return `${cdnDomain}/${key}`
  }

  /**
   * 批量上传图片
   */
  async function uploadImages(
    filePaths: string[],
    bucket: 'products' | 'repairs' = 'products',
  ): Promise<string[]> {
    return Promise.all(filePaths.map((p) => uploadImage(p, bucket)))
  }

  /**
   * 删除图片（七牛云删除需要服务端接口，前端暂不实现；仅做接口占位保持兼容）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function deleteImage(_url: string, _bucket?: string): Promise<void> {
    // TODO: 后续可增加 Edge Function 实现七牛云文件删除
  }

  return { uploadImage, uploadImages, deleteImage }
}
