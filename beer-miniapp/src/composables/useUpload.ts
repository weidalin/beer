import { uploadFile } from '../lib/cloud'

export function useUpload() {
  /**
   * 上传单张图片至微信云存储
   * @param filePath  本地临时文件路径（wx.chooseMedia 返回的 tempFilePath）
   * @param folder    云存储目录，默认 'products'
   * @returns         wx.cloud fileID（存入数据库）
   */
  async function uploadImage(
    filePath: string,
    folder: 'products' | 'covers' | 'avatars' = 'products'
  ): Promise<string> {
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg'
    const cloudPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    return uploadFile(cloudPath, filePath)
  }

  /**
   * 批量上传图片
   */
  async function uploadImages(
    filePaths: string[],
    folder: 'products' | 'covers' | 'avatars' = 'products'
  ): Promise<string[]> {
    return Promise.all(filePaths.map(p => uploadImage(p, folder)))
  }

  return { uploadImage, uploadImages }
}
