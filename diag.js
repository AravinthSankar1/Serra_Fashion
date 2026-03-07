const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const col = db.collection('users');

    const admin = await col.findOne({ email: 'admin@serra.com' });

    if (!admin) {
        console.log('RESULT: NOT_FOUND');
    } else {
        console.log('RESULT: FOUND');
        console.log('ROLE:' + admin.role);
        console.log('HAS_PASSWORD:' + !!admin.password);
        console.log('VERIFIED:' + admin.isEmailVerified);

        if (admin.password) {
            const match = await bcrypt.compare('Password@123', admin.password);
            console.log('PASSWORD_MATCH:' + match);

            if (!match) {
                // Force update password directly 
                const hash = await bcrypt.hash('Password@123', 10);
                await col.updateOne({ email: 'admin@serra.com' }, { $set: { password: hash } });
                console.log('PASSWORD_FIXED:true');
            }
        } else {
            const hash = await bcrypt.hash('Password@123', 10);
            await col.updateOne({ email: 'admin@serra.com' }, { $set: { password: hash } });
            console.log('PASSWORD_ADDED:true');
        }
    }

    await mongoose.disconnect();
};

run().catch(e => { console.log('ERROR:' + e.message); process.exit(1); });
