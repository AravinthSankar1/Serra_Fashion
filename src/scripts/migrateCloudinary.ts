import mongoose from 'mongoose';
import { v2 as cloudinaryOld } from 'cloudinary';
import { v2 as cloudinaryNew } from 'cloudinary';

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const OLD_CLOUD_NAME = 'dyaswx9yu';
const OLD_API_KEY = 'YOUR_OLD_API_KEY';
const OLD_API_SECRET = 'YOUR_OLD_API_SECRET';

const NEW_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dlx95lmd4';
const NEW_API_KEY = process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY';
const NEW_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET';

cloudinaryOld.config({
  cloud_name: OLD_CLOUD_NAME,
  api_key: OLD_API_KEY,
  api_secret: OLD_API_SECRET,
});

cloudinaryNew.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: NEW_API_KEY,
  api_secret: NEW_API_SECRET,
});

// Import models
import { User } from '../modules/user/user.model';
import { Product } from '../modules/product/product.model';
import { Category } from '../modules/category/category.model';
import { Brand } from '../modules/brand/brand.model';
import { Banner } from '../modules/banner/banner.model';
import { SizeGuide } from '../modules/sizeGuide/sizeGuide.model';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function migrateImage(
  url: string,
  publicId: string,
  modelName: string,
  docId: string
): Promise<{ newUrl: string; newPublicId: string } | null> {
  if (!url || !publicId || publicId.trim() === '') return null;
  // If it's already using the new cloud name, skip it
  if (url.includes(NEW_CLOUD_NAME)) {
      console.log(`[SKIP] Already migrated: ${publicId}`);
      return null;
  }

  try {
    console.log(`[MIGRATE] Migrating ${publicId} from ${modelName} (${docId})...`);
    
    // Upload directly from old URL to new Cloudinary
    // We pass the exact public_id so it preserves folder structure.
    const result = await cloudinaryNew.uploader.upload(url, {
      public_id: publicId,
      overwrite: true,
      invalidate: true
    });

    console.log(`[SUCCESS] Migrated ${publicId}. New URL: ${result.secure_url}`);
    
    return {
      newUrl: result.secure_url,
      newPublicId: result.public_id
    };
  } catch (error) {
    console.error(`[ERROR] Failed to migrate ${publicId}:`, error);
    return null;
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    let migratedCount = 0;
    let errorCount = 0;

    // 1. Migrate Products
    const products = await Product.find({});
    for (const product of products) {
        let changed = false;
        
        // Product images
        for (let i = 0; i < (product.images || []).length; i++) {
            const img = product.images[i];
            const newImg = await migrateImage(img.imageUrl, img.imagePublicId, 'Product', product._id.toString());
            if (newImg) {
                product.images[i].imageUrl = newImg.newUrl;
                product.images[i].imagePublicId = newImg.newPublicId;
                changed = true;
                migratedCount++;
            }
        }

        // Product variantImage
        for (let i = 0; i < (product.variants || []).length; i++) {
            const variant = product.variants[i];
            if (variant.variantImage && variant.variantImage.imageUrl && variant.variantImage.imagePublicId) {
                const newImg = await migrateImage(variant.variantImage.imageUrl, variant.variantImage.imagePublicId, 'ProductVariant', product._id.toString());
                if (newImg) {
                    product.variants[i].variantImage.imageUrl = newImg.newUrl;
                    product.variants[i].variantImage.imagePublicId = newImg.newPublicId;
                    changed = true;
                    migratedCount++;
                }
            }
        }

        if (changed) {
            await Product.updateOne({ _id: product._id }, { $set: { images: product.images, variants: product.variants } });
        }
    }

    // 2. Migrate Users
    const users = await User.find({});
    for (const user of users) {
        if (user.profilePicture && user.profilePicture.imageUrl && user.profilePicture.imagePublicId) {
            const newImg = await migrateImage(user.profilePicture.imageUrl, user.profilePicture.imagePublicId, 'User', user._id.toString());
            if (newImg) {
                await User.updateOne(
                    { _id: user._id }, 
                    { $set: { 'profilePicture.imageUrl': newImg.newUrl, 'profilePicture.imagePublicId': newImg.newPublicId } }
                );
                migratedCount++;
            }
        }
    }

    // 3. Migrate Categories
    const categories = await Category.find({});
    for (const cat of categories) {
        if (cat.image && cat.image.imageUrl && cat.image.imagePublicId) {
            const newImg = await migrateImage(cat.image.imageUrl, cat.image.imagePublicId, 'Category', cat._id.toString());
            if (newImg) {
                await Category.updateOne(
                    { _id: cat._id },
                    { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
                );
                migratedCount++;
            }
        }
    }

    // 4. Migrate Brands
    const brands = await Brand.find({});
    for (const brand of brands) {
        if (brand.logo && brand.logo.imageUrl && brand.logo.imagePublicId) {
            const newImg = await migrateImage(brand.logo.imageUrl, brand.logo.imagePublicId, 'Brand', brand._id.toString());
            if (newImg) {
                await Brand.updateOne(
                    { _id: brand._id },
                    { $set: { 'logo.imageUrl': newImg.newUrl, 'logo.imagePublicId': newImg.newPublicId } }
                );
                migratedCount++;
            }
        }
    }

    // 5. Migrate Banners
    const banners = await Banner.find({});
    for (const banner of banners) {
        if (banner.image && banner.image.imageUrl && banner.image.imagePublicId) {
            const newImg = await migrateImage(banner.image.imageUrl, banner.image.imagePublicId, 'Banner', banner._id.toString());
            if (newImg) {
                await Banner.updateOne(
                    { _id: banner._id },
                    { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
                );
                migratedCount++;
            }
        }
    }

    // 6. Migrate SizeGuides
    const sizeGuides = await SizeGuide.find({});
    for (const sg of sizeGuides) {
        if (sg.image && sg.image.imageUrl && sg.image.imagePublicId) {
            const newImg = await migrateImage(sg.image.imageUrl, sg.image.imagePublicId, 'SizeGuide', sg._id.toString());
            if (newImg) {
                await SizeGuide.updateOne(
                    { _id: sg._id },
                    { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
                );
                migratedCount++;
            }
        }
    }

    console.log('--- Migration Completed ---');
    console.log(`Successfully migrated: ${migratedCount} images`);
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
