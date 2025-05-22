export interface IStorageService {
  uploadFile(key: string, file: Buffer): Promise<void>;
  downloadFile(key: string): Promise<Buffer>;
}
