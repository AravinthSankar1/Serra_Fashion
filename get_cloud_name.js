
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const products = await mongoose.connection.db.collection('products').find({}).limit(1).toArray();
        if (products.length > 0) {
            const img = products[0].images?.[0];
            if (img) {
                const url = img.imageUrl || '';
                const parts = url.split('/');
                const cloudName = parts[3];
                process.stdout.write('CLOUD_NAME_IN_DB:' + cloudName + '\n');
            } else {
                process.stdout.write('NO_IMAGES_FOUND\n');
            }
        } else {
            process.stdout.write('NO_PRODUCTS_FOUND\n');
        }

        await mongoose.disconnect();
    } catch (err) {
        process.stdout.write('ERROR:' + err.message + '\n');
    }
}

run();
