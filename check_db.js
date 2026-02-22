import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function checkProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const totalProducts = await Product.countDocuments();
        console.log('Total Products:', totalProducts);

        if (totalProducts > 0) {
            const products = await Product.find().limit(5);
            products.forEach(p => {
                console.log(`- Title: ${p.get('title')}, Approved: ${p.get('approvalStatus')}, Published: ${p.get('isPublished')}`);
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkProducts();
