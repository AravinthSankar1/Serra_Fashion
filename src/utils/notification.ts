import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from '../config';
import dns from 'dns';

// Force node to use IPv4 to avoid ENETUNREACH in deployed environments without IPv6 routing
try {
    dns.setDefaultResultOrder('ipv4first');
} catch (e) {
    console.warn('[EMAIL] Failed to set default DNS result order');
}

const getTransporterConfig = () => {
    const isGmail = config.email.host?.includes('gmail.com');

    const baseConfig: any = {
        auth: {
            user: config.email.auth.user,
            pass: config.email.auth.pass,
        },
        tls: {
            rejectUnauthorized: false
        },
        family: 4, // Explicity force IPv4 on the SMTP socket connection
        pool: true,
        connectionTimeout: 20000,
        logger: true,
        debug: true,
        secure: false,   // added defaults
        requireTLS: true,
        ignoreTLS: false,
    };

    if (isGmail) {
        // Use port 465 (SSL) as many cloud providers (Render/DigitalOcean) block outbound port 587.
        return {
            ...baseConfig,
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
        };
    }

    return {
        ...baseConfig,
        host: config.email.host,
        port: config.email.port,
        secure: Number(config.email.port) === 465,
    };
};

const transporter = nodemailer.createTransport(getTransporterConfig());

// Removed transporter.verify to prevent misleading "SMTP Connection Error" logs on startup when API bypass is active

// Create a universal wrapper that routes over HTTPS (Gmail API) to bypass ENETUNREACH/Timeouts on Server providers
const sendEmailSecured = async (options: { from?: string, to: string, subject: string, html: string, attachments?: any[] }) => {
    const { clientId, clientSecret, refreshToken } = config.email.gmail || {};

    if (clientId && refreshToken && clientSecret) {
        try {
            const { OAuth2Client } = require('google-auth-library');
            const oAuth2Client = new OAuth2Client(
                config.email.gmail.clientId,
                config.email.gmail.clientSecret,
                'https://developers.google.com/oauthplayground'
            );
            oAuth2Client.setCredentials({ refresh_token: config.email.gmail.refreshToken });
            const { token } = await oAuth2Client.getAccessToken();

            if (token) {
                const boundary = 'serra_mail_boundary_' + Date.now();
                const str = [
                    `From: "SÉRRA FASHION" <${options.from || config.email.from || config.email.auth.user}>`,
                    `To: ${options.to}`,
                    `Subject: ${options.subject}`,
                    'MIME-Version: 1.0',
                    `Content-Type: multipart/related; boundary="${boundary}"`,
                    '',
                    `--${boundary}`,
                    'Content-Type: text/html; charset="UTF-8"',
                    'Content-Transfer-Encoding: base64',
                    '',
                    Buffer.from(options.html).toString('base64'),
                    '',
                    ...(options.attachments || []).map(att => [
                        `--${boundary}`,
                        `Content-Type: ${att.contentType}`,
                        'Content-Transfer-Encoding: base64',
                        `Content-ID: <${att.cid}>`,
                        `Content-Disposition: inline; filename="${att.filename}"`,
                        '',
                        att.content,
                        ''
                    ].join('\r\n')),
                    `--${boundary}--`
                ].join('\r\n');

                const encodedMail = Buffer.from(str)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await axios.post(
                    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                    { raw: encodedMail },
                    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                );
                return { messageId: 'api-bypass-sent' };
            }
        } catch (apiError: any) {
            console.warn('[EMAIL] HTTPS API Bypass failed, fallback to strict SMTP:', apiError.response?.data || apiError.message);
        }
    }

    // Strict SMTP Fallback
    return transporter.sendMail({
        ...options,
        attachments: (options.attachments || []).map(att => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            contentType: att.contentType,
            cid: att.cid
        }))
    });
};

/**
 * Premium Email Template Wrapper
 */
const getEmailTemplate = (title: string, subtitle: string, content: string, ctaText?: string, ctaLink?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #111827; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { padding: 40px 20px; text-align: center; }
        .logo { height: 170px; width: auto; }
        .content { padding: 0 40px 40px; }
        .hero { background-color: #f9fafb; border-radius: 32px; padding: 48px; text-align: center; margin-bottom: 40px; }
        .title { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: #000000; margin-bottom: 12px; }
        .subtitle { font-size: 16px; color: #6b7280; line-height: 1.6; max-width: 300px; margin: 0 auto 0; }
        .body-text { font-size: 15px; color: #374151; line-height: 1.8; margin-top: 32px; }
        .cta-container { text-align: center; margin-top: 48px; }
        .button { display: inline-block; padding: 18px 44px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .footer { padding: 60px 40px; text-align: center; border-top: 1px solid #f3f4f6; }
        .footer-text { font-size: 11px; color: #9ca3af; letter-spacing: 0.1em; text-transform: uppercase; line-height: 2; margin-bottom: 24px; }
        .social-links { margin-bottom: 24px; }
        .social-link { display: inline-block; margin: 0 12px; color: #111827; text-decoration: none; font-size: 12px; font-weight: 600; }
        .order-card { background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 20px; padding: 24px; margin-top: 32px; }
        .status-badge { display: inline-block; padding: 6px 14px; background-color: #000; color: #fff; font-size: 10px; font-weight: 800; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.15em; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <img src="cid:weblogo" alt="SÉRRA FASHION" class="logo" />
        </div>
        <div class="content">
            <div class="hero">
                <div class="title">${title}</div>
                <p class="subtitle">${subtitle}</p>
            </div>
            
            ${content}

            ${ctaText && ctaLink ? `
            <div class="cta-container">
                <a href="${ctaLink}" class="button">${ctaText}</a>
            </div>` : ''}
        </div>
        <div class="footer">
            <div class="social-links">
                <a href="#" class="social-link">INSTAGRAM</a>
                <a href="#" class="social-link">TWITTER</a>
                <a href="#" class="social-link">FACEBOOK</a>
            </div>
            <p class="footer-text">
                &copy; ${new Date().getFullYear()} SÉRRA FASHION. ALL RIGHTS RESERVED.<br>
                CRAFTED FOR THE RELENTLESS PURSUIT OF STYLE.
            </p>
            <p style="font-size: 10px; color: #d1d5db;">You are receiving this because you shopped at SÉRRA FASHION.</p>
        </div>
    </div>
</body>
</html>
`;

// Helper to get logo attachment
const getLogoAttachment = () => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logoPath = path.join(process.cwd(), 'frontend', 'public', 'weblogo.png');
        if (fs.existsSync(logoPath)) {
            const content = fs.readFileSync(logoPath).toString('base64');
            return [{
                filename: 'weblogo.png',
                content: content,
                contentType: 'image/png',
                cid: 'weblogo'
            }];
        }
    } catch (e) {
        console.warn('[EMAIL] Failed to load logo for attachment');
    }
    return [];
};

export const sendEmailOtp = async (to: string, otp: string) => {
    if (!config.email.auth.user || !config.email.auth.pass) {
        console.warn(`[EMAIL] SMTP credentials missing. NODE_ENV: ${config.env}`);
        if (config.env === 'development') {
            console.log(`[DEV-MODE] OTP for ${to}: ${otp}`);
            return true;
        }
        return false;
    }

    const html = getEmailTemplate(
        'VERIFY ACCESS',
        'Secure your presence in the SÉRRA collection.',
        `<div class="order-card" style="text-align: center;">
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 0.3em; color: #000; margin-bottom: 8px;">${otp}</div>
            <p style="font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Valid for 5 minutes</p>
        </div>
        <p class="body-text" style="text-align: center;">Enter this code on the verification page to finalize your access. If you did not initiate this, please ignore this communication.</p>`
    );

    try {
        const info = await sendEmailSecured({
            from: config.email.from || config.email.auth.user,
            to,
            subject: `Verification Code: ${otp}`,
            html,
            attachments: getLogoAttachment()
        });
        console.log(`[EMAIL] Sent successfully: ${info.messageId}`);
        return true;
    } catch (error: any) {
        console.error('[EMAIL] SMTP Error Details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            message: error.message,
        });

        // Fallback for development so testing can continue
        if (config.env === 'development') {
            console.log(`[DEV-MODE-FALLBACK] SMTP failed but here is your OTP for ${to}: ${otp}`);
            return true;
        }

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
            'ORDER CONFIRMED',
            `Thank you for your purchase, ${order.user?.name || 'Valued Customer'}. We are meticulously preparing your pieces.`,
            `<div class="order-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <span style="font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Order ID: #${order._id.slice(-6).toUpperCase()}</span>
                    <span class="status-badge" style="background-color: #10b981;">Confirmed</span>
                </div>
                <div style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 8px;">₹${order.totalAmount.toLocaleString()}</div>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">Your curated collection is currently being processed with the utmost care by our fulfillment specialists. You'll receive another update once your package is dispatched.</p>
            </div>
            <p class="body-text">We appreciate your discerning taste and trust in SÉRRA FASHION. View your full order history or track your delivery progress anytime.</p>`,
            'Order Status',
            `${config.frontendUrl}/orders`
        );

        try {
            await sendEmailSecured({
                from: config.email.from,
                to,
                subject: `Confirmed: Order #${order._id.slice(-6).toUpperCase()}`,
                html,
                attachments: getLogoAttachment()
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
            'STATUS UPDATE',
            `Your curated order #${order._id.slice(-6).toUpperCase()} has progressed to the next stage.`,
            `<div class="order-card">
                <div style="margin-bottom: 24px; text-align: center;">
                    <span style="font-size: 10px; color: #9ca3af; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 12px;">Current Status</span>
                    <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#000'}; padding: 12px 24px; font-size: 14px; letter-spacing: 0.2em;">${newStatus}</span>
                </div>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.8; text-align: center;">Our logistics team is diligently working to ensure your pieces arrive in pristine condition. Every step reflects our commitment to excellence.</p>
            </div>
            <p class="body-text">If you have inquiries regarding this status change, our concierge team is available to assist you. Detail tracking is available via your SÉRRA account.</p>`,
            'Order Concierge',
            `${config.frontendUrl}/orders`
        );

        try {
            await sendEmailSecured({
                from: config.email.from,
                to,
                subject: `Update: Order #${order._id.slice(-6).toUpperCase()} is ${newStatus}`,
                html,
                attachments: getLogoAttachment()
            });
            console.log(`[EMAIL] Status update sent to ${to}`);

            // Also Notify Admin of Status Change as requested
            if (config.admin.email) {
                const adminHtml = getEmailTemplate(
                    'STATUS CHANGED',
                    `Order #${order._id.slice(-6).toUpperCase()} status has been updated.`,
                    `<div class="order-card">
                        <div style="margin-bottom: 20px;">
                            <p style="font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase;">Customer</p>
                            <p style="font-size: 15px; font-weight: 700; color: #000;">${order.user?.name || 'Customer'}</p>
                        </div>
                        <div style="display: flex; gap: 40px; align-items: center;">
                            <div>
                                <p style="font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase;">New Status</p>
                                <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#000'};">${newStatus}</span>
                            </div>
                        </div>
                    </div>`,
                    'View Admin Dashboard',
                    `${config.frontendUrl}/admin/orders`
                );
                await sendEmailSecured({
                    from: config.email.from,
                    to: config.admin.email,
                    subject: `[ADMIN] Status Change: #${order._id.slice(-6).toUpperCase()} is ${newStatus}`,
                    html: adminHtml,
                    attachments: getLogoAttachment()
                });
            }
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
            'NEW ACQUISITION',
            'A new acquisition has been recorded from a customer.',
            `<div class="order-card">
                <div style="margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px;">
                    <p style="font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Discerned Customer</p>
                    <p style="font-size: 16px; font-weight: 700; color: #000;">${order.user?.name || 'Guest User'} <span style="font-size: 12px; font-weight: 400; color: #6b7280;">(${order.user?.email || order.shippingAddress.email})</span></p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <p style="font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; margin-bottom: 12px;">Order Summary</p>
                    ${(order.items || []).map((item: any) => `
                        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                            <span style="color: #374151;">${item.product?.title || 'Premium Item'} (x${item.quantity})</span>
                            <span style="font-weight: 700; color: #111827;">₹${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                    <div>
                        <p style="font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Valuation</p>
                        <p style="font-size: 20px; font-weight: 700; color: #000;">₹${order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Reference ID</p>
                        <p style="font-size: 14px; font-weight: 700; color: #6b7280;">#${order._id.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
            </div>`,
            'Acknowledge Order',
            `${config.frontendUrl}/admin/orders`
        );

        try {
            await sendEmailSecured({
                from: config.email.from,
                to: config.admin.email,
                subject: `[ADMIN] Acquisition Alert: #${order._id.slice(-8).toUpperCase()}`,
                html,
                attachments: getLogoAttachment()
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

// Vendor Submission Alert
export const sendVendorSubmissionAlert = async (type: 'email' | 'whatsapp', itemType: string, itemName: string, vendorName: string) => {
    const message = `[ADMIN] New Vendor Submission!\nVendor: ${vendorName}\nItem: ${itemName} (${itemType})`;

    if (type === 'email' && config.admin.email) {
        const html = getEmailTemplate(
            'New Content for Approval',
            'A vendor has submitted new content that requires your review.',
            `<div class="order-card">
                <p><strong>Vendor:</strong> ${vendorName}</p>
                <p><strong>Item Name:</strong> ${itemName}</p>
                <p><strong>Type:</strong> ${itemType.toUpperCase()}</p>
                <p style="margin-top: 16px; font-size: 14px; color: #374151;">Please review this submission in your dashboard to ensure it meets SÉRRA's quality standards.</p>
            </div>`,
            'Review Submissions',
            `${config.frontendUrl}/admin/products`
        );

        try {
            await sendEmailSecured({
                from: config.email.from,
                to: config.admin.email,
                subject: `[ADMIN] New ${itemType} Submission from ${vendorName}`,
                html
            });
            console.log('[EMAIL] Admin submission alert sent');
            return true;
        } catch (error) {
            console.error('[EMAIL] Admin submission alert failed:', error);
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
            console.log('[WHATSAPP] Admin submission alert sent');
            return true;
        } catch (error: any) {
            console.error('[WHATSAPP] Admin submission alert failed:', error.response?.data);
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
