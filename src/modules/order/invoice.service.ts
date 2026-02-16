
import PDFDocument from 'pdfkit';
import { IOrder } from './order.model';

export const generateInvoicePDF = (order: IOrder, res: any) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream directly to response
    doc.pipe(res);

    // Header
    doc
        .fontSize(20)
        .text('SÉRRA FASHION', { align: 'center', underline: true })
        .moveDown();

    doc
        .fontSize(12)
        .text(`Invoice ID: ${order.id}`)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
        .text(`Status: ${order.orderStatus}`)
        .moveDown();

    // Line separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    // Table Header
    const tableTop = doc.y + 10;
    doc
        .font('Helvetica-Bold')
        .text('Item', 50, tableTop)
        .text('Qty', 300, tableTop)
        .text('Price', 400, tableTop)
        .text('Total', 500, tableTop);

    // Items
    let y = tableTop + 25;
    order.items.forEach((item: any) => {
        const title = item.product?.title || 'Product';
        const price = item.price;
        const total = price * item.quantity;

        doc.font('Helvetica').text(title.substring(0, 30), 50, y);
        doc.text(item.quantity.toString(), 300, y);
        doc.text(`INR ${price.toFixed(2)}`, 400, y);
        doc.text(`INR ${total.toFixed(2)}`, 500, y);
        y += 20;
    });

    // Total
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc
        .font('Helvetica-Bold')
        .text('Grand Total:', 400, y)
        .text(`INR ${order.totalAmount.toFixed(2)}`, 500, y);

    // Footer
    doc
        .fontSize(10)
        .text('Thank you for shopping with SÉRRA FASHION.', 50, 700, { align: 'center', width: 500 });

    doc.end();
};
