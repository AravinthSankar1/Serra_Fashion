import sharp from 'sharp';
import axios from 'axios';

export interface CompressOptions {
    /** Max width in pixels (default: 1200) */
    maxWidth?: number;
    /** Max height in pixels (default: 1200) */
    maxHeight?: number;
    /** WebP quality 1-100 (default: 82) */
    quality?: number;
    /** Output format (default: 'webp') */
    format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULTS: Required<CompressOptions> = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 82,
    format: 'webp',
};

/**
 * Compresses an image Buffer using sharp.
 * Converts to WebP (or specified format) and resizes to fit within maxWidth × maxHeight.
 * Returns a smaller Buffer ready for Cloudinary upload.
 */
export const compressImage = async (
    inputBuffer: Buffer,
    options: CompressOptions = {}
): Promise<Buffer> => {
    const opts = { ...DEFAULTS, ...options };

    let pipeline = sharp(inputBuffer)
        .rotate() // Auto-rotate based on EXIF
        .resize({
            width: opts.maxWidth,
            height: opts.maxHeight,
            fit: 'inside',      // Maintain aspect ratio; never upscale
            withoutEnlargement: true,
        });

    switch (opts.format) {
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality: opts.quality, progressive: true });
            break;
        case 'png':
            pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 8 });
            break;
        case 'webp':
        default:
            pipeline = pipeline.webp({ quality: opts.quality, effort: 4 });
            break;
    }

    const compressed = await pipeline.toBuffer();
    const ratio = ((1 - compressed.length / inputBuffer.length) * 100).toFixed(1);
    console.log(`[IMAGE] Compressed: ${(inputBuffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (${ratio}% saved)`);

    return compressed;
};

/**
 * Downloads an image from a URL and compresses it.
 * Used when importing Qikink product images.
 */
export const downloadAndCompress = async (
    imageUrl: string,
    options: CompressOptions = {}
): Promise<Buffer> => {
    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'Accept': 'image/*' },
    });
    const rawBuffer = Buffer.from(response.data);
    return compressImage(rawBuffer, options);
};

/**
 * Returns the Cloudinary delivery URL with automatic quality and format transforms.
 * Call this on any Cloudinary URL before serving to the frontend.
 * e.g.:  https://res.cloudinary.com/.../upload/q_auto,f_auto/products/abc.jpg
 *
 * This is the "decompress on serve" part — Cloudinary CDN handles conversion on the fly.
 */
export const getOptimizedCloudinaryUrl = (rawUrl: string): string => {
    if (!rawUrl || !rawUrl.includes('res.cloudinary.com')) return rawUrl;
    // Insert transformation parameters after /upload/
    return rawUrl.replace('/upload/', '/upload/q_auto,f_auto,dpr_auto/');
};
