import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import sharp from 'sharp';
import { LIMITS } from '../config/limits.js';
import { BadFileError } from '../utils/errors.js';

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LIMITS.MAX_IMAGE_SIZE_BYTES,
    files: LIMITS.MAX_UPLOAD_FILES,
  },
});

export interface SanitizedImage {
  buffer: Buffer;
  mimeType: 'image/webp';
  sizeBytes: number;
}

/**
 * Validates magic bytes, strips EXIF (GPS/metadata), re-encodes to optimized WebP.
 */
export async function sanitizeAndProcessImage(fileBuffer: Buffer): Promise<SanitizedImage> {
  const typeResult = await fileTypeFromBuffer(fileBuffer);
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!typeResult || !allowedMimes.includes(typeResult.mime)) {
    throw new BadFileError(
      `Invalid image file type (${typeResult?.mime ?? 'unknown'}). Only JPEG, PNG, and WebP are allowed.`,
    );
  }

  // Strip EXIF metadata and resize to maximum 1600px longest edge, converting to WebP quality 82
  const processedBuffer = await sharp(fileBuffer)
    .rotate() // auto-orient based on EXIF before stripping
    .resize(1600, 1600, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    buffer: processedBuffer,
    mimeType: 'image/webp',
    sizeBytes: processedBuffer.length,
  };
}
