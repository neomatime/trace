export interface StorageObject {
  key: string
  contentType: string
  size: number
}

export interface StorageProvider {
  upload(key: string, data: Blob): Promise<StorageObject>
  getDownloadUrl(key: string): Promise<string>
}
