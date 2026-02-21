
const { sendEmailOtp } = require('./dist/utils/notification');
const { config } = require('./dist/config');

async function test() {
    console.log('Environment:', config.env);
    console.log('Attempting to send real OTP to serrafashion123@gmail.com');
    const result = await sendEmailOtp('serrafashion123@gmail.com', '123456');
    console.log('Result:', result);
}

test();
