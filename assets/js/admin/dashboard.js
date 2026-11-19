/**
 * OM TAILOR - Admin Dashboard Logic
 * File: assets/js/admin/dashboard.js
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session verification
    if (window.AuthService && !window.AuthService.getAdminSession()) {
        // Redirect to login if unauthenticated
        window.location.href = 'login.html';
        return;
    }

    // 2. Load dashboard data
    await checkDatabaseStatus();
    await loadDashboardStats();
    await loadRecentOrders();

    // 3. Search and filter listeners
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterOrdersTable(e.target.value));
    }
});

async function loadDashboardStats() {
    const ordersRes = await window.OrderService.getAllOrders();
    const orders = ordersRes.orders || [];

    const totalOrdersEl = document.getElementById('statTotalOrders');
    const inProgressEl = document.getElementById('statInProgress');
    const readyEl = document.getElementById('statReady');
    const revenueEl = document.getElementById('statRevenue');

    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    if (inProgressEl) inProgressEl.textContent = orders.filter(o => ['cutting', 'stitching', 'finishing'].includes(o.status)).length;
    if (readyEl) readyEl.textContent = orders.filter(o => o.status === 'ready').length;
    
    const totalRev = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    if (revenueEl) revenueEl.textContent = `₹${totalRev.toLocaleString()}`;
}

let allDashboardOrders = [];
let currentOrdersCategory = 'all';
let currentSearchQuery = '';

function setOrdersCategory(catKey) {
    currentOrdersCategory = catKey;
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-amber-400', 'text-amber-400', 'font-bold');
        btn.classList.add('border-transparent', 'text-gray-400');
    });

    const activeBtn = document.getElementById(`tab-cat-${catKey}`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-amber-400', 'text-amber-400', 'font-bold');
        activeBtn.classList.remove('border-transparent', 'text-gray-400');
    }

    renderOrdersTable();
}
window.setOrdersCategory = setOrdersCategory;

async function loadRecentOrders() {
    const res = await window.OrderService.getAllOrders();
    allDashboardOrders = res.orders || [];
    renderDeliveryRemindersCard();
    renderOrdersTable();
}

function renderDeliveryRemindersCard() {
    const card = document.getElementById('deliveryRemindersCard');
    const listEl = document.getElementById('reminderItemsList');
    const countBadge = document.getElementById('reminderCountBadge');
    if (!card || !listEl) return;

    // Filter active orders that have delivery scheduled tomorrow, today, or overdue
    const upcoming = allDashboardOrders.filter(o => {
        if (o.status === 'delivered') return false;
        const days = window.OrderService.getDaysUntilDelivery(o.delivery_date);
        return days !== null && days <= 1; // 1 day left, 0 days (today), or overdue
    });

    if (upcoming.length === 0) {
        card.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    card.classList.remove('hidden');
    if (countBadge) countBadge.textContent = `${upcoming.length} Urgent Alert${upcoming.length > 1 ? 's' : ''}`;

    listEl.innerHTML = upcoming.map(ord => {
        const days = window.OrderService.getDaysUntilDelivery(ord.delivery_date);
        let badgeHtml = '';
        if (days === 1) {
            badgeHtml = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse"><i class="fas fa-clock mr-1"></i> Due Tomorrow (1-Day Left)</span>`;
        } else if (days === 0) {
            badgeHtml = `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><i class="fas fa-exclamation-circle mr-1"></i> Due Today!</span>`;
        } else {
            badgeHtml = `<span class="bg-red-900/40 text-red-300 border border-red-700/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase"><i class="fas fa-history mr-1"></i> Overdue (${Math.abs(days)}d)</span>`;
        }

        return `
            <div class="p-3 bg-black/50 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-sm">${ord.customer_name}</span>
                        ${badgeHtml}
                    </div>
                    <div class="text-xs text-gray-400 mt-0.5">
                        <span class="font-mono text-amber-400 font-semibold">${ord.order_number}</span> • ${ord.dress_type} • Delivery: <strong class="text-white">${ord.delivery_date}</strong>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <button onclick="sendDeliveryReminderWhatsApp('${ord.order_number}')" 
                            class="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 whitespace-nowrap">
                        <i class="fab fa-whatsapp"></i> Send 1-Day Reminder
                    </button>
                    <button onclick="viewOrderNaap('${ord.order_number}')" 
                            class="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs rounded-lg transition">
                        <i class="fas fa-ruler-combined"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    // 1. Calculate category counts
    const countAll = allDashboardOrders.length;
    const countTomorrow = allDashboardOrders.filter(o => o.status !== 'delivered' && window.OrderService.getDaysUntilDelivery(o.delivery_date) === 1).length;
    const countWorkshop = allDashboardOrders.filter(o => ['cutting', 'stitching', 'finishing'].includes(o.status)).length;
    const countReady = allDashboardOrders.filter(o => o.status === 'ready').length;
    const countDue = allDashboardOrders.filter(o => (parseFloat(o.balance_due) || 0) > 0).length;
    const countDelivered = allDashboardOrders.filter(o => o.status === 'delivered').length;
    const countVip = allDashboardOrders.filter(o => {
        const tier = window.OrderService.getAdminVipTier(o.phone);
        return tier && tier !== 'none';
    }).length;

    const elCountAll = document.getElementById('catCountAll');
    const elCountTomorrow = document.getElementById('catCountTomorrow');
    const elCountWorkshop = document.getElementById('catCountWorkshop');
    const elCountReady = document.getElementById('catCountReady');
    const elCountDelivered = document.getElementById('catCountDelivered');
    const elCountVip = document.getElementById('catCountVip');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountTomorrow) elCountTomorrow.textContent = countTomorrow;
    if (elCountWorkshop) elCountWorkshop.textContent = countWorkshop;
    if (elCountReady) elCountReady.textContent = countReady;
    const elCountDue = document.getElementById('catCountDue');
    if (elCountDue) elCountDue.textContent = countDue;
    if (elCountDelivered) elCountDelivered.textContent = countDelivered;
    if (elCountVip) elCountVip.textContent = countVip;

    // 2. Filter orders by current category
    let filtered = [...allDashboardOrders];
    if (currentOrdersCategory === 'due_tomorrow') {
        filtered = filtered.filter(o => o.status !== 'delivered' && window.OrderService.getDaysUntilDelivery(o.delivery_date) === 1);
    } else if (currentOrdersCategory === 'workshop') {
        filtered = filtered.filter(o => ['cutting', 'stitching', 'finishing'].includes(o.status));
    } else if (currentOrdersCategory === 'ready') {
        filtered = filtered.filter(o => o.status === 'ready');
    } else if (currentOrdersCategory === 'due') {
        filtered = filtered.filter(o => (parseFloat(o.balance_due) || 0) > 0);
    } else if (currentOrdersCategory === 'delivered') {
        filtered = filtered.filter(o => o.status === 'delivered');
    } else if (currentOrdersCategory === 'vip') {
        filtered = filtered.filter(o => window.OrderService.getAdminVipTier(o.phone) !== 'none');
    }

    // 3. Filter by search input
    if (currentSearchQuery) {
        const q = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(o => 
            (o.order_number && o.order_number.toLowerCase().includes(q)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
            (o.phone && o.phone.includes(q)) ||
            (o.dress_type && o.dress_type.toLowerCase().includes(q))
        );
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-500 py-8 text-xs">No orders found in this category.</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(order => {
        // Admin-decided VIP badge
        const adminVipTier = window.OrderService.getAdminVipTier(order.phone);
        let vipBadge = '';
        if (adminVipTier === 'gold') {
            vipBadge = `<span class="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">👑 Gold VIP</span>`;
        } else if (adminVipTier === 'silver') {
            vipBadge = `<span class="text-[9px] bg-slate-300/20 text-slate-200 border border-slate-400/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">🥈 Silver VIP</span>`;
        } else if (adminVipTier === 'bronze') {
            vipBadge = `<span class="text-[9px] bg-amber-700/20 text-amber-500 border border-amber-600/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">🥉 Bronze VIP</span>`;
        }

        // Delivery reminder badge
        const daysLeft = window.OrderService.getDaysUntilDelivery(order.delivery_date);
        let deliveryTag = '';
        if (order.status !== 'delivered' && daysLeft !== null) {
            if (daysLeft === 1) {
                deliveryTag = `<span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold block mt-1 animate-pulse">⏰ Due Tomorrow (1-Day Left)</span>`;
            } else if (daysLeft === 0) {
                deliveryTag = `<span class="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold block mt-1">🚨 Due Today!</span>`;
            } else if (daysLeft < 0) {
                deliveryTag = `<span class="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded font-bold block mt-1">Overdue (${Math.abs(daysLeft)}d)</span>`;
            }
        }

        return `
        <tr data-order="${order.order_number.toLowerCase()} ${order.customer_name.toLowerCase()}">
            <td class="font-mono font-bold text-premium-gold">${order.order_number}</td>
            <td>
                <div class="flex items-center gap-1.5">
                    <span class="font-semibold text-white">${order.customer_name}</span>
                    ${vipBadge}
                </div>
                <div class="text-xs text-gray-400">${order.dress_type}</div>
            </td>
            <td>
                <span class="status-badge badge-${order.status}">
                    ${order.status}
                </span>
                ${order.status === 'delivered' ? `
                    <div class="text-[10px] text-gray-400 mt-1">
                        <i class="fas fa-clock text-emerald-400"></i>
                        ${order.delivered_at ? new Date(order.delivered_at).toLocaleString('en-IN') : 'Time not recorded'}
                    </div>
                    <div class="text-[10px] text-amber-400 mt-0.5">
                        ${order.payment_method ? `Payment: ${order.payment_method}` : 'Payment: Cash'}
                    </div>
                ` : ''}
            </td>
            <td>
                <div class="text-gray-200">${order.delivery_date}</div>
                ${deliveryTag}
            </td>
            <td>
                <div class="text-white font-medium">₹${order.total_amount}</div>
                <div class="text-xs ${order.balance_due > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}">
                    ${order.balance_due > 0 ? `Due: ₹${order.balance_due}` : 'Paid in Full'}
                </div>
            </td>
            <td>
                <select class="bg-neutral-800 text-xs text-white border border-neutral-700 rounded px-2 py-1 focus:border-amber-400"
                        onchange="handleStatusChange('${order.id}', this.value)">
                    <option value="measurement" ${order.status === 'measurement' ? 'selected' : ''}>Measurement</option>
                    <option value="cutting" ${order.status === 'cutting' ? 'selected' : ''}>Cutting</option>
                    <option value="stitching" ${order.status === 'stitching' ? 'selected' : ''}>Stitching</option>
                    <option value="finishing" ${order.status === 'finishing' ? 'selected' : ''}>Finishing</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>
                <button onclick="viewOrderNaap('${order.order_number}')" 
                        class="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-amber-500/40 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                    <i class="fas fa-ruler-combined"></i> View Naap
                </button>
            </td>
            <td>
                <div class="flex items-center gap-1.5">
                    <button onclick="sendOrderWhatsAppAlert('${order.order_number}')" 
                            class="px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            title="1-Click WhatsApp Live Status Notification">
                        <i class="fab fa-whatsapp"></i> Alert
                    </button>
                    <button onclick="openInvoiceModal('${order.order_number}')" 
                            class="px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500 text-blue-400 hover:text-black border border-blue-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            title="Print / View Official Bill Slip">
                        <i class="fas fa-file-invoice-dollar"></i> Bill
                    </button>
                    ${order.ready_photo ? `
                    <button onclick="viewReadyOrderPhoto('${order.order_number}')"
                            class="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            title="View ready garment photo">
                        <i class="fas fa-image"></i> Photo
                    </button>` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

let pendingDeliveryOrder = null;
let pendingReadyOrder = null;

function closeReadyPhotoModal() {
    document.getElementById('readyPhotoModal')?.classList.add('hidden');
    pendingReadyOrder = null;
    const input = document.getElementById('readyOrderPhoto');
    if (input) input.value = '';
    document.getElementById('readyPhotoPreview')?.classList.add('hidden');
}

async function confirmReadyWithPhoto() {
    if (!pendingReadyOrder) return;
    const input = document.getElementById('readyOrderPhoto');
    const file = input?.files?.[0];

    const saveReady = async (photoData) => {
        const extraData = photoData ? { ready_photo: photoData, ready_at: new Date().toISOString() } : { ready_at: new Date().toISOString() };
        const res = await window.OrderService.updateOrderStatus(pendingReadyOrder.id, 'ready', extraData);
        if (res.success) {
            const readyOrder = { ...pendingReadyOrder, status: 'ready', ...extraData };
            closeReadyPhotoModal();
            const notification = await sendAutomaticWhatsAppNotification(readyOrder, 'ready');
            showAdminToast(notification.success
                ? `Order marked READY. WhatsApp notification accepted${photoData ? ' with photo' : ''}.`
                : `Order marked READY, but WhatsApp was not sent: ${notification.error}`, notification.success ? 'success' : 'warning');
            await loadDashboardStats();
            await loadRecentOrders();
        }
    };

    if (!file) {
        await saveReady('');
        return;
    }

    try {
        const photoUrl = await uploadReadyOrderPhoto(file, pendingReadyOrder.order_number);
        await saveReady(photoUrl);
    } catch (err) {
        console.error('Ready order photo upload failed:', err);
        showAdminToast(`Photo upload failed: ${err.message || err}`, 'error');
        alert(`Order photo Supabase mein upload nahi hua:\n\n${err.message || err}\n\nSupabase Storage setup SQL run karke dobara try karein.`);
    }
}

async function uploadReadyOrderPhoto(file, orderNumber) {
    const client = window.getSupabase ? window.getSupabase() : null;
    if (!client?.storage) throw new Error('Supabase Storage client is unavailable.');
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be smaller than 8 MB.');

    const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const safeOrderNumber = String(orderNumber || 'order').replace(/[^a-z0-9_-]/gi, '_');
    const path = `${safeOrderNumber}/${Date.now()}.${extension}`;
    const { error } = await client.storage.from('order-photos').upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
    });
    if (error) throw error;
    const { data } = client.storage.from('order-photos').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Supabase did not return a public photo URL.');
    return data.publicUrl;
}

document.addEventListener('change', (event) => {
    if (event.target?.id !== 'readyOrderPhoto') return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('readyPhotoPreviewImg').src = reader.result;
        document.getElementById('readyPhotoPreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

async function viewReadyOrderPhoto(orderNumber) {
    const res = await window.OrderService.getAllOrders();
    const order = (res.orders || []).find(item => item.order_number === orderNumber);
    if (!order?.ready_photo) {
        showAdminToast('No photo uploaded for this order.', 'warning');
        return;
    }
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<title>Ready Order ${order.order_number}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${order.ready_photo}" style="max-width:100%;max-height:100%"></body>`);
    }
}

window.closeReadyPhotoModal = closeReadyPhotoModal;
window.confirmReadyWithPhoto = confirmReadyWithPhoto;
window.viewReadyOrderPhoto = viewReadyOrderPhoto;

async function sendAutomaticWhatsAppNotification(order, event) {
    const client = window.getSupabase ? window.getSupabase() : null;
    if (!client?.functions) return { success: false, error: 'Supabase Functions client is unavailable.' };

    const rawPhone = String(order.phone || '').replace(/\D/g, '');
    const countryCode = String(order.country_code || (rawPhone.startsWith('91') ? '91' : '977')).replace(/\D/g, '');
    const localPhone = rawPhone.startsWith(countryCode) ? rawPhone.slice(countryCode.length) : rawPhone;
    const to = `${countryCode}${localPhone}`;
    if (to.length < 8) return { success: false, error: 'Customer ka registered phone number valid nahi hai.' };

    try {
        const { data, error } = await client.functions.invoke('whatsapp-notify', {
            body: {
                event,
                to,
                customer_name: order.customer_name || 'Customer',
                order_number: order.order_number || order.order_code || '',
                dress_type: order.dress_type || 'Garment',
                delivery_date: order.delivery_date || '',
                total_amount: Number(order.total_amount) || 0,
                payment_method: order.payment_method || 'Cash'
            }
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'WhatsApp provider rejected the message.');
        return { success: true };
    } catch (err) {
        console.error('Automatic WhatsApp notification failed:', err);
        return { success: false, error: err.message || String(err) };
    }
}
window.sendAutomaticWhatsAppNotification = sendAutomaticWhatsAppNotification;

async function handleStatusChange(orderId, newStatus) {
    if (!window.OrderService) return;

    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const targetOrder = orders.find(o => o.id === orderId || o.order_number === orderId);

    if (newStatus === 'ready' && targetOrder) {
        pendingReadyOrder = targetOrder;
        const modal = document.getElementById('readyPhotoModal');
        if (modal) modal.classList.remove('hidden');
        return;
    }

    if (newStatus === 'delivered') {
        if (targetOrder) {
            openDeliveryModal(targetOrder);
            return;
        }
    }

    const updateRes = await window.OrderService.updateOrderStatus(orderId, newStatus);
    if (updateRes.success) {
        if (targetOrder) {
            showAdminToast(`Status updated: ${newStatus.toUpperCase()}.`);
        } else {
            showAdminToast(`Order status updated to: ${newStatus}`);
        }
        await loadDashboardStats();
        await loadRecentOrders();
    }
}

function openDeliveryModal(order) {
    pendingDeliveryOrder = order;
    const modal = document.getElementById('deliveryModal');
    if (!modal) return;

    document.getElementById('delivCustName').textContent = order.customer_name;
    document.getElementById('delivOrderRef').textContent = `Order: ${order.order_number} • Dress: ${order.dress_type}`;
    document.getElementById('delivDueAmount').textContent = `₹${order.balance_due || 0}`;
    document.getElementById('delivTotalAmount').textContent = `₹${order.total_amount || 0}`;
    const remainingInput = document.getElementById('delivRemainingDue');
    if (remainingInput) {
        remainingInput.value = order.balance_due || 0;
        remainingInput.max = order.total_amount || 0;
    }

    // Default to current local date-time
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('delivDateTime').value = localIso;

    // Default to Cash radio
    const cashRadio = document.querySelector('input[name="delivPaymentMode"][value="Cash"]');
    if (cashRadio) cashRadio.checked = true;
    toggleDeliveryQr(false);

    // Set QR code payload
    const qrImg = document.getElementById('delivQrImg');
    if (qrImg) {
        const qrPayload = encodeURIComponent(`OM TAILOR NAGWA BIRGUNJ\nOrder: ${order.order_number}\nCustomer: ${order.customer_name}\nBalance: Rs. ${order.balance_due || 0}`);
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrPayload}`;
    }

    modal.classList.remove('hidden');
}

function closeDeliveryModal() {
    const modal = document.getElementById('deliveryModal');
    if (modal) modal.classList.add('hidden');
    pendingDeliveryOrder = null;
    loadRecentOrders(); // reset dropdown
}

function toggleDeliveryQr(show) {
    const box = document.getElementById('delivQrBox');
    if (box) {
        if (show) box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
}

async function confirmOrderDelivery() {
    if (!pendingDeliveryOrder) return;

    const delivTimeVal = document.getElementById('delivDateTime').value;
    const paymentMode = document.querySelector('input[name="delivPaymentMode"]:checked')?.value || 'Cash';
    const totalAmount = Math.max(0, parseFloat(pendingDeliveryOrder.total_amount) || 0);
    const remainingDue = Math.min(totalAmount, Math.max(0, parseFloat(document.getElementById('delivRemainingDue')?.value) || 0));
    const timestamp = delivTimeVal ? new Date(delivTimeVal).toISOString() : new Date().toISOString();

    const extraData = {
        delivered_at: timestamp,
        payment_method: paymentMode,
        balance_due: remainingDue,
        advance_paid: Math.max(0, (parseFloat(pendingDeliveryOrder.total_amount) || 0) - remainingDue)
    };

    const res = await window.OrderService.updateOrderStatus(pendingDeliveryOrder.id, 'delivered', extraData);
    if (res.success) {
        const deliveredOrder = { ...pendingDeliveryOrder, status: 'delivered', ...extraData };
        const isFullyPaid = remainingDue === 0;
        const notification = isFullyPaid
            ? await sendAutomaticWhatsAppNotification(deliveredOrder, 'delivered_paid')
            : { success: false, error: 'Payment abhi poora nahi hua; payment confirmation message nahi bheja.' };

        const modal = document.getElementById('deliveryModal');
        if (modal) modal.classList.add('hidden');
        showAdminToast(isFullyPaid
            ? (notification.success
                ? `Order ${pendingDeliveryOrder.order_number} delivered and paid. WhatsApp notification accepted.`
                : `Order delivered and paid, but WhatsApp failed: ${notification.error}`)
            : `Order ${pendingDeliveryOrder.order_number} delivered. Balance payment pending; WhatsApp payment message not sent.`,
        isFullyPaid && notification.success ? 'success' : 'warning');
        pendingDeliveryOrder = null;
        await loadDashboardStats();
        await loadRecentOrders();
        if (window.loadCustomerList) await window.loadCustomerList();
    }
}

window.openDeliveryModal = openDeliveryModal;
window.closeDeliveryModal = closeDeliveryModal;
window.toggleDeliveryQr = toggleDeliveryQr;
window.confirmOrderDelivery = confirmOrderDelivery;

function filterOrdersTable(term) {
    currentSearchQuery = (term || '').trim();
    renderOrdersTable();
}

function openNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    if (modal) modal.classList.remove('hidden');
}

function closeNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    if (modal) modal.classList.add('hidden');
}

// Wire up New Order Form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newOrderForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const orderData = {
                customer_name: document.getElementById('orderCustName').value.trim(),
                phone: document.getElementById('orderCustPhone').value.trim().replace(/\D/g, '').replace(/^0/, ''),
                country_code: document.getElementById('orderPhoneCountry').value,
                dress_type: document.getElementById('orderDressType').value,
                fabric: document.getElementById('orderFabric').value.trim(),
                delivery_date: document.getElementById('orderDeliveryDate').value,
                total_amount: document.getElementById('orderTotalAmt').value,
                advance_paid: document.getElementById('orderAdvancePaid').value || 0,
                status: document.getElementById('orderInitialStatus').value,
                notes: document.getElementById('orderNotes').value.trim(),
                measurements: {
                    length: document.getElementById('naapLength').value.trim(),
                    chest: document.getElementById('naapChest').value.trim(),
                    waist: document.getElementById('naapWaist').value.trim(),
                    shoulder: document.getElementById('naapShoulder').value.trim(),
                    sleeve: document.getElementById('naapSleeve').value.trim(),
                    collar: document.getElementById('naapCollar').value.trim()
                }
            };

            const res = await window.OrderService.createOrder(orderData);
            if (res.success) {
                closeNewOrderModal();
                form.reset();
                if (res.supabaseSaved) {
                    showAdminToast(`Order ${res.order.order_number} saved to Supabase Cloud! ☁️🎉`, 'success');
                    if (res.measurementError) {
                        showAdminToast(`Order saved, but measurements failed: ${res.measurementError}`, 'warning');
                        alert(`Order Supabase mein save ho gaya, lekin measurement save nahi hua:\n\n${res.measurementError}`);
                    }
                } else {
                    showAdminToast(`⚠️ Saved locally, but Supabase rejected: ${res.supabaseError}`, 'warning');
                    alert(`⚠️ Supabase ने Order Reject कर दिया:\n\nError: ${res.supabaseError}\n\nकृपया इस Error को देखें या मुझे बताएं ताकि हम इसे तुरंत ठीक कर सकें।`);
                }
                await loadDashboardStats();
                await loadRecentOrders();
                if (window.loadCustomerList) await window.loadCustomerList();
            }
        });
    }
});

async function checkDatabaseStatus() {
    const client = window.getSupabase ? window.getSupabase() : null;
    const badge = document.getElementById('dbStatusBadge');
    if (!badge) return;

    if (!client) {
        badge.innerHTML = '<span class="text-rose-400"><i class="fas fa-times-circle"></i> Supabase Not Loaded</span>';
        return;
    }

    try {
        const { data, error } = await client.from('orders').select('*').limit(1);
        if (error) {
            badge.innerHTML = `<button onclick="showDbDiagnostic('${error.message.replace(/'/g, "\\'")}')" class="text-rose-400 hover:underline flex items-center gap-1"><i class="fas fa-exclamation-triangle"></i> Supabase Error (Click to View)</button>`;
        } else {
            badge.innerHTML = '<span class="text-emerald-400 flex items-center gap-1"><i class="fas fa-check-circle"></i> Supabase Connected</span>';
        }
    } catch (err) {
        badge.innerHTML = `<span class="text-rose-400"><i class="fas fa-times-circle"></i> ${err.message}</span>`;
    }
}

function showDbDiagnostic(err) {
    alert(`🔍 SUPABASE DIAGNOSTIC ERROR:\n-----------------------------\n${err}\n\n1. Supabase SQL Editor में RLS Policy चेक करें।\n2. 'orders' टेबल में कॉलम के नाम चेक करें।`);
}

window.checkDatabaseStatus = checkDatabaseStatus;
window.showDbDiagnostic = showDbDiagnostic;

function showAdminToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const bgClass = type === 'warning' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-neutral-900';
    toast.className = `fixed bottom-6 right-6 ${bgClass} px-5 py-3 rounded-lg font-semibold shadow-2xl transition-all z-50 text-sm max-w-md`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

window.handleStatusChange = handleStatusChange;
window.openNewOrderModal = openNewOrderModal;
window.closeNewOrderModal = closeNewOrderModal;

// View Naap Slip Functionality
function printNaapSlip() {
    document.body.classList.add('print-naap-only');
    const cleanup = () => document.body.classList.remove('print-naap-only');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    // Fallback for browsers that do not fire afterprint reliably.
    setTimeout(cleanup, 1500);
}

function printInvoiceOnly() {
    document.body.classList.add('print-invoice-only');
    const cleanup = () => document.body.classList.remove('print-invoice-only');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1500);
}

async function viewOrderNaap(orderNumber) {
    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const order = orders.find(o => o.order_number === orderNumber);
    if (!order) {
        alert('Order details not found.');
        return;
    }

    const modal = document.getElementById('viewNaapModal');
    if (!modal) return;

    // Fill customer & garment details
    document.getElementById('slipCustomerName').textContent = order.customer_name || 'Customer';
    document.getElementById('slipOrderRef').textContent = `Order: ${order.order_number} • Phone: ${order.phone || 'N/A'}`;
    document.getElementById('slipDressType').textContent = order.dress_type || '--';
    document.getElementById('slipDeliveryDate').textContent = order.delivery_date || '--';
    document.getElementById('slipFabric').textContent = order.fabric || 'Standard';
    document.getElementById('slipNotes').textContent = order.notes || 'None';

    // Parse measurements
    let m = order.measurements || {};
    if (typeof m === 'string') {
        try { m = JSON.parse(m); } catch (e) { m = {}; }
    }

    document.getElementById('naapValLength').textContent = m.length ? `${m.length}"` : '--';
    document.getElementById('naapValChest').textContent = m.chest ? `${m.chest}"` : '--';
    document.getElementById('naapValWaist').textContent = m.waist ? `${m.waist}"` : '--';
    document.getElementById('naapValShoulder').textContent = m.shoulder ? `${m.shoulder}"` : '--';
    document.getElementById('naapValSleeve').textContent = m.sleeve ? `${m.sleeve}"` : '--';
    document.getElementById('naapValCollar').textContent = m.collar ? `${m.collar}"` : '--';

    // WhatsApp Slip Link
    const waBtn = document.getElementById('slipWhatsAppBtn');
    if (waBtn) {
        const msg = encodeURIComponent(
            `*OM TAILOR - NAAP & ORDER SLIP 📏*\n` +
            `--------------------------------\n` +
            `Order: *${order.order_number}*\n` +
            `Customer: ${order.customer_name}\n` +
            `Dress: ${order.dress_type}\n` +
            `Delivery: *${order.delivery_date}*\n` +
            `--------------------------------\n` +
            `Length: ${m.length || '-'} inch\n` +
            `Chest: ${m.chest || '-'} inch\n` +
            `Waist: ${m.waist || '-'} inch\n` +
            `Shoulder: ${m.shoulder || '-'} inch\n` +
            `Sleeve: ${m.sleeve || '-'} inch\n` +
            `Collar: ${m.collar || '-'} inch\n` +
            `--------------------------------\n` +
            `Status: ${(order.status || 'MEASUREMENT').toUpperCase()}\n` +
            `Thank you! OM Tailor, Nagwa Birgunj.`
        );
        waBtn.href = `https://wa.me/977${order.phone || ''}?text=${msg}`;
    }

    modal.classList.remove('hidden');
}

function closeNaapModal() {
    const modal = document.getElementById('viewNaapModal');
    if (modal) modal.classList.add('hidden');
}

// Feature 1: Send WhatsApp Live Status Alert directly
async function sendOrderWhatsAppAlert(orderNumber) {
    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const order = orders.find(o => o.order_number === orderNumber);
    if (!order) {
        alert('Order details not found.');
        return;
    }
    const link = window.OrderService.generateStatusWhatsAppLink(order);
    window.open(link, '_blank');
}

// 1-Day Delivery Due Reminder WhatsApp Alert
async function sendDeliveryReminderWhatsApp(orderNumber) {
    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const order = orders.find(o => o.order_number === orderNumber);
    if (!order) {
        alert('Order details not found.');
        return;
    }
    const link = window.OrderService.generateDeliveryReminderWhatsAppLink(order);
    window.open(link, '_blank');
    showAdminToast(`1-Day delivery reminder opened for ${order.customer_name} (${order.phone}) 📲`, 'success');
}

// Feature 2: Digital Invoice / Bill Slip Modal (No Naap, Single-Page Clean Print)
async function openInvoiceModal(orderNumber) {
    const res = await window.OrderService.getAllOrders();
    const orders = res.orders || [];
    const order = orders.find(o => o.order_number === orderNumber);
    if (!order) {
        alert('Order details not found.');
        return;
    }

    const modal = document.getElementById('invoiceModal');
    if (!modal) return;

    // Header & Meta
    const invNumEl = document.getElementById('invNumber');
    if (invNumEl) invNumEl.textContent = `INV-${order.order_number.replace('OM-', '')}`;
    const dateEl = document.getElementById('invIssueDate');
    if (dateEl) dateEl.textContent = `Date: ${new Date().toLocaleDateString('en-GB')}`;

    // Customer info
    const custNameEl = document.getElementById('invCustName');
    if (custNameEl) custNameEl.textContent = order.customer_name || 'Customer';
    const custPhoneEl = document.getElementById('invCustPhone');
    if (custPhoneEl) custPhoneEl.textContent = `Phone: ${order.phone || 'N/A'}`;
    const delivDateEl = document.getElementById('invDeliveryDate');
    if (delivDateEl) delivDateEl.textContent = order.delivery_date || '--';
    const statusEl = document.getElementById('invStatusBadge');
    if (statusEl) {
        statusEl.innerHTML = `Status: <span class="uppercase font-bold text-amber-400">${order.status || 'Active'}</span>`;
    }

    // Garment & Pricing
    const dressEl = document.getElementById('invDressType');
    if (dressEl) dressEl.textContent = order.dress_type || '--';
    const fabricEl = document.getElementById('invFabric');
    if (fabricEl) fabricEl.textContent = `Fabric: ${order.fabric || 'Standard Customer Material'}`;
    const totalEl = document.getElementById('invTotalAmt');
    if (totalEl) totalEl.textContent = `₹${order.total_amount || 0}`;
    const subtotalEl = document.getElementById('invSubtotal');
    if (subtotalEl) subtotalEl.textContent = `₹${order.total_amount || 0}`;
    const advanceEl = document.getElementById('invAdvance');
    if (advanceEl) advanceEl.textContent = `₹${order.advance_paid || 0}`;
    const balanceEl = document.getElementById('invBalance');
    if (balanceEl) balanceEl.textContent = `₹${order.balance_due || 0}`;

    // Payment QR for balance due (Cleanly managed)
    const qrDue = parseFloat(order.balance_due) || 0;
    const qrContainer = document.getElementById('invQrContainer');
    const qrImg = document.getElementById('invQrImage');
    if (qrContainer && qrImg) {
        if (qrDue > 0) {
            qrContainer.classList.remove('hidden');
            const qrText = encodeURIComponent(`OM Tailor Bill: ${order.order_number} | Amount: Rs ${qrDue} | Customer: ${order.customer_name}`);
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;
        } else {
            qrContainer.innerHTML = `<span class="inline-block px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold uppercase">PAID IN FULL ✓</span>`;
        }
    }

    // WhatsApp Share Bill Button
    const waShare = document.getElementById('invWhatsAppShare');
    if (waShare) {
        const origin = window.location.origin || '';
        const billMsg = encodeURIComponent(
            `*OM TAILOR - OFFICIAL BILL & INVOICE 🧾*\n` +
            `-----------------------------------\n` +
            `Invoice: *INV-${order.order_number.replace('OM-', '')}*\n` +
            `Customer: ${order.customer_name}\n` +
            `Dress: ${order.dress_type}\n` +
            `Total Price: Rs. ${order.total_amount}\n` +
            `Advance Paid: Rs. ${order.advance_paid || 0}\n` +
            `*Balance Due: Rs. ${order.balance_due || 0}*\n` +
            `Delivery Date: *${order.delivery_date}*\n` +
            `-----------------------------------\n` +
            `📱 Track Order Online:\n${origin}/customer/tracking.html?order=${order.order_number}\n` +
            `🛡️ 30-Day Master Fitting Guarantee Included\n` +
            `📍 Nagwa, Birgunj | 📞 +977-9807216628`
        );
        waShare.href = `https://wa.me/977${(order.phone || '').replace(/\D/g, '')}?text=${billMsg}`;
    }

    modal.classList.remove('hidden');
}

function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) modal.classList.add('hidden');
}

window.viewOrderNaap = viewOrderNaap;
window.closeNaapModal = closeNaapModal;
window.sendOrderWhatsAppAlert = sendOrderWhatsAppAlert;
window.sendDeliveryReminderWhatsApp = sendDeliveryReminderWhatsApp;
window.openInvoiceModal = openInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
