const axios = require('axios');

async function testOtp() {
    try {
        console.log('Attempting to send OTP...');
        const response = await axios.post('http://localhost:5002/api/v1/auth/send-otp', {
            contact: 'aravinth.sankar2002@gmail.com',
            type: 'email'
        });
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else if (error.request) {
            console.error('Error Request: No response received', error.message);
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testOtp();
