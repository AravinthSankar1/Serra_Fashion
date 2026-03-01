
const axios = require('axios');
require('dotenv').config();

const clientId = process.env.QIKINK_CLIENT_ID;
const clientSecret = process.env.QIKINK_CLIENT_SECRET;

async function testAuth(mode) {
    const baseUrl = mode === 'live' ? 'https://api.qikink.com' : 'https://sandbox.qikink.com';
    console.log(`\n--- Testing ${mode.toUpperCase()} ---`);

    try {
        const payload = new URLSearchParams();
        payload.append('ClientId', clientId);
        payload.append('client_secret', clientSecret);

        const res = await axios.post(`${baseUrl}/api/token`, payload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = res.data.Accesstoken;
        console.log('✅ Auth Success!');

        const endpoints = ['/api/products', '/api/my-products', '/api/v1/products', '/api/v1/my-products', '/api/order'];
        for (const ep of endpoints) {
            try {
                const pRes = await axios.get(`${baseUrl}${ep}`, {
                    headers: {
                        'ClientId': clientId,
                        'Accesstoken': token
                    }
                });
                console.log(`✅ Success ${ep}: ${pRes.status}`);
            } catch (err) {
                console.log(`❌ Failed ${ep}: ${err.response?.status || err.message}`);
            }
        }
    } catch (err) {
        console.log(`❌ Auth Failed: ${err.response?.status || err.message}`);
    }
}

async function run() {
    await testAuth('sandbox');
    await testAuth('live');
}

run();
