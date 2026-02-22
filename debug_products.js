import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function debugProducts() {
    try {
        await mongoose.connect(MONGODB_URI);
        const coll = mongoose.connection.db.collection('products');
        const docs = await coll.find().toArray();
        console.log('Total Docs in "products" collection:', docs.length);

        docs.forEach((doc, i) => {
            console.log(`Doc ${i}: ID=${doc._id}, Title=${doc.title}, Approval=${doc.approvalStatus}, Published=${doc.isPublished}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
debugProducts();
