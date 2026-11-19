/**
 * OM TAILOR - Payment Service
 * File: assets/js/services/payment-service.js
 * 
 * Handles order billing, advance payments, balance tracking, and invoice receipts.
 */

const PaymentService = {
    /**
     * Record a payment transaction
     */
    async recordPayment(orderId, amount, paymentMethod = 'Cash') {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client) {
            try {
                const { data, error } = await client.from('payments').insert([
                    { order_id: orderId, amount, method: paymentMethod, paid_at: new Date() }
                ]);
                if (error) throw error;
                return { success: true, payment: data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        console.log(`Payment of Rs. ${amount} recorded via ${paymentMethod} for Order ${orderId}`);
        return { success: true, local: true, amount, method: paymentMethod };
    },

    /**
     * Generate WhatsApp receipt message text
     */
    generateReceiptMessage(order) {
        return encodeURIComponent(
            `*🧾 OM TAILOR - ORDER RECEIPT*\n` +
            `--------------------------------\n` +
            `Order No: *${order.order_number}*\n` +
            `Customer: ${order.customer_name}\n` +
            `Item: ${order.dress_type}\n` +
            `Total: Rs. ${order.total_amount}\n` +
            `Advance Paid: Rs. ${order.advance_paid}\n` +
            `Balance Due: Rs. ${order.balance_due}\n` +
            `Delivery Date: *${order.delivery_date}*\n` +
            `Status: ${order.status.toUpperCase()}\n` +
            `--------------------------------\n` +
            `Thank you for trusting OM Tailor, Nagwa Birgunj!`
        );
    }
};

if (typeof window !== 'undefined') {
    window.PaymentService = PaymentService;
}
