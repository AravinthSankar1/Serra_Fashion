import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Product } from '../modules/product/product.model';

const OLD_CLOUD_NAME = 'dyaswx9yu';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Find all products with any remaining old cloud images
    const products = await Product.find({
        'images.imageUrl': new RegExp(OLD_CLOUD_NAME)
    });

    console.log(`Found ${products.length} products with old cloud images`);

    for (const product of products) {
        let changed = false;
        const keptImages: any[] = [];

        for (const img of product.images) {
            if (img.imageUrl && img.imageUrl.includes(OLD_CLOUD_NAME)) {
                console.log(`  [REMOVE] Broken image on ${product.title}: ${img.imagePublicId}`);
                // Don't add to keptImages - remove the broken image
                changed = true;
            } else {
                keptImages.push(img);
            }
        }

        if (changed) {
            if (keptImages.length === 0) {
                console.log(`  [WARNING] Product ${product.title} would have no images! Keeping broken reference.`);
            } else {
                await Product.updateOne(
                    { _id: product._id },
                    { $set: { images: keptImages } }
                );
                console.log(`  [FIXED] ${product.title}: removed broken images, kept ${keptImages.length} valid images`);
            }
        }
    }

    // Also check variants
    const variantProducts = await Product.find({
        'variants.variantImage.imageUrl': new RegExp(OLD_CLOUD_NAME)
    });

    console.log(`\nFound ${variantProducts.length} products with old cloud variant images`);

    for (const product of variantProducts) {
        let changed = false;
        
        for (let i = 0; i < product.variants.length; i++) {
            const variant = product.variants[i];
            if (variant.variantImage?.imageUrl && variant.variantImage.imageUrl.includes(OLD_CLOUD_NAME)) {
                console.log(`  [REMOVE] Broken variant image on ${product.title} variant ${i}`);
                // @ts-ignore
                product.variants[i].variantImage = { imageUrl: '', imagePublicId: '' };
                changed = true;
            }
        }

        if (changed) {
            await Product.updateOne(
                { _id: product._id },
                { $set: { variants: product.variants } }
            );
            console.log(`  [FIXED] Cleared broken variant images on ${product.title}`);
        }
    }

    console.log('\n✓ Broken image cleanup complete!');
    process.exit(0);
}

run().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
