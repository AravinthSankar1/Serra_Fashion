import PDFDocument from 'pdfkit';
import { IOrder } from './order.model';
import path from 'path';
import fs from 'fs';

export const generateInvoicePDF = (order: IOrder, res: any) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream directly to response
    doc.pipe(res);

    // Header Logo
    const logoPath = path.join(process.cwd(), 'frontend', 'public', 'weblogo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 225, 50, { width: 150 });
        doc.moveDown(5);
    } else {
        doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('SÉRRA FASHION', { align: 'center' })
            .moveDown();
    }

    doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('INVOICE', { align: 'right' })
        .moveDown(0.5);

    // Order Info
    doc.fillColor('#000000');
    const infoY = doc.y;
    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Order Details', 50, infoY)
        .font('Helvetica')
        .text(`Invoice ID: #${order._id.toString().toUpperCase()}`, 50, infoY + 15)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, infoY + 30)
        .text(`Status: ${order.orderStatus}`, 50, infoY + 45);

    doc
        .font('Helvetica-Bold')
        .text('Customer Details', 350, infoY)
        .font('Helvetica')
        .text(order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName, 350, infoY + 15)
        .text(order.shippingAddress.email, 350, infoY + 30)
        .text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`, 350, infoY + 45)
        .text(`${order.shippingAddress.state}, ${order.shippingAddress.zipCode}`, 350, infoY + 60);

    doc.moveDown(4);

    // Table Header
    const tableHeaderY = doc.y;
    doc
        .rect(50, tableHeaderY - 10, 500, 30)
        .fill('#f9fafb')
        .fillColor('#000000');

    doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('DESCRIPTION', 60, tableHeaderY)
        .text('QTY', 350, tableHeaderY)
        .text('PRICE', 420, tableHeaderY)
        .text('TOTAL', 490, tableHeaderY);

    // Items
    let y = tableHeaderY + 30;
    doc.font('Helvetica').fontSize(9);

    order.items.forEach((item: any) => {
        const title = item.product?.title || 'Premium Apparel';
        const price = item.price;
        const total = price * item.quantity;

        // Draw light separator
        doc.strokeColor('#f3f4f6').lineWidth(0.5).moveTo(50, y - 5).lineTo(550, y - 5).stroke();

        doc.fillColor('#000').text(title.substring(0, 45), 60, y);
        doc.text(item.quantity.toString(), 350, y);
        doc.text(`INR ${price.toLocaleString()}`, 420, y);
        doc.text(`INR ${total.toLocaleString()}`, 490, y);

        y += 25;
    });

    // Subtotal & Total
    y += 20;
    doc.strokeColor('#000').lineWidth(1).moveTo(350, y).lineTo(550, y).stroke();
    y += 15;

    doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('GRAND TOTAL:', 350, y)
        .fontSize(12)
        .text(`INR ${order.totalAmount.toLocaleString()}`, 450, y, { align: 'right', width: 100 });

    // Footer
    doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#9ca3af')
        .text('This is a computer generated invoice. No signature required.', 50, 750, { align: 'center', width: 500 })
        .text('Thank you for choosing SÉRRA FASHION.', 50, 765, { align: 'center', width: 500 });

    doc.end();
};
