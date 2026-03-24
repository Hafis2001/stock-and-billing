import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const unitLabel = (unit) => {
  const map = { piece: 'pcs', kg: 'kg', g: 'g', litre: 'L', ml: 'ml', size: 'size' };
  return map[unit] || unit || 'pcs';
};

const formatQty = (qty, unit) => {
  const q = parseFloat(qty);
  const formatted = q % 1 === 0 ? q.toString() : q.toFixed(3).replace(/\.?0+$/, '');
  return `${formatted} ${unitLabel(unit)}`;
};

export const generateReceiptPDF = async (orderResult, shopProfile) => {
  try {
  const { orderId, totalAmount, cartAtCheckout, customerName, paymentType } = orderResult;
  const dateStr = new Date().toLocaleString('en-IN');

    let itemsHtml = '';
    cartAtCheckout.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.name}</td>
          <td style="text-align:center">${formatQty(item.quantity, item.unit)}</td>
          <td style="text-align:right">₹${parseFloat(item.selling_price).toFixed(2)}</td>
          <td style="text-align:right">₹${(parseFloat(item.quantity) * parseFloat(item.selling_price)).toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; font-size: 14px; }
            .header { text-align: center; margin-bottom: 16px; }
            .shop-name { font-size: 22px; font-weight: bold; color: #4F46E5; }
            .shop-sub { font-size: 13px; color: #6B7280; margin-top: 4px; }
            .divider-dash { border: none; border-top: 2px dashed #d1d5db; margin: 14px 0; }
            .divider-solid { border: none; border-top: 2px solid #1f2937; margin: 8px 0; }
            .meta { font-size: 13px; color: #374151; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 8px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 10px 4px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .total-row td { font-weight: bold; font-size: 17px; border-bottom: none; padding-top: 12px; }
            .footer { text-align: center; font-size: 13px; color: #9CA3AF; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">${shopProfile?.shop_name || 'My Shop'}</div>
            <div class="shop-sub">📞 ${shopProfile?.phone || ''}  ${shopProfile?.gst_number ? `| GST: ${shopProfile.gst_number}` : ''}</div>
          </div>
          
          <hr class="divider-dash" />
          
          <div class="meta"><b>Order #${orderId}</b></div>
          <div class="meta">${dateStr}</div>
          <div class="meta">Customer: ${customerName || 'Walk-in'}</div>
          <div class="meta">Payment: <b>${paymentType || 'Cash'}</b></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Rate</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align:right; padding-right: 8px; color: #4F46E5;">TOTAL</td>
                <td style="text-align:right; color: #4F46E5;">₹${parseFloat(totalAmount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <hr class="divider-dash" />
          
          <div class="footer">Thank you for shopping with us! 🙏</div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error generating receipt:', error);
  }
};

export const generateCombinedBillsPDF = async (orders, shopProfile) => {
  try {
    const dateStr = new Date().toLocaleString('en-IN');
    let totalAll = 0;
    let itemsHtml = '';
    
    orders.forEach(order => {
      totalAll += parseFloat(order.total_amount);
      itemsHtml += `
        <tr>
          <td>#${order.id}</td>
          <td>${order.customer_name || 'Walk-in'}</td>
          <td>${order.payment_type}</td>
          <td style="text-align:right">₹${parseFloat(order.total_amount).toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 10px; border-bottom: 2px solid #4F46E5; background: #f8fafc; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total-row { font-weight: bold; background: #f8fafc; font-size: 18px; }
            .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Bills Summary Report</div>
            <div>${shopProfile?.shop_name || 'My Shop'}</div>
            <div style="font-size: 13px; color: #666;">Generated on: ${dateStr}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Mode</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3" style="text-align:right">GRAND TOTAL</td>
                <td style="text-align:right">₹${totalAll.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">Detailed summary of ${orders.length} shared bills.</div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error generating combined PDF:', error);
    return false;
  }
};
