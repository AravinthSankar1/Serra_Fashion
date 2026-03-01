import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { compressImage, CompressOptions } from './imageProcessor';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

/**
 * Uploads a file to Cloudinary after compressing it with sharp.
 * Compression converts to WebP and downsizes to max 1200×1200.
 * This saves significant Cloudinary storage quota.
 *
 * @param file     - Multer file object (has `.buffer`) OR a raw Buffer
 * @param folder   - Cloudinary folder name
 * @param options  - Optional compression overrides
 */
export const uploadToCloudinary = async (
    file: Express.Multer.File | { buffer: Buffer; mimetype?: string },
    folder: string,
    options: CompressOptions = {}
): Promise<{ imageUrl: string; imagePublicId: string }> => {
    // ── Step 1: Compress the image buffer ────────────────────────────────
    const rawBuffer = (file as any).buffer as Buffer;
    let uploadBuffer: Buffer;
    try {
        uploadBuffer = await compressImage(rawBuffer, options);
    } catch (compressErr) {
        // Fallback: if compression fails (e.g. corrupted file) use original
        console.warn('[IMAGE] Compression failed, using original buffer:', compressErr);
        uploadBuffer = rawBuffer;
    }

    // ── Step 2: Upload compressed buffer to Cloudinary ───────────────────
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                // Let Cloudinary also apply its own automatic format/quality on delivery
                format: 'webp',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    imageUrl: result?.secure_url ?? '',
                    imagePublicId: result?.public_id ?? '',
                });
            }
        );
        uploadStream.end(uploadBuffer);
    });
};

/**
 * Upload a raw Buffer directly (no Multer file object wrapper needed).
 * Used when importing images from URLs (e.g. Qikink product images).
 */
export const uploadBufferToCloudinary = async (
    buffer: Buffer,
    folder: string,
    options: CompressOptions = {}
): Promise<{ imageUrl: string; imagePublicId: string }> => {
    return uploadToCloudinary({ buffer } as any, folder, options);
};

/**
 * Deletes an asset from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
    }
};

export default cloudinary;
