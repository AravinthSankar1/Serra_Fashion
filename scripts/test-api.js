const axios = require('axios');

const API_URL = 'http://localhost:5002/api/v1';

async function runTests() {
    console.log('🚀 Starting API Tests...');

    let token = '';

    // 1. Health Check (Base URL or separate endpoint?)
    // We added /api/v1/health in routes.ts? No, in app.ts or routes.ts
    // routes.ts has: router.get('/health', ...) mapped to /api/v1/health
    try {
        const res = await axios.get(`${API_URL}/health`);
        console.log('✅ Health Check Passed:', res.data);
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        if (error.response) console.error('Response:', error.response.status, error.response.data);
        else if (error.request) console.error('No Response Received. Is server running?');
    }

    // 2. Register
    const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123'
    };

    try {
        const res = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('✅ Register Passed:', res.data.message);
        token = res.data.data.tokens.access;
    } catch (error) {
        console.error('❌ Register Failed:', error.response?.data || error.message);
    }

    // 3. Login
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login Passed:', res.data.message);
        if (!token) token = res.data.data.tokens.access;
    } catch (error) {
        console.error('❌ Login Failed:', error.response?.data || error.message);
    }

    // 4. Get Profile
    try {
        const res = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Get Profile Passed:', res.data.data.email);
    } catch (error) {
        console.error('❌ Get Profile Failed:', error.response?.data || error.message);
    }

    // 5. Create Product (Might fail if not Admin)
    // Let's try anyway expecting 403 or success
    try {
        const product = {
            name: "Test T-Shirt",
            slug: `test-t-shirt-${Date.now()}`,
            description: "A cool test shirt",
            basePrice: 100,
            brand: "65bXXXXXXXXXXXX", // Mock ID, will likely fail validation if DB checks ref validity and ID is fake
            category: "65bXXXXXXXXXXXX"
        };
        // Note: This will likely fail due to invalid ObjectIds for Brand/Category if we don't create them first.
        // But we just want to test if the endpoint is reachable.

        const res = await axios.post(`${API_URL}/products`, product, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Create Product Passed:', res.data);
    } catch (error) {
        // 403 is expected for normal user
        if (error.response?.status === 403) {
            console.log('✅ Create Product Protected (403 as expected for customer)');
        } else {
            console.error('❌ Create Product Failed:', error.response?.data || error.message);
        }
    }

    // 6. Get Products
    try {
        const res = await axios.get(`${API_URL}/products`);
        console.log('✅ Get Products Passed. Count:', res.data.data.length);
    } catch (error) {
        console.error('❌ Get Products Failed:', error.response?.data || error.message);
    }
}

runTests();
