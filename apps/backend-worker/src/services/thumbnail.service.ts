import sharp from 'sharp';
import type { ImageFormat } from '../common';
import type { IThumbnailService } from './thumbnail.type';

export class SharpThumbnailService implements IThumbnailService {
  async resizeImage(
    buffer: Buffer,
    targetWidth: number,
    targetHeight: number,
    outputFormat: ImageFormat = 'jpeg',
  ): Promise<Buffer> {
    // Get metadata to determine the size of the image
    const metadata = await sharp(buffer).metadata();

    const backgroundColor = { r: 255, g: 255, b: 255 }; // White background color

    // Calculate the crop dimensions
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    let cropWidth = targetWidth;
    let cropHeight = targetHeight;
    let left = 0;
    let top = 0;

    if (width > height) {
      // Landscape or square image
      left = Math.floor((width - height) / 2);
      cropWidth = height;
    } else if (height > width) {
      // Portrait image
      top = Math.floor((height - width) / 2);
      cropHeight = width;
    }

    // Create the thumbnail and return it as a buffer
    const thumbnailBuffer = await sharp(buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight }) // Crop the image
      .resize(targetWidth, targetHeight, { fit: 'cover' }) // Resize to target dimensions
      .extend({
        top: Math.max(0, Math.floor((targetHeight - cropHeight) / 2)),
        bottom: Math.max(0, Math.ceil((targetHeight - cropHeight) / 2)),
        left: Math.max(0, Math.floor((targetWidth - cropWidth) / 2)),
        right: Math.max(0, Math.ceil((targetWidth - cropWidth) / 2)),
        background: backgroundColor,
      }) // Add background color if needed
      .toFormat(outputFormat) // Set the output format
      .toBuffer(); // Get the thumbnail as a buffer
    return thumbnailBuffer;
  }
}
