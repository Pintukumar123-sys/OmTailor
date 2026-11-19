/**
 * OM TAILOR - Customer Order Tracking & History Logic
 * File: assets/js/customer/tracking.js
 */

let currentCustomerOrders = [];
let currentlyActiveOrder = null;

document.addEventListener('DOMContentLoaded', () => {
    const trackForm = document.getElementById('trackingSearchForm');
    const orderInput = document.getElementById('orderQueryInput');

    // Auto-check URL query parameters e.g. tracking.html?order=9807216628
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('order') || localStorage.getItem('om_customer_phone');

    if (initialQuery) {
        if (orderInput) orderInput.value = initialQuery;
        executeOrderLookup(initialQuery);
    }

    if (trackForm) {
        trackForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = orderInput.value.trim();
            if (val) executeOrderLookup(val);
        });
    }
});

async function executeOrderLookup(query) {
    const resultsContainer = document.getElementById('trackingResultSection');
    const emptyState = document.getElementById('trackingEmptyState');
    const profileBanner = document.getElementById('customerProfileBanner');

    if (!window.OrderService) {
        console.error('OrderService not loaded');
        return;
    }

    const res = await window.OrderService.getCustomerProfileAndOrders(query);
    if (!res.success || !res.orders || res.orders.length === 0) {
        if (resultsContainer) resultsContainer.classList.add('hidden');
        if (profileBanner) profileBanner.classList.add('hidden');
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.innerHTML = `
                <div class="py-4">
                    <i class="fas fa-search text-3xl text-gray-500 mb-3 block"></i>
                    <p class="text-rose-400 font-medium">No records found for "${query}".</p>
                    <p class="text-xs text-gray-400 mt-1">Please ensure you enter the mobile number registered during your shop visit.</p>
                </div>
            `;
        }
        return;
    }

    currentCustomerOrders = res.orders;

    if (emptyState) emptyState.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.remove('hidden');

    // 1. Populate Customer Profile Greeting Banner
    if (profileBanner) {
        profileBanner.classList.remove('hidden');
        const elName = document.getElementById('welcomeCustomerName');
        const elPhone = document.getElementById('welcomeCustomerPhone');
        const elCount = document.getElementById('welcomeOrderCount');

        if (elName) elName.textContent = res.customer_name;
        if (elPhone) elPhone.textContent = res.phone;
        if (elCount) elCount.textContent = res.orders.length;
    }

    // Feature 6: Render VIP Loyalty Card (Admin-decided status)
    const vipCard = document.getElementById('vipLoyaltyCard');
    if (vipCard && window.OrderService.calculateVipData) {
        const vip = window.OrderService.calculateVipData(res.orders.length, res.phone);
        if (vip.isVip) {
            vipCard.classList.remove('hidden');

            const tierBadge = document.getElementById('vipTierBadge');
            if (tierBadge) {
                tierBadge.textContent = vip.tier;
                tierBadge.className = `text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${vip.badgeClass}`;
            }

            const pointsEl = document.getElementById('vipPoints');
            if (pointsEl) pointsEl.textContent = `${vip.points} Pts`;

            const codeEl = document.getElementById('vipVoucherCode');
            if (codeEl) codeEl.textContent = vip.voucherCode;

            const descEl = document.getElementById('vipVoucherDesc');
            if (descEl) descEl.textContent = vip.voucherDiscount;

            const perksList = document.getElementById('vipPerksList');
            if (perksList) {
                perksList.innerHTML = vip.perks.map(p => `
                    <li class="flex items-center gap-1.5 text-gray-300">
                        <i class="fas fa-check-circle text-amber-400 text-xs"></i>
                        <span>${p}</span>
                    </li>
                `).join('');
            }
        } else {
            // Not VIP according to Admin decision
            vipCard.classList.add('hidden');
        }
    }

    // 2. Select first / latest order by default
    const activeOrder = res.selectedOrder || res.orders[0];
    displaySelectedOrder(activeOrder);

    // 3. Render Order History List
    renderOrderHistory(res.orders, activeOrder.order_number);
}

function displaySelectedOrder(order) {
    currentlyActiveOrder = order;
    renderOrderCard(order);
    updateTrackingStepper(order.status || 'measurement');
    renderCustomerNaap(order.measurements);
    renderCelebrationCard(order);

    const qrBtn = document.getElementById('custPayQrBtn');
    if (qrBtn) {
        if (order.status === 'delivered' || (parseFloat(order.balance_due) || 0) <= 0) {
            qrBtn.classList.add('hidden');
        } else {
            qrBtn.classList.remove('hidden');
        }
    }
}

function renderCelebrationCard(order) {
    const celebrationCard = document.getElementById('deliveredCelebrationCard');
    if (!celebrationCard) return;

    if (order.status === 'delivered') {
        celebrationCard.classList.remove('hidden');
        const dtEl = document.getElementById('delivDisplayDateTime');
        if (dtEl) {
            if (order.delivered_at) {
                const d = new Date(order.delivered_at);
                dtEl.textContent = Number.isNaN(d.getTime()) ? order.delivered_at : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
            } else {
                dtEl.textContent = 'Recently Handed Over';
            }
        }
        const payEl = document.getElementById('delivDisplayPayment');
        if (payEl) {
            payEl.textContent = order.payment_method ? order.payment_method : 'Paid / Cash';
        }
    } else {
        celebrationCard.classList.add('hidden');
    }
}

function renderOrderCard(order) {
    const elOrderNum = document.getElementById('resOrderNumber');
    const elCustName = document.getElementById('resCustomerName');
    const elDressType = document.getElementById('resDressType');
    const elFabric = document.getElementById('resFabric');
    const elDeliveryDate = document.getElementById('resDeliveryDate');
    const elTotalAmt = document.getElementById('resTotalAmt');
    const elBalanceDue = document.getElementById('resBalanceDue');

    const orderNumber = order.order_number || order.order_code || '--';
    if (elOrderNum) elOrderNum.textContent = orderNumber;
    if (elCustName) elCustName.textContent = order.customer_name || 'Customer';
    if (elDressType) elDressType.textContent = order.dress_type || '--';
    if (elFabric) elFabric.textContent = order.fabric || 'Selected Shop Fabric';
    if (elDeliveryDate) elDeliveryDate.textContent = order.delivery_date || '--';
    if (elTotalAmt) elTotalAmt.textContent = `₹${order.total_amount ?? 0}`;
    if (elBalanceDue) {
        elBalanceDue.textContent = `₹${order.balance_due}`;
        elBalanceDue.className = order.balance_due > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold';
    }

    // WhatsApp Contact Button
    const waBtn = document.getElementById('waDirectSupport');
    if (waBtn) {
        const msg = encodeURIComponent(`Hello OM Tailor, I am checking status for Order ${orderNumber} (${order.customer_name || 'Customer'}).`);
        waBtn.href = `https://wa.me/9779826251077?text=${msg}`;
    }

    const photoCard = document.getElementById('readyOrderPhotoCard');
    const photo = document.getElementById('readyOrderPhoto');
    if (photoCard && photo) {
        if (order.ready_photo) {
            photo.src = order.ready_photo;
            photoCard.classList.remove('hidden');
        } else {
            photo.removeAttribute('src');
            photoCard.classList.add('hidden');
        }
    }
}

function renderCustomerNaap(measurements) {
    let m = measurements || {};
    if (typeof m === 'string') {
        try { m = JSON.parse(m); } catch (e) { m = {}; }
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ? `${val}"` : '--';
    };

    setVal('custNaapLength', m.length);
    setVal('custNaapChest', m.chest);
    setVal('custNaapWaist', m.waist);
    setVal('custNaapShoulder', m.shoulder);
    setVal('custNaapSleeve', m.sleeve);
    setVal('custNaapCollar', m.collar);
}

function renderOrderHistory(orders, activeOrderNumber) {
    const listEl = document.getElementById('orderHistoryList');
    if (!listEl) return;

    listEl.innerHTML = orders.map(ord => {
        const isActive = ord.order_number === activeOrderNumber;
        const statusClass = `badge-${ord.status || 'measurement'}`;
        const orderNumber = ord.order_number || ord.order_code || '--';
        const balance = Number(ord.balance_due) || 0;

        return `
            <div class="p-4 rounded-xl border transition-all ${isActive ? 'bg-amber-500/10 border-amber-500/50 shadow-md' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-amber-400 text-sm">${orderNumber}</span>
                        <span class="status-badge ${statusClass} text-[10px]">${ord.status || 'measurement'}</span>
                        ${isActive ? '<span class="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold uppercase tracking-wider">Tracking Now</span>' : ''}
                    </div>
                    <div class="text-sm font-semibold text-white mt-1">${ord.dress_type || '--'}</div>
                    <div class="text-xs text-gray-400 mt-0.5">
                        Target Date: <span class="text-gray-200">${ord.delivery_date || '--'}</span> • Amount: <span class="text-white font-medium">₹${Number(ord.total_amount) || 0}</span> (${balance > 0 ? `<span class="text-amber-400">Due: ₹${balance}</span>` : '<span class="text-emerald-400">Paid</span>'})
                    </div>
                </div>
                <div>
                    <button onclick="selectHistoryOrder('${orderNumber}')"
                            class="px-3.5 py-1.5 ${isActive ? 'bg-amber-500 text-black' : 'bg-neutral-800 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30'} rounded-lg text-xs font-bold uppercase tracking-wider transition whitespace-nowrap">
                        ${isActive ? '<i class="fas fa-eye"></i> Viewing' : '<i class="fas fa-search-plus"></i> View Live Status'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function selectHistoryOrder(orderNumber) {
    const order = currentCustomerOrders.find(o => o.order_number === orderNumber);
    if (!order) return;

    displaySelectedOrder(order);
    renderOrderHistory(currentCustomerOrders, order.order_number);

    // Smooth scroll to top of tracking card
    const trackingCard = document.getElementById('trackingResultSection');
    if (trackingCard) {
        trackingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateTrackingStepper(currentStatus) {
    const steps = ['measurement', 'cutting', 'stitching', 'finishing', 'ready', 'delivered'];
    const currentIdx = steps.indexOf(currentStatus);

    steps.forEach((step, idx) => {
        const node = document.getElementById(`step-${step}`);
        if (!node) return;

        node.classList.remove('completed', 'active');
        if (idx < currentIdx) {
            node.classList.add('completed');
        } else if (idx === currentIdx) {
            node.classList.add('active');
        }
    });

    // Update progress bar width
    const progressLine = document.getElementById('stepperProgressBar');
    if (progressLine) {
        const percent = currentIdx >= 0 ? Math.min(100, (currentIdx / (steps.length - 1)) * 100) : 0;
        progressLine.style.width = `${percent}%`;
    }
}

window.selectHistoryOrder = selectHistoryOrder;

function openCustomerQrModal() {
    const modal = document.getElementById('customerQrModal');
    if (!modal) return;
    const dueEl = document.getElementById('resBalanceDue');
    const qrDueLabel = document.getElementById('custQrDueLabel');
    if (qrDueLabel && dueEl) {
        qrDueLabel.textContent = `Remaining Due: ${dueEl.textContent}`;
    }
    modal.classList.remove('hidden');
}

function closeCustomerQrModal() {
    const modal = document.getElementById('customerQrModal');
    if (modal) modal.classList.add('hidden');
}

window.openCustomerQrModal = openCustomerQrModal;
window.closeCustomerQrModal = closeCustomerQrModal;

// Feature 2: Customer Official Bill / Invoice Modal
function openCustomerInvoiceModal(orderNumber) {
    let order = null;
    if (orderNumber) {
        order = currentCustomerOrders.find(o => o.order_number === orderNumber);
    }
    if (!order) {
        order = currentlyActiveOrder;
    }
    if (!order) {
        alert('Order details not found.');
        return;
    }

    const modal = document.getElementById('customerInvoiceModal');
    if (!modal) return;

    // Header & Meta
    const invNumEl = document.getElementById('custInvNumber');
    if (invNumEl) invNumEl.textContent = `INV-${order.order_number.replace('OM-', '')}`;
    const dateEl = document.getElementById('custInvIssueDate');
    if (dateEl) dateEl.textContent = `Date: ${new Date().toLocaleDateString('en-GB')}`;

    // Customer info
    const custNameEl = document.getElementById('custInvCustName');
    if (custNameEl) custNameEl.textContent = order.customer_name || 'Customer';
    const custPhoneEl = document.getElementById('custInvCustPhone');
    if (custPhoneEl) custPhoneEl.textContent = `Phone: ${order.phone || 'N/A'}`;
    const delivDateEl = document.getElementById('custInvDeliveryDate');
    if (delivDateEl) delivDateEl.textContent = order.delivery_date || '--';
    const statusEl = document.getElementById('custInvStatusBadge');
    if (statusEl) {
        statusEl.innerHTML = `Status: <span class="uppercase font-bold text-amber-400">${order.status || 'Active'}</span>`;
    }

    // Garment & Pricing
    const dressEl = document.getElementById('custInvDressType');
    if (dressEl) dressEl.textContent = order.dress_type || '--';
    const fabricEl = document.getElementById('custInvFabric');
    if (fabricEl) fabricEl.textContent = `Fabric: ${order.fabric || 'Standard Customer Material'}`;
    const totalEl = document.getElementById('custInvTotalAmt');
    if (totalEl) totalEl.textContent = `₹${order.total_amount || 0}`;
    const subtotalEl = document.getElementById('custInvSubtotal');
    if (subtotalEl) subtotalEl.textContent = `₹${order.total_amount || 0}`;
    const advanceEl = document.getElementById('custInvAdvance');
    if (advanceEl) advanceEl.textContent = `₹${order.advance_paid || 0}`;
    const balanceEl = document.getElementById('custInvBalance');
    if (balanceEl) balanceEl.textContent = `₹${order.balance_due || 0}`;

    // Payment QR for balance due (Cleanly managed)
    const qrDue = parseFloat(order.balance_due) || 0;
    const qrContainer = document.getElementById('custInvQrContainer');
    const qrImg = document.getElementById('custInvQrImage');
    if (qrContainer && qrImg) {
        if (qrDue > 0) {
            qrContainer.classList.remove('hidden');
            const qrText = encodeURIComponent(`OM Tailor Bill: ${order.order_number} | Amount: Rs ${qrDue} | Customer: ${order.customer_name}`);
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;
        } else {
            qrContainer.innerHTML = `<span class="inline-block px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold uppercase">PAID IN FULL ✓</span>`;
        }
    }

    modal.classList.remove('hidden');
}

function closeCustomerInvoiceModal() {
    const modal = document.getElementById('customerInvoiceModal');
    if (modal) modal.classList.add('hidden');
}

window.openCustomerInvoiceModal = openCustomerInvoiceModal;
window.closeCustomerInvoiceModal = closeCustomerInvoiceModal;
