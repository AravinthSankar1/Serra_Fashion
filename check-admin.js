/**
 * Diagnostic Script - Check admin user in DB
 * Run with: node check-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const run = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        // Raw collection access (bypasses model restrictions like select: false)
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find the admin
        const admin = await usersCollection.findOne({ email: 'admin@serra.com' });

        if (!admin) {
            console.log('❌ NO USER FOUND with email admin@serra.com');
            console.log('   The reset-admin.js must have failed silently.');
        } else {
            console.log('✅ Admin user found in DB:');
            console.log(`   _id      : ${admin._id}`);
            console.log(`   email    : ${admin.email}`);
            console.log(`   role     : ${admin.role}`);
            console.log(`   verified : ${admin.isEmailVerified}`);
            console.log(`   name     : ${admin.name}`);
            console.log(`   password : ${admin.password ? admin.password.substring(0, 20) + '...' : '❌ MISSING!'}`);

            if (admin.password) {
                // Test the password
                const testPass = 'Password@123';
                const match = await bcrypt.compare(testPass, admin.password);
                console.log(`\n🔑 Password test "Password@123": ${match ? '✅ MATCH' : '❌ NO MATCH'}`);

                if (!match) {
                    console.log('\n🔧 Fixing password now...');
                    const newHash = await bcrypt.hash('Password@123', 10);
                    await usersCollection.updateOne(
                        { email: 'admin@serra.com' },
                        { $set: { password: newHash, role: 'super_admin', isEmailVerified: true } }
                    );
                    const verify = await bcrypt.compare('Password@123', newHash);
                    console.log(`   ✅ New password set and verified: ${verify}`);
                }
            } else {
                console.log('\n🔧 Password field is missing — fixing now...');
                const newHash = await bcrypt.hash('Password@123', 10);
                await usersCollection.updateOne(
                    { email: 'admin@serra.com' },
                    { $set: { password: newHash, role: 'super_admin', isEmailVerified: true } }
                );
                console.log('   ✅ Password set successfully');
            }
        }

        // Also check if there are multiple admins with similar emails
        const allAdmins = await usersCollection.find({
            $or: [
                { role: 'admin' },
                { role: 'super_admin' },
                { email: { $regex: 'serra', $options: 'i' } }
            ]
        }).toArray();

        console.log(`\n📋 All admin/serra users in DB (${allAdmins.length}):`);
        allAdmins.forEach(u => {
            console.log(`   - ${u.email} | role: ${u.role} | hasPassword: ${!!u.password}`);
        });

        await mongoose.disconnect();
        console.log('\n🏁 Done. Try logging in now.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

run();
