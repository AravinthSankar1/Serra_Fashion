import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from '../config';

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
    },
});

/**
 * Premium Email Template Wrapper
 */
const getEmailTemplate = (title: string, subtitle: string, content: string, ctaText?: string, ctaLink?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #111827; }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .header { padding: 40px; text-align: center; background-color: #000000; color: #ffffff; }
        .brand { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; font-style: italic; }
        .content { padding: 48px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #111827; }
        .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 32px; line-height: 1.5; }
        .body-text { font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 32px; }
        .button { display: inline-block; padding: 16px 32px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer { padding: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .order-card { background-color: #f9fafb; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f3f4f6; }
        .status-badge { display: inline-block; padding: 4px 12px; background-color: #000; color: #fff; font-size: 10px; font-weight: 800; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.1em; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <span class="brand">SÉRRA FASHION</span>
        </div>
        <div class="content">
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle}</div>
            ${content}
            ${ctaText && ctaLink ? `
            <div style="text-align: center; margin-top: 40px;">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>` : ''}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} SÉRRA FASHION. All rights reserved.<br>
            Designed for the relentless pursuit of style.
        </div>
    </div>
</body>
</html>
`;

// OTP Functions
export const sendEmailOtp = async (to: string, otp: string) => {
    if (!config.email.auth.user || !config.email.auth.pass) {
        console.warn('[EMAIL] Credentials not configured. OTP:', otp);
        return true;
    }

    const html = getEmailTemplate(
        'Verify Your Account',
        'Secure your access to the SÉRRA collection.',
        `<div class="order-card" style="text-align: center;">
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 0.2em; color: #000;">${otp}</div>
            <p style="margin-top: 12px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 700;">Valid for 5 minutes</p>
        </div>
        <p class="body-text">Please enter this code on the verification page to continue. If you didn't request this, you can safely ignore this email.</p>`
    );

    try {
        await transporter.sendMail({
            from: `"SÉRRA FASHION" <${config.email.from}>`,
            to,
            subject: `${otp} is your verification code`,
            html,
        });
        console.log(`[EMAIL] OTP sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[EMAIL] Failed:', error);
        return false;
    }
};

export const sendWhatsAppOtp = async (to: string, otp: string) => {
    if (!config.whatsapp.accessToken) {
        console.warn('[WHATSAPP] Not configured. OTP:', otp);
        return true;
    }

    try {
        await axios.post(
            `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: { body: `SÉRRA FASHION: Your verification code is ${otp}. Valid for 5 minutes.` }
            },
            {
                headers: {
                    Authorization: `Bearer ${config.whatsapp.accessToken}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log(`[WHATSAPP] OTP sent to ${to}`);
        return true;
    } catch (error: any) {
        console.error('[WHATSAPP] Failed:', error.response?.data || error.message);
        return false;
    }
};

// Order Confirmation
export const sendOrderConfirmation = async (to: string, order: any, type: 'email' | 'whatsapp' = 'email') => {
    const message = `
        Order Confirmed!
        Order ID: #${order._id.slice(-6).toUpperCase()}
        Total: ₹${order.totalAmount}
        
        Thank you for shopping with SÉRRA FASHION!
    `.trim();

    if (type === 'email') {
        const html = getEmailTemplate(
            'Order Confirmed',
            `Thank you for your purchase, ${order.user?.name || 'Valued Customer'}. We're preparing your pieces.`,
            `<div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <span style="font-size: 12px; color: #6b7280; font-weight: 700; text-transform: uppercase;">Order ID: #${order._id.slice(-6).toUpperCase()}</span>
                    <span class="status-badge" style="background-color: #10b981;">Confirmed</span>
                </div>
                <div style="font-size: 24px; font-weight: 700; color: #111827;">₹${order.totalAmount}</div>
                <p style="margin-top: 16px; font-size: 14px; color: #374151;">Your curated collection is currently being processed by our team.</p>
            </div>
            <p class="body-text">We'll notify you as soon as your order is dispatched. You can track your order status anytime on your dashboard.</p>`,
            'Track Order',
            `${config.frontendUrl}/orders`
        );

        try {
            await transporter.sendMail({
                from: `"SÉRRA FASHION" <${config.email.from}>`,
                to,
                subject: `Order Confirmation #${order._id.slice(-6).toUpperCase()}`,
                html
            });
            console.log(`[EMAIL] Order confirmation sent to ${to}`);
            return true;
        } catch (error) {
            console.error('[EMAIL] Order confirmation failed:', error);
            return false;
        }
    } else {
        try {
            await axios.post(
                `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.whatsapp.accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log(`[WHATSAPP] Order confirmation sent to ${to}`);
            return true;
        } catch (error: any) {
            console.error('[WHATSAPP] Order confirmation failed:', error.response?.data);
            return false;
        }
    }
};

// Order Status Update
export const sendOrderStatusUpdate = async (to: string, order: any, newStatus: string, type: 'email' | 'whatsapp' = 'email') => {
    const message = `
        Your SÉRRA order #${order._id.slice(-6).toUpperCase()} has been updated to: ${newStatus}
    `.trim();

    const statusColors: any = {
        'PENDING': '#f59e0b',
        'PROCESSING': '#3b82f6',
        'SHIPPED': '#6366f1',
        'DELIVERED': '#10b981',
        'CANCELLED': '#ef4444'
    };

    if (type === 'email') {
        const html = getEmailTemplate(
            'Order Update',
            `Something has changed with your order #${order._id.slice(-6).toUpperCase()}.`,
            `<div class="order-card">
                <div style="margin-bottom: 24px;">
                    <span style="font-size: 11px; color: #6b7280; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">New Status</span><br>
                    <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#000'}; padding: 8px 16px; font-size: 14px; margin-top: 8px;">${newStatus}</span>
                </div>
                <p style="font-size: 15px; color: #374151; line-height: 1.6;">Your order is moving through our fulfillment process. We're dedicated to ensuring your pieces arrive in perfect condition.</p>
            </div>
            <p class="body-text">If you have any questions regarding this change, please contact our support team or view your order details.</p>`,
            'View Order Details',
            `${config.frontendUrl}/orders`
        );

        try {
            await transporter.sendMail({
                from: `"SÉRRA FASHION" <${config.email.from}>`,
                to,
                subject: `Update on Order #${order._id.slice(-6).toUpperCase()}`,
                html
            });
            console.log(`[EMAIL] Status update sent to ${to}`);
            return true;
        } catch (error) {
            console.error('[EMAIL] Status update failed:', error);
            return false;
        }
    } else {
        try {
            await axios.post(
                `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.whatsapp.accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log(`[WHATSAPP] Status update sent to ${to}`);
            return true;
        } catch (error: any) {
            console.error('[WHATSAPP] Status update failed:', error.response?.data);
            return false;
        }
    }
};

// Admin Alerts
export const sendAdminOrderAlert = async (type: 'email' | 'whatsapp', order: any) => {
    const message = `[ADMIN] New Order Alert!\nOrder ID: #${order._id.slice(-6).toUpperCase()}\nAmount: ₹${order.totalAmount}`;

    if (type === 'email' && config.admin.email) {
        const html = getEmailTemplate(
            'New Order Received',
            'Take action on a new customer order.',
            `<div class="order-card">
                <p><strong>Customer:</strong> ${order.user?.name || 'Guest'}</p>
                <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
                <p><strong>Order ID:</strong> #${order._id}</p>
            </div>`,
            'Manage Order',
            `${config.frontendUrl}/admin/orders`
        );

        try {
            await transporter.sendMail({
                from: `"SÉRRA SYSTEM" <${config.email.from}>`,
                to: config.admin.email,
                subject: `[ADMIN] New Order received`,
                html
            });
            console.log('[EMAIL] Admin alert sent');
            return true;
        } catch (error) {
            console.error('[EMAIL] Admin alert failed:', error);
            return false;
        }
    } else if (type === 'whatsapp' && config.admin.phone) {
        try {
            await axios.post(
                `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: config.admin.phone,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.whatsapp.accessToken}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            console.log('[WHATSAPP] Admin alert sent');
            return true;
        } catch (error: any) {
            console.error('[WHATSAPP] Admin alert failed:', error.response?.data);
            return false;
        }
    }

    return false;
};

export const sendOrderNotification = async (order: any) => {
    // Backward compatibility - calls new functions
    await sendOrderConfirmation(order.shippingAddress.email, order, 'email');
    if (order.shippingAddress.phone) {
        await sendOrderConfirmation(order.shippingAddress.phone, order, 'whatsapp');
    }
    await sendAdminOrderAlert('email', order);
    await sendAdminOrderAlert('whatsapp', order);
};
