import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function fixProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Product.updateMany(
            { $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: null }] },
            { $set: { approvalStatus: 'APPROVED', isPublished: true } }
        );

        console.log(`Updated ${result.modifiedCount} products.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixProducts();
