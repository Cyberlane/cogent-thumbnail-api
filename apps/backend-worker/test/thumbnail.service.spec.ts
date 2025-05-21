import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { SharpThumbnailService } from '../src/services/thumbnail.service';

// apps/backend-worker/src/services/thumbnail.service.test.ts

const service = new SharpThumbnailService();

async function createTestImage(
  width: number,
  height: number,
  color = '#ff0000',
) {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .jpeg()
    .toBuffer();
}

describe('Sharp Thumbnail Service', () => {
  it('should resize a square image to a smaller square', async () => {
    const input = await createTestImage(100, 100);
    const output = await service.resizeImage(input, 50, 50, 'jpeg');
    const meta = await sharp(output).metadata();
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
    expect(meta.format).toBe('jpeg');
  });

  it('should resize a landscape image to a square', async () => {
    const input = await createTestImage(200, 100);
    const output = await service.resizeImage(input, 50, 50, 'jpeg');
    const meta = await sharp(output).metadata();
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
    expect(meta.format).toBe('jpeg');
  });

  it('should resize a portrait image to a square', async () => {
    const input = await createTestImage(100, 200);
    const output = await service.resizeImage(input, 50, 50, 'jpeg');
    const meta = await sharp(output).metadata();
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
    expect(meta.format).toBe('jpeg');
  });

  it('should convert output format to png', async () => {
    const input = await createTestImage(100, 100);
    const output = await service.resizeImage(input, 50, 50, 'png');
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
  });

  it('should throw on invalid buffer', async () => {
    const invalidBuffer = Buffer.from('not-an-image');
    await expect(
      service.resizeImage(invalidBuffer, 50, 50, 'jpeg'),
    ).rejects.toThrow();
  });
});
