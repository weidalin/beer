import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useUpload() {
  async function uploadImage(
    filePath: string,
    bucket: 'products' | 'repairs' = 'products'
  ): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('未配置 Supabase：请在 .env 设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY 后重新编译')
    }
    // 读取文件内容
    const fileContent = uni.getFileSystemManager().readFileSync(filePath)

    // 获取文件扩展名
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'

    // 生成唯一文件名
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // 上传到 Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileContent as ArrayBuffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) throw error

    // 返回公开 CDN URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return urlData.publicUrl
  }

  async function uploadImages(
    filePaths: string[],
    bucket: 'products' | 'repairs' = 'products'
  ): Promise<string[]> {
    const urls = await Promise.all(filePaths.map(p => uploadImage(p, bucket)))
    return urls
  }

  async function deleteImage(url: string, bucket: 'products' | 'repairs' = 'products'): Promise<void> {
    if (!isSupabaseConfigured()) return
    const path = url.split(`${bucket}/`).pop()
    if (!path) return
    await supabase.storage.from(bucket).remove([path])
  }

  return { uploadImage, uploadImages, deleteImage }
}
