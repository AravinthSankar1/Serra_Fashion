const axios = require('axios');
require('dotenv').config();

const testQikinkEndpoints = async () => {
    const clientId = process.env.QIKINK_CLIENT_ID;
    const clientSecret = process.env.QIKINK_CLIENT_SECRET;
    const baseUrl = process.env.QIKINK_BASE_URL || 'https://sandbox.qikink.com';

    console.log(`[Diagnostic] Auth: ID: ${clientId} | Base URL: ${baseUrl}`);

    try {
        const authPayload = new URLSearchParams();
        authPayload.append('ClientId', clientId);
        authPayload.append('client_secret', clientSecret);

        const authRes = await axios.post(`${baseUrl}/api/token`, authPayload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = authRes.data.Accesstoken;
        console.log(`[Auth] SUCCESS. Token obtained.`);

        const endpointsToTest = [
            '/api/my-products',
            '/api/myproducts',
            '/api/products',
            '/api/my_products',
        ];

        for (const endpoint of endpointsToTest) {
            console.log(`\nTesting: GET ${baseUrl}${endpoint}`);
            try {
                const test1 = await axios.get(`${baseUrl}${endpoint}`, {
                    headers: { 'ClientId': clientId, 'Accesstoken': token }
                });
                console.log(`[Test] SUCCESS! Keys:`, Object.keys(test1.data || {}).join(', '));
            } catch (err) {
                console.log(`[Test] FAILED: ${err.response?.status} `);
            }
        }
    } catch (err) {
        console.error("[Auth] FAILED:", err.message);
    }
};

testQikinkEndpoints();
