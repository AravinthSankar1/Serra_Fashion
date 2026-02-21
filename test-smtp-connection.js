
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        auth: {
            user: (process.env.SMTP_USER || '').trim(),
            pass: (process.env.SMTP_PASS || '').replace(/\s/g, ''),
        },
        from: (process.env.EMAIL_FROM || process.env.SMTP_USER || '').replace(/^["']|["']$/g, '').trim(),
    }
};

console.log('Testing SMTP Connection with:');
console.log('Host:', config.email.host);
console.log('Port:', config.email.port);
console.log('User:', config.email.auth.user);
console.log('From:', config.email.from);
// console.log('Pass:', config.email.auth.pass); // Don't log pass

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
    },
    tls: {
        rejectUnauthorized: false
    },
    logger: true,
    debug: true,
});

transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Verification Failed:', error);
    } else {
        console.log('SMTP Verification Success!');
    }
    process.exit(0);
});
