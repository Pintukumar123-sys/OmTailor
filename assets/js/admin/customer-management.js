/**
 * OM TAILOR - Customer Management (Admin)
 * File: assets/js/admin/customer-management.js
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadCustomerList();

    const searchInput = document.getElementById('customerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterCustomers(e.target.value));
    }
});

async function loadCustomerList() {
    const listContainer = document.getElementById('customerListContainer');
    if (!listContainer) return;

    // Get orders from OrderService to list all real registered customers
    const ordersRes = await window.OrderService.getAllOrders();
    const orders = ordersRes.orders || [];

    // Extract unique customer fitting profiles by Name + Phone
    // Ensures separate fitting cards even if customers share a phone number or household!
    const customerMap = new Map();

    orders.forEach(order => {
        const normName = (order.customer_name || '').trim().toLowerCase();
        const normPhone = (order.phone || '').trim().replace(/\D/g, '');
        
        // Key by Name and Phone so distinct people are never accidentally merged
        const key = normName ? (normPhone ? `${normName}__${normPhone}` : normName) : (normPhone || order.order_number);
        if (!key) return;

        if (!customerMap.has(key)) {
            customerMap.set(key, {
                name: order.customer_name || 'Customer',
                phone: order.phone || '',
                latest_dress: order.dress_type,
                latest_order_number: order.order_number,
                latest_order: order,
                total_orders: 1
            });
        } else {
            const existing = customerMap.get(key);
            existing.total_orders += 1;
            if (order.dress_type) {
                existing.latest_dress = order.dress_type;
                existing.latest_order_number = order.order_number;
                existing.latest_order = order;
            }
        }
    });

    const customers = Array.from(customerMap.values());

    if (customers.length === 0) {
        listContainer.innerHTML = '<div class="text-center py-6 text-gray-500 text-xs">No customer measurements recorded yet. Click "+ New Order & Naap" above to add one.</div>';
        return;
    }

    listContainer.innerHTML = customers.map(cust => {
        const vipTier = window.OrderService.getAdminVipTier ? window.OrderService.getAdminVipTier(cust.phone, cust.name) : 'none';

        return `
        <div class="admin-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 customer-item" data-search="${(cust.name || '').toLowerCase()} ${cust.phone || ''} ${cust.latest_order_number || ''}">
            <div>
                <div class="font-bold text-base text-white flex items-center gap-2">
                    ${cust.name}
                    <span class="text-[10px] bg-neutral-800 text-amber-400 border border-neutral-700 px-2 py-0.5 rounded">${cust.latest_dress || 'Garment'}</span>
                    ${cust.total_orders > 1 ? `<span class="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">${cust.total_orders} Orders</span>` : ''}
                </div>
                <div class="text-xs text-gray-400 mt-1">
                    Phone: <span class="text-gray-200">${cust.phone || 'N/A'}</span> • Ref: <span class="text-amber-400/80 font-mono">${cust.latest_order_number}</span>
                </div>
                <!-- Admin-controlled VIP Tier -->
                <div class="flex items-center gap-2 mt-2">
                    <span class="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                        <i class="fas fa-crown text-amber-400"></i> VIP Member Status:
                    </span>
                    <select onchange="window.setCustomerVipTier('${cust.phone}', this.value, '${(cust.name || '').replace(/'/g, "\\'")}')" 
                            class="bg-[#121212] text-xs font-semibold rounded px-2.5 py-1 border ${vipTier !== 'none' ? 'border-amber-400 text-amber-400 font-bold' : 'border-neutral-700 text-gray-400'} focus:border-amber-400">
                        <option value="none" ${vipTier === 'none' ? 'selected' : ''}>Regular Customer (No VIP)</option>
                        <option value="bronze" ${vipTier === 'bronze' ? 'selected' : ''}>Bronze VIP Club (10% Off)</option>
                        <option value="silver" ${vipTier === 'silver' ? 'selected' : ''}>Silver VIP Member (₹200 Off)</option>
                        <option value="gold" ${vipTier === 'gold' ? 'selected' : ''}>Gold Royalty VIP (15% Off)</option>
                    </select>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <button onclick="viewOrderNaap('${cust.latest_order_number}')" class="px-3.5 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-semibold hover:bg-amber-500 hover:text-black transition flex items-center gap-1.5">
                    <i class="fas fa-ruler-combined"></i> View Naap Slip
                </button>
                <button onclick="editCustomer('${cust.phone.replace(/'/g, "\\'")}', '${cust.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-500 hover:text-black transition">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteCustomer('${cust.phone.replace(/'/g, "\\'")}', '${cust.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold hover:bg-rose-500 hover:text-black transition">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${cust.phone ? `
                <a href="https://wa.me/977${cust.phone}" target="_blank" class="px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold hover:bg-green-500 hover:text-black transition flex items-center gap-1.5">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

function setCustomerVipTier(phone, tier, customerName = null) {
    if (!window.OrderService) return;
    window.OrderService.setAdminVipTier(phone, tier, customerName);
    const tierName = tier === 'none' ? 'Regular' : `${tier.toUpperCase()} VIP`;
    if (window.showAdminToast) {
        window.showAdminToast(`VIP tier updated for ${customerName || phone} to: ${tierName}! 👑`, 'success');
    }
    if (window.loadRecentOrders) window.loadRecentOrders();
    loadCustomerList();
}

window.setCustomerVipTier = setCustomerVipTier;

async function editCustomer(phone, name) {
    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const order = orders.find(o =>
        o.phone === phone && o.customer_name === name ||
        (!phone && o.customer_name === name)
    );
    if (!order) {
        showAdminToast('Customer details not found.', 'warning');
        return;
    }

    let measurements = order.measurements || {};
    if (typeof measurements === 'string') {
        try { measurements = JSON.parse(measurements); } catch (e) { measurements = {}; }
    }

    const cleanPhone = (order.phone || phone || '').replace(/\D/g, '');
    const country = order.country_code || (cleanPhone.startsWith('91') ? '91' : '977');
    const localPhone = cleanPhone.startsWith(country) ? cleanPhone.slice(country.length) : cleanPhone;
    document.getElementById('editCustomerName').value = order.customer_name || name || '';
    document.getElementById('editCustomerCountry').value = country;
    document.getElementById('editCustomerPhone').value = localPhone;
    document.getElementById('editCustomerAddress').value = order.address || order.city || '';
    document.getElementById('editCustomerDress').value = order.dress_type || '';
    document.getElementById('editCustomerFabric').value = order.fabric || '';
    const deliveryInput = document.getElementById('editCustomerDeliveryDate');
    if (/^\d{4}-\d{2}-\d{2}/.test(order.delivery_date || '')) {
        deliveryInput.value = String(order.delivery_date).slice(0, 10);
    } else if (order.delivery_date && !Number.isNaN(Date.parse(order.delivery_date))) {
        deliveryInput.value = new Date(order.delivery_date).toISOString().slice(0, 10);
    } else {
        deliveryInput.value = '';
    }
    document.getElementById('editCustomerTotal').value = order.total_amount || 0;
    document.getElementById('editCustomerAdvance').value = order.advance_paid || 0;
    document.getElementById('editCustomerDue').value = order.balance_due || 0;
    document.getElementById('editCustomerStatus').value = order.status || 'measurement';
    document.getElementById('editCustomerOrderNumber').value = order.order_number || '';
    document.getElementById('editCustomerNotes').value = order.notes || '';

    ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'collar'].forEach(key => {
        const el = document.getElementById(`editNaap${key.charAt(0).toUpperCase()}${key.slice(1)}`);
        if (el) el.value = measurements[key] || '';
    });

    document.getElementById('editCustomerForm').dataset.originalPhone = phone;
    document.getElementById('editCustomerForm').dataset.originalName = name;
    document.getElementById('editCustomerForm').dataset.orderNumber = order.order_number || '';
    document.getElementById('editCustomerModal').classList.remove('hidden');
}

function closeEditCustomerModal() {
    document.getElementById('editCustomerModal')?.classList.add('hidden');
}

document.addEventListener('submit', async (event) => {
    if (event.target?.id !== 'editCustomerForm') return;
    event.preventDefault();
    const form = event.target;
    const originalPhone = form.dataset.originalPhone || '';
    const originalName = form.dataset.originalName || '';
    const orderNumber = form.dataset.orderNumber || '';
    const country = document.getElementById('editCustomerCountry').value;
    const phone = document.getElementById('editCustomerPhone').value.trim().replace(/\D/g, '').replace(/^0/, '');
    const total = Math.max(0, parseFloat(document.getElementById('editCustomerTotal').value) || 0);
    const advance = Math.max(0, parseFloat(document.getElementById('editCustomerAdvance').value) || 0);
    let due = Math.max(0, parseFloat(document.getElementById('editCustomerDue').value) || 0);
    if (due > total) due = total;

    const updates = {
        customer_name: document.getElementById('editCustomerName').value.trim(),
        phone,
        country_code: country,
        address: document.getElementById('editCustomerAddress').value.trim(),
        city: document.getElementById('editCustomerAddress').value.trim(),
        dress_type: document.getElementById('editCustomerDress').value.trim(),
        fabric: document.getElementById('editCustomerFabric').value.trim(),
        delivery_date: document.getElementById('editCustomerDeliveryDate').value || undefined,
        total_amount: total,
        advance_paid: advance,
        balance_due: due,
        status: document.getElementById('editCustomerStatus').value,
        order_number: document.getElementById('editCustomerOrderNumber').value.trim(),
        order_code: document.getElementById('editCustomerOrderNumber').value.trim(),
        notes: document.getElementById('editCustomerNotes').value.trim(),
        measurements: {
            length: document.getElementById('editNaapLength').value.trim(),
            chest: document.getElementById('editNaapChest').value.trim(),
            waist: document.getElementById('editNaapWaist').value.trim(),
            shoulder: document.getElementById('editNaapShoulder').value.trim(),
            sleeve: document.getElementById('editNaapSleeve').value.trim(),
            collar: document.getElementById('editNaapCollar').value.trim()
        }
    };
    if (!updates.delivery_date) delete updates.delivery_date;

    const beforeUpdate = await window.OrderService.getAllOrders();
    const previousOrder = (beforeUpdate.orders || []).find(order => order.order_number === orderNumber);
    const updateRes = await window.OrderService.updateCustomerOrders(originalPhone, originalName, updates, orderNumber);
    if (updateRes.success) {
        closeEditCustomerModal();
        showAdminToast('Customer and order details updated successfully.', 'success');
        const newlyFullyPaidAndDelivered = previousOrder &&
            updates.status === 'delivered' && due === 0 &&
            (previousOrder.status !== 'delivered' || (parseFloat(previousOrder.balance_due) || 0) > 0);
        if (newlyFullyPaidAndDelivered && window.sendAutomaticWhatsAppNotification) {
            const notice = await window.sendAutomaticWhatsAppNotification({ ...previousOrder, ...updates }, 'delivered_paid');
            showAdminToast(notice.success
                ? 'Payment complete. WhatsApp notification accepted.'
                : `Payment updated, but WhatsApp failed: ${notice.error}`, notice.success ? 'success' : 'warning');
        }
        await loadCustomerList();
        await window.loadRecentOrders?.();
    }
});

async function deleteCustomer(phone, name) {
    if (!confirm(`Delete all data and orders for ${name}? This cannot be undone.`)) return;
    const res = await window.OrderService.deleteCustomerOrders(phone, name);
    if (res.success) {
        showAdminToast(`Customer data deleted: ${name}`, 'success');
        await loadCustomerList();
        await window.loadRecentOrders?.();
    } else {
        showAdminToast(`Delete failed: ${res.error}`, 'error');
        alert(`Delete failed in Supabase:\n\n${res.error}\n\nCheck the orders table delete policy (RLS).`);
    }
}

window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.closeEditCustomerModal = closeEditCustomerModal;

function filterCustomers(query) {
    const items = document.querySelectorAll('.customer-item');
    const term = query.toLowerCase().trim();
    items.forEach(item => {
        const text = item.getAttribute('data-search') || '';
        item.style.display = text.includes(term) ? '' : 'none';
    });
}

// Reload customers when order is created
window.loadCustomerList = loadCustomerList;
