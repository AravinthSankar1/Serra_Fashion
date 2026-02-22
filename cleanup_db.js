import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function cleanup() {
    try {
        await mongoose.connect(MONGODB_URI);

        // Delete products without titles as they are likely broken
        const deleted = await Product.deleteMany({ title: { $exists: false } });
        console.log(`Deleted ${deleted.deletedCount} broken products.`);

        // Ensure dummy data is approved and published
        const updated = await Product.updateMany(
            {},
            { $set: { approvalStatus: 'APPROVED', isPublished: true } }
        );
        console.log(`Ensured ${updated.modifiedCount} products are approved and published.`);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
cleanup();
