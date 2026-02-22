import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function checkPending() {
    try {
        await mongoose.connect(MONGODB_URI);
        const pendingCount = await Product.countDocuments({ approvalStatus: 'PENDING' });
        console.log('Pending Products:', pendingCount);

        const allCount = await Product.countDocuments();
        console.log('Total Products (any status):', allCount);

        const publishedCount = await Product.countDocuments({ isPublished: true });
        console.log('Published Products:', publishedCount);

        const approvedAndPublished = await Product.countDocuments({ approvalStatus: 'APPROVED', isPublished: true });
        console.log('Approved & Published:', approvedAndPublished);

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
checkPending();
