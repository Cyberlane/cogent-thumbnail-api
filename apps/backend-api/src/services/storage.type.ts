export interface IStorageService {
  uploadFile(key: string, file: Buffer): Promise<{ url: string }>;
  getFile(key: string): Promise<{ url: string }>;
  downloadFile(key: string): Promise<Buffer>;
}