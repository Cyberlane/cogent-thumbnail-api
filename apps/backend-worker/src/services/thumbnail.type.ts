import type { ImageFormat } from "../common";

export interface IThumbnailService {
  resizeImage(buffer: Buffer, targetWidth: number, targetHeight: number, outputFormat?: ImageFormat): Promise<Buffer>;
}