
import { sendEmailOtp } from './src/utils/notification';
import { config } from './src/config';

async function test() {
    console.log('Environment:', config.env);
    console.log('Attempting to send real OTP to serrafashion123@gmail.com');
    try {
        const result = await sendEmailOtp('serrafashion123@gmail.com', '123456');
        console.log('Result:', result);
    } catch (err) {
        console.error('Crash:', err);
    }
    process.exit(0);
}

test();
