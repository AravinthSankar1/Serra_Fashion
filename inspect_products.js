import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const products = await Product.find();
        console.log('Total:', products.length);
        products.forEach((p, i) => {
            console.log(`P${i}: Title='${p.get('title')}', Slug='${p.get('slug')}', Approval='${p.get('approvalStatus')}', Published='${p.get('isPublished')}'`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
inspect();
