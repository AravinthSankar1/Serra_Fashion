import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function listAll() {
    try {
        await mongoose.connect(MONGODB_URI);
        const products = await Product.find();
        console.log('Count:', products.length);
        products.forEach(p => {
            console.log(`ID: ${p._id}, Title: ${p.get('title')}, Status: ${p.get('approvalStatus')}, Published: ${p.get('isPublished')}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
listAll();
