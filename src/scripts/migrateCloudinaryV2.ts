import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { v2 as cloudinary } from 'cloudinary';

const OLD_CLOUD_NAME = 'dyaswx9yu';
const NEW_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dlx95lmd4';
const NEW_API_KEY = process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY';
const NEW_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET';

// Configure cloudinary with NEW account for uploads
cloudinary.config({
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

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

/**
 * Migrates a single image from old Cloudinary to new.
 * - If already on new cloud, skips
 * - If on old cloud, uploads from that URL to new cloud with same public_id
 * - Returns new URL and publicId on success, null on skip/fail
 */
async function migrateImage(
  url: string,
  publicId: string,
  label: string
): Promise<{ newUrl: string; newPublicId: string } | null> {
  if (!url || !url.startsWith('http')) {
    return null;
  }

  // If it's already using the new cloud name, skip
  if (url.includes(NEW_CLOUD_NAME)) {
    console.log(`  [SKIP] Already on new cloud: ${publicId}`);
    skippedCount++;
    return null;
  }

  // If not from old cloud either, just skip
  if (!url.includes('cloudinary')) {
    return null;
  }

  try {
    console.log(`  [MIGRATE] ${label}: ${publicId}`);
    
    // Upload directly from old URL to new Cloudinary (preserving the same public_id folder structure)
    const result = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
    });

    console.log(`  [SUCCESS] → ${result.secure_url}`);
    migratedCount++;
    await delay(200); // rate limit protection

    return {
      newUrl: result.secure_url,
      newPublicId: result.public_id,
    };
  } catch (error: any) {
    console.error(`  [ERROR] Failed to migrate ${publicId}: ${error.message}`);
    errorCount++;
    return null;
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✓ Connected to MongoDB\n');
    console.log(`Migrating images from cloud "${OLD_CLOUD_NAME}" → "${NEW_CLOUD_NAME}"\n`);
    console.log('='.repeat(60));

    // ─────────────────────────────────────────────────────────
    // 1. PRODUCTS
    // ─────────────────────────────────────────────────────────
    console.log('\n[1/6] Migrating PRODUCTS...');
    const products = await Product.find({});
    console.log(`  Found ${products.length} products`);

    for (const product of products) {
      let changed = false;

      // Product main images
      for (let i = 0; i < (product.images || []).length; i++) {
        const img = product.images[i];
        if (!img?.imageUrl) continue;
        const newImg = await migrateImage(img.imageUrl, img.imagePublicId || `products/${product._id}_img${i}`, `Product[${product.title}] img[${i}]`);
        if (newImg) {
          product.images[i].imageUrl = newImg.newUrl;
          product.images[i].imagePublicId = newImg.newPublicId;
          changed = true;
        }
      }

      // Variant images
      for (let i = 0; i < (product.variants || []).length; i++) {
        const variant = product.variants[i];
        if (!variant?.variantImage?.imageUrl) continue;
        const newImg = await migrateImage(
          variant.variantImage.imageUrl,
          variant.variantImage.imagePublicId || `products/variants/${product._id}_var${i}`,
          `Product[${product.title}] variant[${i}]`
        );
        if (newImg) {
          product.variants[i].variantImage.imageUrl = newImg.newUrl;
          product.variants[i].variantImage.imagePublicId = newImg.newPublicId;
          changed = true;
        }
      }

      if (changed) {
        await Product.updateOne({ _id: product._id }, { $set: { images: product.images, variants: product.variants } });
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. USERS
    // ─────────────────────────────────────────────────────────
    console.log('\n[2/6] Migrating USERS...');
    const users = await User.find({});
    console.log(`  Found ${users.length} users`);

    for (const user of users) {
      if (!user.profilePicture?.imageUrl) continue;
      const newImg = await migrateImage(
        user.profilePicture.imageUrl,
        user.profilePicture.imagePublicId || `users/${user._id}`,
        `User[${user.email}]`
      );
      if (newImg) {
        await User.updateOne(
          { _id: user._id },
          { $set: { 'profilePicture.imageUrl': newImg.newUrl, 'profilePicture.imagePublicId': newImg.newPublicId } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // 3. CATEGORIES
    // ─────────────────────────────────────────────────────────
    console.log('\n[3/6] Migrating CATEGORIES...');
    const categories = await Category.find({});
    console.log(`  Found ${categories.length} categories`);

    for (const cat of categories) {
      if (!cat.image?.imageUrl) continue;
      const newImg = await migrateImage(
        cat.image.imageUrl,
        cat.image.imagePublicId || `categories/${cat._id}`,
        `Category[${cat.name}]`
      );
      if (newImg) {
        await Category.updateOne(
          { _id: cat._id },
          { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // 4. BRANDS
    // ─────────────────────────────────────────────────────────
    console.log('\n[4/6] Migrating BRANDS...');
    const brands = await Brand.find({});
    console.log(`  Found ${brands.length} brands`);

    for (const brand of brands) {
      if (!brand.logo?.imageUrl) continue;
      const newImg = await migrateImage(
        brand.logo.imageUrl,
        brand.logo.imagePublicId || `brands/${brand._id}`,
        `Brand[${brand.name}]`
      );
      if (newImg) {
        await Brand.updateOne(
          { _id: brand._id },
          { $set: { 'logo.imageUrl': newImg.newUrl, 'logo.imagePublicId': newImg.newPublicId } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // 5. BANNERS
    // ─────────────────────────────────────────────────────────
    console.log('\n[5/6] Migrating BANNERS...');
    const banners = await Banner.find({});
    console.log(`  Found ${banners.length} banners`);

    for (const banner of banners) {
      if (!banner.image?.imageUrl) continue;
      const newImg = await migrateImage(
        banner.image.imageUrl,
        banner.image.imagePublicId || `banners/${banner._id}`,
        `Banner[${banner.title}]`
      );
      if (newImg) {
        await Banner.updateOne(
          { _id: banner._id },
          { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // 6. SIZE GUIDES
    // ─────────────────────────────────────────────────────────
    console.log('\n[6/6] Migrating SIZE GUIDES...');
    const sizeGuides = await SizeGuide.find({});
    console.log(`  Found ${sizeGuides.length} size guides`);

    for (const sg of sizeGuides) {
      if (!sg.image?.imageUrl) continue;
      const newImg = await migrateImage(
        sg.image.imageUrl,
        sg.image.imagePublicId || `sizeguides/${sg._id}`,
        `SizeGuide[${sg.name}]`
      );
      if (newImg) {
        await SizeGuide.updateOne(
          { _id: sg._id },
          { $set: { 'image.imageUrl': newImg.newUrl, 'image.imagePublicId': newImg.newPublicId } }
        );
      }
    }

    // ─────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('✓ Migration Complete!');
    console.log(`  ✅ Migrated: ${migratedCount} images`);
    console.log(`  ⏭  Skipped (already on new cloud): ${skippedCount} images`);
    console.log(`  ❌ Errors: ${errorCount} images`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

run();
