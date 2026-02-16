
import { config } from '../config';
import Razorpay from 'razorpay';
import { z } from 'zod';

console.log('Testing Razorpay Connection...');
console.log('Key ID:', config.razorpay.keyId);
// Do not log secret fully
console.log('Key Secret starts with:', config.razorpay.keySecret.substring(0, 4));

const razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
});

async function testOrder() {
    try {
        console.log('Creating test order...');
        const options = {
            amount: 50000, // 500.00 INR
            currency: 'INR',
            receipt: 'test_receipt_123',
        };
        const order = await razorpay.orders.create(options);
        console.log('Order created successfully:', order);
    } catch (error) {
        console.error('Error creating order:', error);
    }
}

testOrder();
