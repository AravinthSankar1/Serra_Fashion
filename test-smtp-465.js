
const nodemailer = require('nodemailer');

const config = {
    email: {
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: 'serrafashion123@gmail.com',
            pass: 'kswptgffytgrxpkp',
        },
        from: 'serrafashion123@gmail.com',
    }
};

console.log('Testing SMTP Connection (Port 465) with:');
console.log('Host:', config.email.host);
console.log('Port:', config.email.port);
console.log('User:', config.email.auth.user);

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: true, // true for 465, false for other ports
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
