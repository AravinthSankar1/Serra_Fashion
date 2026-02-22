import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function checkDetails() {
    try {
        await mongoose.connect(MONGODB_URI);
        const products = await Product.find();
        products.forEach(p => {
            console.log(`- ${p.get('title')}: Approved=${p.get('approvalStatus')}, Published=${p.get('isPublished')}, Category=${p.get('category')}, Gender=${p.get('gender')}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
checkDetails();
