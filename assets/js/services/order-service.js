/**
 * OM TAILOR - Order Service
 * File: assets/js/services/order-service.js
 * 
 * Manages order creation, order tracking status updates, and live queries.
 */

const ORDER_STATUSES = [
    { key: 'measurement', label: 'Measurement Taken', icon: 'fa-ruler-combined' },
    { key: 'cutting', label: 'Pattern Cutting', icon: 'fa-cut' },
    { key: 'stitching', label: 'In Stitching', icon: 'fa-tape' },
    { key: 'finishing', label: 'Ironing & Quality Check', icon: 'fa-check-double' },
    { key: 'ready', label: 'Ready for Pickup', icon: 'fa-box-open' },
    { key: 'delivered', label: 'Delivered', icon: 'fa-user-check' }
];

function getMissingSupabaseColumn(errorMessage) {
    const message = String(errorMessage || '');
    const match = message.match(/(?:Could not find the ['"]([^'"]+)['"] column|Could not find ['"]([^'"]+)['"] column|column\s+[\w.]+\.([\w]+)\s+does not exist)/i);
    return match ? (match[1] || match[2] || match[3] || '') : '';
}

async function getNextOrderNumber(client) {
    const year = new Date().getFullYear();
    const prefix = `OM-${year}-`;
    let maxSequence = Number(localStorage.getItem(`om_order_sequence_${year}`)) || 0;
    const consider = order => {
        const number = String(order.order_number || order.order_code || '');
        const match = number.match(new RegExp(`^OM-${year}-(\\d+)$`, 'i'));
        if (match) maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
    };
    JSON.parse(localStorage.getItem('om_local_orders') || '[]').forEach(consider);
    if (client) {
        try {
            const { data, error } = await client.from('orders').select('*');
            if (!error && data) data.forEach(consider);
        } catch (err) {
            console.warn('Could not read existing order sequence; using local sequence:', err.message);
        }
    }
    const next = maxSequence + 1;
    localStorage.setItem(`om_order_sequence_${year}`, String(next));
    return `${prefix}${String(next).padStart(4, '0')}`;
}

const OrderService = {
    STATUSES: ORDER_STATUSES,

    /**
     * Get customer profile and all order history by phone or order number
     */
    async getCustomerProfileAndOrders(query) {
        const cleanQuery = String(query || '').trim();
        const normalizedQuery = cleanQuery.toLowerCase();
        const queryDigits = cleanQuery.replace(/\D/g, '');
        const client = window.getSupabase ? window.getSupabase() : null;

        let allOrders = [];

        // Phone numbers live in customers.mobile; orders link through customer_id.
        if (client) {
            try {
                const [ordersResult, customersResult] = await Promise.all([
                    client.from('orders').select('*'),
                    client.from('customers').select('id,full_name,mobile')
                ]);
                if (ordersResult.error) throw ordersResult.error;
                const customers = customersResult.error ? [] : (customersResult.data || []);
                const customersById = new Map(customers.map(customer => [customer.id, customer]));
                const matchingCustomerIds = new Set(customers.filter(customer => {
                    const mobile = String(customer.mobile || '').replace(/\D/g, '');
                    return queryDigits.length >= 4 && mobile.includes(queryDigits);
                }).map(customer => customer.id));

                allOrders = (ordersResult.data || []).map(order => {
                    const customer = customersById.get(order.customer_id);
                    return {
                        ...order,
                        order_number: order.order_number || order.order_code || '',
                        customer_name: order.customer_name || customer?.full_name || 'Customer',
                        phone: order.phone || customer?.mobile || ''
                    };
                }).filter(order => {
                    const orderNumber = String(order.order_number || order.order_code || '');
                    const orderDigits = orderNumber.replace(/\D/g, '');
                    return orderNumber.toLowerCase().includes(normalizedQuery) ||
                        (queryDigits.length >= 4 && orderDigits.endsWith(queryDigits)) ||
                        String(order.customer_name || '').toLowerCase().includes(normalizedQuery) ||
                        (queryDigits.length >= 4 && String(order.phone || '').replace(/\D/g, '').includes(queryDigits)) ||
                        matchingCustomerIds.has(order.customer_id);
                }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            } catch (err) {
                console.warn('Supabase lookup notice:', err.message);
            }
        }

        // 2. Fetch from Local Storage
        const localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        const matchedLocal = localOrders.filter(order => {
            const orderNumber = String(order.order_number || order.order_code || '');
            const orderDigits = orderNumber.replace(/\D/g, '');
            return (queryDigits.length >= 4 && String(order.phone || '').replace(/\D/g, '').includes(queryDigits)) ||
                orderNumber.toLowerCase().includes(normalizedQuery) ||
                (queryDigits.length >= 4 && orderDigits.endsWith(queryDigits)) ||
                String(order.customer_name || '').toLowerCase().includes(normalizedQuery);
        });

        matchedLocal.forEach(lo => {
            if (!allOrders.some(o => o.order_number === lo.order_number)) {
                allOrders.push(lo);
            }
        });

        if (allOrders.length === 0) {
            return { success: false, error: 'No orders found matching this number or Order ID.' };
        }

        // Pull full history for this customer's phone
        const primaryPhone = allOrders[0].phone;
        if (primaryPhone) {
            localOrders.forEach(lo => {
                if (lo.phone === primaryPhone && !allOrders.some(o => o.order_number === lo.order_number)) {
                    allOrders.push(lo);
                }
            });
        }

        // Pick latest order as primary
        const primaryOrder = allOrders[0];

        return {
            success: true,
            customer_name: primaryOrder.customer_name || 'Customer',
            phone: primaryOrder.phone || cleanQuery,
            selectedOrder: primaryOrder,
            orders: allOrders,
            measurements: primaryOrder.measurements || {}
        };
    },

    /**
     * Get order details by tracking code / Order ID or phone
     */
    async getOrderByTracking(query) {
        const profile = await this.getCustomerProfileAndOrders(query);
        if (profile.success && profile.selectedOrder) {
            return { success: true, order: profile.selectedOrder, allOrders: profile.orders, customer_name: profile.customer_name };
        }

        // Demo fallback order for demonstration
        const mockOrder = {
            id: 'ord-8891',
            order_number: query.toUpperCase().startsWith('OM-') ? query.toUpperCase() : 'OM-2026-8891',
            customer_name: 'Pintu Kumar',
            phone: '9807216628',
            dress_type: '3-Piece Italian Coat Pant',
            fabric: 'Raymond Royal Wool (Navy Blue)',
            booking_date: '02 Nov 2026',
            trial_date: '09 Nov 2026',
            delivery_date: '12 Nov 2026',
            status: 'stitching',
            total_amount: 8500,
            advance_paid: 5000,
            balance_due: 3500,
            notes: 'Peak lapel, double slit back, brass buttons'
        };

        return { success: true, order: mockOrder, allOrders: [mockOrder], customer_name: mockOrder.customer_name };
    },

    /**
     * Create a new order (with customer and measurements entered by Tailor)
     */
    async createOrder(orderData) {
        const client = window.getSupabase ? window.getSupabase() : null;
        const orderNumber = await getNextOrderNumber(client);

        // orders.customer_id is required by the database. Resolve the customer
        // by phone first so repeat customers keep the same customer record.
        let customerId = orderData.customer_id || null;
        let supabaseErrorMsg = null;
        if (client && !customerId) {
            const phone = String(orderData.phone || '').trim();
            if (!phone) {
                supabaseErrorMsg = 'Customer phone number is required to link this order to a customer.';
            } else {
                try {
                    // Customer schemas vary between deployments. Discover the
                    // contact column from common names without assuming `phone`.
                    let customerContactColumn = null;
                    for (const column of ['phone', 'mobile', 'mobile_number', 'phone_number']) {
                        const lookup = await client.from('customers').select('id').eq(column, phone).maybeSingle();
                        if (!lookup.error) {
                            customerContactColumn = column;
                            customerId = lookup.data?.id || null;
                            break;
                        }
                        const missingColumn = getMissingSupabaseColumn(lookup.error.message);
                        if (missingColumn && missingColumn.toLowerCase() === column) continue;
                        throw lookup.error;
                    }

                    if (!customerId) {
                        if (!customerContactColumn) throw new Error('Could not find a supported customer contact column (phone, mobile, mobile_number, phone_number).');
                        const created = await client.from('customers').insert([{
                            full_name: orderData.customer_name,
                            [customerContactColumn]: phone
                        }]).select('id').single();
                        if (created.error) throw created.error;
                        customerId = created.data?.id || null;
                    }
                    if (!customerId) throw new Error('Customer record was not returned by Supabase.');
                } catch (err) {
                    supabaseErrorMsg = `Could not link customer: ${err.message || err}`;
                    console.error('❌ Supabase Customer Error:', err);
                }
            }
        }
        
        // Payload formatted for Supabase table
        const supabasePayload = {
            ...(customerId ? { customer_id: customerId } : {}),
            order_number: orderNumber,
            order_code: orderNumber,
            customer_name: orderData.customer_name,
            phone: orderData.phone,
            country_code: orderData.country_code || (orderData.phone?.startsWith('91') ? '91' : '977'),
            dress_type: orderData.dress_type,
            fabric: orderData.fabric || 'Customer Cloth',
            delivery_date: orderData.delivery_date,
            total_amount: parseFloat(orderData.total_amount) || 0,
            advance_paid: parseFloat(orderData.advance_paid) || 0,
            balance_due: (parseFloat(orderData.total_amount) || 0) - (parseFloat(orderData.advance_paid) || 0),
            status: orderData.status || 'measurement',
            notes: orderData.notes || '',
            measurements: orderData.measurements || {}
        };

        let supabaseSuccess = false;
        let measurementsSaved = false;
        let measurementErrorMsg = null;

        // 1. Try saving to Supabase
        if (client && !supabaseErrorMsg) {
            try {
                console.log('📤 Sending order to Supabase "orders" table:', supabasePayload);
                let insertPayload = { ...supabasePayload };
                let data = null;
                let error = null;

                for (let attempt = 0; attempt < 12; attempt++) {
                    const result = await client.from('orders').insert([insertPayload]).select();
                    data = result.data;
                    error = result.error;
                    if (!error) break;

                    const missingColumn = getMissingSupabaseColumn(error.message);
                    if (!missingColumn || !(missingColumn in insertPayload)) break;

                    console.warn(`Supabase column "${missingColumn}" is not available; retrying without it.`);
                    delete insertPayload[missingColumn];
                }

                if (error) {
                    supabaseErrorMsg = error.message || JSON.stringify(error);
                    console.error('❌ Supabase Insert Error:', error);
                } else if (data && data.length > 0) {
                    supabaseSuccess = true;
                    console.log('✅ Order successfully saved to Supabase:', data[0]);
                }
            } catch (err) {
                supabaseErrorMsg = err.message;
                console.error('❌ Supabase Exception:', err);
            }
        } else if (!client) {
            supabaseErrorMsg = 'Supabase client not initialized';
            console.warn('⚠️ Supabase client is not ready.');
        }

        // Measurements have their own table; saving them only inside the
        // orders row does not populate public.measurements.
        const measurementValues = orderData.measurements || {};
        const hasMeasurements = Object.values(measurementValues).some(value => String(value ?? '').trim() !== '');
        if (client && customerId && hasMeasurements) {
            try {
                const result = await client.from('measurements').insert([{
                    customer_id: customerId,
                    garment_type: orderData.dress_type || 'General',
                    measurements: measurementValues,
                    notes: orderData.notes || ''
                }]);
                if (result.error) throw result.error;
                measurementsSaved = true;
            } catch (err) {
                measurementErrorMsg = err.message || String(err);
                console.error('❌ Supabase Measurement Insert Error:', err);
            }
        }

        const localRecord = {
            id: 'ord-' + Date.now(),
            ...supabasePayload,
            created_at: new Date().toISOString()
        };

        // 2. Persist locally in browser storage
        let localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        localOrders.unshift(localRecord);
        localStorage.setItem('om_local_orders', JSON.stringify(localOrders));

        return { 
            success: true, 
            supabaseSaved: supabaseSuccess,
            supabaseError: supabaseErrorMsg,
            measurementsSaved,
            measurementError: measurementErrorMsg,
            order: localRecord 
        };
    },

    /**
     * Update order status (Admin operation) with delivery timestamp & payment method
     */
    async updateOrderStatus(orderId, newStatus, extraData = {}) {
        const client = window.getSupabase ? window.getSupabase() : null;
        
        const updateFields = {
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...extraData
        };

        if (newStatus === 'delivered' && !updateFields.delivered_at) {
            updateFields.delivered_at = new Date().toISOString();
        }

        if (client) {
            try {
                let updatePayload = { ...updateFields };
                for (let attempt = 0; attempt < 12; attempt++) {
                    let result = await client
                        .from('orders')
                        .update(updatePayload)
                        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
                    if (result.error && /order_number/i.test(result.error.message || '')) {
                        result = await client
                            .from('orders')
                            .update(updatePayload)
                            .or(`id.eq.${orderId},order_code.eq.${orderId}`);
                    }
                    if (!result.error) break;

                    const missingColumn = getMissingSupabaseColumn(result.error.message);
                    if (!missingColumn || !(missingColumn in updatePayload)) {
                        console.warn('Supabase status update notice:', result.error.message);
                        break;
                    }
                    console.warn(`Supabase column "${missingColumn}" is not available; retrying status update without it.`);
                    delete updatePayload[missingColumn];
                }
            } catch (err) {
                console.warn('Supabase status update notice:', err.message);
            }
        }

        // Update in localStorage
        let localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        localOrders = localOrders.map(o => {
            if (o.id === orderId || o.order_number === orderId) {
                return { ...o, ...updateFields };
            }
            return o;
        });
        localStorage.setItem('om_local_orders', JSON.stringify(localOrders));

        console.log(`Updated Order ${orderId} status to: ${newStatus}`, updateFields);
        return { success: true, updatedStatus: newStatus, details: updateFields };
    },

    /**
     * List all recent orders (for Admin Dashboard)
     */
    async getAllOrders() {
        const localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        const client = window.getSupabase ? window.getSupabase() : null;
        
        let dbOrders = [];
        if (client) {
            try {
                const [ordersResult, customersResult] = await Promise.all([
                    client.from('orders').select('*').order('created_at', { ascending: false }),
                    client.from('customers').select('id,full_name,mobile')
                ]);
                if (!ordersResult.error && ordersResult.data) {
                    const customers = customersResult.error ? [] : (customersResult.data || []);
                    const customersById = new Map(customers.map(customer => [customer.id, customer]));
                    dbOrders = ordersResult.data.map(order => {
                        const customer = customersById.get(order.customer_id);
                        return {
                            ...order,
                            customer_name: order.customer_name || customer?.full_name || 'Customer',
                            phone: order.phone || customer?.mobile || ''
                        };
                    });
                }
            } catch (err) {
                console.warn('Fetching Supabase orders notice:', err.message);
            }
        }

        if (dbOrders.length > 0 || localOrders.length > 0) {
            // Merge unique orders
            const all = [...localOrders];
            dbOrders.forEach(dbo => {
                const normalized = {
                    ...dbo,
                    order_number: dbo.order_number || dbo.order_code || ''
                };
                if (!all.some(o => o.order_number === normalized.order_number)) all.push(normalized);
            });
            return { success: true, orders: all };
        }

        return { success: true, orders: [] };
    },

    async updateCustomerOrders(originalPhone, originalName, updates, orderNumber = null) {
        const client = window.getSupabase ? window.getSupabase() : null;
        let localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        let cloudMatchingOrders = [];

        if (client) {
            try {
                let query = client.from('orders').select('*');
                if (orderNumber) {
                    query = query.eq('order_number', orderNumber);
                } else if (originalPhone) {
                    query = query.eq('phone', originalPhone);
                } else {
                    query = query.eq('customer_name', originalName);
                }
                const { data } = await query;
                cloudMatchingOrders = data || [];
            } catch (err) {
                console.warn('Fetching customer record before update notice:', err.message);
            }
        }

        localOrders = localOrders.map(order => {
            const matches = (originalPhone && order.phone === originalPhone) ||
                (!originalPhone && order.customer_name === originalName);
            if (!matches) return order;
            const identityUpdates = {};
            ['customer_name', 'phone', 'country_code', 'city', 'address'].forEach(key => {
                if (key in updates) identityUpdates[key] = updates[key];
            });
            const isSelectedOrder = !orderNumber || order.order_number === orderNumber;
            const orderUpdates = isSelectedOrder ? updates : identityUpdates;
            return { ...order, ...orderUpdates, updated_at: new Date().toISOString() };
        });

        // Cloud-only records have no local copy. Add/update a local mirror so the
        // dashboard immediately shows saved changes even when Supabase is slow or offline.
        cloudMatchingOrders.forEach(cloudOrder => {
            const newRecord = { ...cloudOrder, ...updates, updated_at: new Date().toISOString() };
            const index = localOrders.findIndex(order =>
                order.order_number === cloudOrder.order_number ||
                (cloudOrder.id && order.id === cloudOrder.id)
            );
            if (index >= 0) {
                localOrders[index] = { ...localOrders[index], ...newRecord };
            } else {
                localOrders.unshift(newRecord);
            }
        });
        localStorage.setItem('om_local_orders', JSON.stringify(localOrders));

        if (client && updates.phone) {
            try {
                let updatePayload = { ...updates };
                let error = null;

                for (let attempt = 0; attempt < 12; attempt++) {
                    const cloudFilter = orderNumber
                        ? client.from('orders').update(updatePayload).eq('order_number', orderNumber)
                        : client.from('orders').update(updatePayload).eq('phone', originalPhone);
                    let result = await cloudFilter;
                    if (result.error && /order_number/i.test(result.error.message || '') && orderNumber) {
                        result = await client.from('orders').update(updatePayload).eq('order_code', orderNumber);
                    }
                    error = result.error;
                    if (!error) break;

                    const missingColumn = getMissingSupabaseColumn(error.message);
                    if (!missingColumn || !(missingColumn in updatePayload)) break;

                    console.warn(`Supabase column "${missingColumn}" is not available; retrying update without it.`);
                    delete updatePayload[missingColumn];
                }

                if (error) throw new Error(error.message || JSON.stringify(error));
            } catch (err) {
                console.warn('Customer cloud update notice:', err.message);
            }
        }
        return { success: true };
    },

    async deleteCustomerOrders(phone, name) {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client) {
            try {
                let customerId = null;
                if (phone) {
                    const customerResult = await client.from('customers')
                        .select('id')
                        .eq('mobile', phone)
                        .maybeSingle();
                    if (customerResult.error) throw customerResult.error;
                    customerId = customerResult.data?.id || null;
                }

                const result = customerId
                    ? await client.from('orders').delete().eq('customer_id', customerId)
                    : await client.from('orders').delete().eq('customer_name', name);
                if (result.error) return { success: false, error: result.error.message };
            } catch (err) {
                console.warn('Customer cloud delete notice:', err.message);
                return { success: false, error: err.message || 'Supabase delete failed.' };
            }
        }

        const localOrders = JSON.parse(localStorage.getItem('om_local_orders') || '[]');
        const remainingOrders = localOrders.filter(order =>
            !((phone && order.phone === phone) || (!phone && order.customer_name === name))
        );
        localStorage.setItem('om_local_orders', JSON.stringify(remainingOrders));
        return { success: true };
    },

    /**
     * Feature 1: Generate pre-formatted WhatsApp Live Status Alert
     */
    generateStatusWhatsAppLink(order, customStatus = null) {
        const status = (customStatus || order.status || 'measurement').toLowerCase();
        const custName = order.customer_name || 'Customer';
        const dress = order.dress_type || 'Garment';
        const orderNo = order.order_number || '';
        const phone = (order.phone || '').replace(/\D/g, '');
        const countryCode = order.country_code || (phone.startsWith('91') ? '91' : '977');
        const localPhone = phone.startsWith(countryCode) ? phone.slice(countryCode.length) : phone;
        
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
        const trackUrl = `${origin}/customer/tracking.html?order=${orderNo || phone}`;

        let statusText = '';
        switch(status) {
            case 'measurement':
                statusText = `📏 नमस्ते ${custName} जी! OM Tailor में आपका आर्डर *${orderNo}* (${dress}) का नाप सफलतापूर्वक दर्ज हो चुका है। टारगेट डिलीवरी: *${order.delivery_date}*।`;
                break;
            case 'cutting':
                statusText = `✂️ नमस्ते ${custName} जी! आपके कपड़े *${dress}* (Order: *${orderNo}*) का पैटर्न कटिंग मास्टरजी द्वारा शुरू कर दिया गया है। टारगेट डिलीवरी: *${order.delivery_date}*।`;
                break;
            case 'stitching':
                statusText = `🪡 नमस्ते ${custName} जी! आपके कपड़े *${dress}* (Order: *${orderNo}*) की सिलाई हमारे मास्टर कारीगरों द्वारा जारी है।`;
                break;
            case 'finishing':
                statusText = `✨ नमस्ते ${custName} जी! आपके कपड़े *${dress}* (Order: *${orderNo}*) की आयरनिंग व क्वालिटी फिनिशिंग चल रही है। यह जल्द तैयार हो जाएगा!`;
                break;
            case 'ready':
                statusText = `🎉 नमस्ते ${custName} जी! आपका *${dress}* (Order: *${orderNo}*) पूरी तरह सिलकर तैयार है! आप ट्रायल या डिलीवरी लेने के लिए OM Tailor (Nagwa, Birgunj) पधार सकते हैं। बाक़ी देय: Rs. ${order.balance_due || 0}।`;
                break;
            case 'delivered':
                statusText = `✨ नमस्ते ${custName} जी! आपका आर्डर *${orderNo}* सफलता से डिलीवर हो चुका है। OM Tailor चुनने के लिए हार्दिक धन्यवाद। Please visit again! 🙏`;
                break;
            default:
                statusText = `नमस्ते ${custName} जी! आपके आर्डर *${orderNo}* (${dress}) का नया स्टेटस: *${status.toUpperCase()}* है।`;
        }

        const fullMsg = 
            `*OM TAILOR - ORDER STATUS UPDATE*\n` +
            `-----------------------------------\n` +
            `${statusText}\n\n` +
            `📱 लाइव स्टेटस ट्रैक करें:\n${trackUrl}\n` +
            `-----------------------------------\n` +
            `📍 Nagwa, Birgunj | 📞 +977-9807216628`;

        return `https://wa.me/${countryCode}${localPhone}?text=${encodeURIComponent(fullMsg)}`;
    },

    /**
     * Feature: Delivery Due Reminder (1-Day Left Alert WhatsApp link)
     */
    generateDeliveryReminderWhatsAppLink(order) {
        const custName = order.customer_name || 'Customer';
        const dress = order.dress_type || 'Garment';
        const orderNo = order.order_number || '';
        const phone = (order.phone || '').replace(/\D/g, '');
        const countryCode = order.country_code || (phone.startsWith('91') ? '91' : '977');
        const localPhone = phone.startsWith(countryCode) ? phone.slice(countryCode.length) : phone;
        const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
        const trackUrl = `${origin}/customer/tracking.html?order=${orderNo || phone}`;

        const msg = 
            `*OM TAILOR - DELIVERY REMINDER ⏰*\n` +
            `-----------------------------------\n` +
            `नमस्ते ${custName} जी! 🙏\n\n` +
            `OM Tailor (Nagwa, Birgunj) से विनम्र सूचना:\n` +
            `आपके कपड़े *${dress}* (Order: *${orderNo}*) की डिलीवरी कल (*${order.delivery_date}*) को शेड्यूल्ड है।\n\n` +
            `बाक़ी देय राशि: Rs. ${order.balance_due || 0}\n` +
            `📱 लाइव स्टेटस ट्रैक करें:\n${trackUrl}\n` +
            `-----------------------------------\n` +
            `कृपया कल अपनी सुविधानुसार शॉप पर पधारें। यदि कोई बदलाव हो तो हमें यहाँ रिप्लाई करें।\n` +
            `📍 Nagwa, Birgunj | 📞 +977-9807216628`;

        return `https://wa.me/${countryCode}${localPhone}?text=${encodeURIComponent(msg)}`;
    },

    /**
     * Calculate days remaining until delivery
     * Returns: 1 (Tomorrow), 0 (Today), <0 (Overdue), >1 (Upcoming)
     */
    getDaysUntilDelivery(deliveryDateStr) {
        if (!deliveryDateStr) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let target = new Date(deliveryDateStr);
        if (Number.isNaN(target.getTime())) {
            // Try standard parts parsing if date has format like "12-11-2026" or "12 Nov 2026"
            target = new Date(deliveryDateStr.replace(/-/g, '/'));
        }
        if (Number.isNaN(target.getTime())) return null;

        const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const diffTime = targetDay.getTime() - today.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * VIP Member Decision: Admin Decides VIP Tiers
     */
    getAdminVipTier(phone, customerName = null) {
        try {
            const map = JSON.parse(localStorage.getItem('om_admin_vip_members') || '{}');
            const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
            const normName = customerName ? String(customerName).trim().toLowerCase() : '';
            
            if (normName && cleanPhone && map[`${normName}_${cleanPhone}`]) {
                return map[`${normName}_${cleanPhone}`];
            }
            if (cleanPhone && map[cleanPhone]) {
                return map[cleanPhone];
            }
            if (normName && map[normName]) {
                return map[normName];
            }
            return 'none';
        } catch (e) {
            return 'none';
        }
    },

    setAdminVipTier(phone, tier, customerName = null) {
        try {
            const map = JSON.parse(localStorage.getItem('om_admin_vip_members') || '{}');
            const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
            const normName = customerName ? String(customerName).trim().toLowerCase() : '';
            
            if (normName && cleanPhone) {
                map[`${normName}_${cleanPhone}`] = tier;
            }
            if (cleanPhone) {
                map[cleanPhone] = tier;
            }
            if (normName) {
                map[normName] = tier;
            }
            localStorage.setItem('om_admin_vip_members', JSON.stringify(map));
            return true;
        } catch (e) {
            console.error('Failed to set VIP tier:', e);
            return false;
        }
    },

    /**
     * Feature 6: VIP Loyalty Club & Reward Points
     * NOTE: As per Masterji's requirement, VIP status is decided directly by Admin!
     */
    calculateVipData(orderCount = 1, phone = null, customerName = null) {
        const count = parseInt(orderCount) || 1;
        const adminTier = this.getAdminVipTier(phone, customerName);

        if (adminTier === 'gold') {
            return {
                isVip: true,
                tier: 'Gold Royalty VIP',
                badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/50',
                points: Math.max(200, count * 50),
                voucherCode: 'OM-GOLD15',
                voucherDiscount: 'FLAT 15% OFF on Next Bespoke Suit',
                perks: [
                    '⚡ Priority 24h Express Workshop Queue',
                    '✂️ Free Lifetime Minor Alterations & Ironing',
                    '🎁 15% VIP Discount on All Wedding Functions'
                ]
            };
        } else if (adminTier === 'silver') {
            return {
                isVip: true,
                tier: 'Silver VIP Member',
                badgeClass: 'bg-slate-300/20 text-slate-200 border border-slate-400/50',
                points: Math.max(100, count * 50),
                voucherCode: 'OM-SILVER200',
                voucherDiscount: 'FLAT ₹200 OFF on Next Order',
                perks: [
                    '✂️ Free Fitting Alterations within 60 days',
                    '🧵 Free Premium Lining & Button Upgrade',
                    '🎟️ ₹200 Discount Voucher Unlocked'
                ]
            };
        } else if (adminTier === 'bronze') {
            return {
                isVip: true,
                tier: 'Bronze Club Member',
                badgeClass: 'bg-amber-700/20 text-amber-500 border border-amber-600/50',
                points: 50,
                voucherCode: 'OM-NEW10',
                voucherDiscount: '10% Welcome Discount Voucher',
                perks: [
                    '📐 Digital Naap Locker Lifetime Secure Storage',
                    '🎁 Earn 50 Points on Every Stitching Order',
                    '📱 Live Order Tracker & WhatsApp Notifications'
                ]
            };
        } else {
            // Regular customer (Admin has not assigned VIP status)
            return {
                isVip: false,
                tier: 'Regular Customer',
                badgeClass: 'bg-neutral-800 text-gray-400 border border-neutral-700',
                points: count * 20,
                voucherCode: null,
                voucherDiscount: null,
                perks: []
            };
        }
    }
};

if (typeof window !== 'undefined') {
    window.OrderService = OrderService;
}
