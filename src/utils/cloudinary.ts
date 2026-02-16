import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (file: any, folder: string) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    imageUrl: result?.secure_url,
                    imagePublicId: result?.public_id,
                });
            }
        );
        (uploadStream as any).end(file.buffer);
    });
};

export const deleteFromCloudinary = async (publicId: string) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
    }
};

export default cloudinary;
