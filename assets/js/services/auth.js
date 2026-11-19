/**
 * OM TAILOR - Authentication Service
 * File: assets/js/services/auth.js
 * 
 * Handles Admin authentication, Customer session verification, and logout.
 */

const AuthService = {
    /**
     * Admin login with email & password
     */
    async loginAdmin(email, password) {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client && client.auth) {
            try {
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
                localStorage.setItem('om_admin_session', JSON.stringify(data.session));
                return { success: true, user: data.user, session: data.session };
            } catch (err) {
                console.error('Supabase Auth error:', err);
                return { success: false, error: err.message };
            }
        }

        // Demo / Fallback Authentication for testing
        if (email === 'admin@omtailor.com' && password === 'omtailor123') {
            const mockSession = { user: { email, role: 'admin' }, token: 'mock-token-omtailor' };
            localStorage.setItem('om_admin_session', JSON.stringify(mockSession));
            return { success: true, user: mockSession.user };
        }

        return { success: false, error: 'Invalid email or password' };
    },

    /**
     * Customer phone lookup login & profile verification
     */
    async loginCustomer(phoneNumber) {
        const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
        if (cleanPhone.length < 8) {
            return { success: false, error: 'कृपया कम से कम 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।' };
        }

        // Verify with OrderService
        if (window.OrderService) {
            const profileRes = await window.OrderService.getCustomerProfileAndOrders(cleanPhone);
            if (!profileRes.success || !profileRes.orders || profileRes.orders.length === 0) {
                return { 
                    success: false, 
                    error: `यह मोबाइल नंबर (${cleanPhone}) OM Tailor में पंजीकृत नहीं है। कृपया वही नंबर डालें जो आपने दुकान पर नाप देते समय दर्ज कराया था।` 
                };
            }

            const customerSession = {
                phone: cleanPhone,
                name: profileRes.customer_name || 'Customer',
                orderCount: profileRes.orders.length,
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('om_customer_session', JSON.stringify(customerSession));
            localStorage.setItem('om_customer_phone', cleanPhone);
            return { 
                success: true, 
                phone: cleanPhone, 
                name: profileRes.customer_name, 
                orders: profileRes.orders 
            };
        }

        localStorage.setItem('om_customer_phone', cleanPhone);
        return { success: true, phone: cleanPhone };
    },

    /**
     * Get active admin session
     */
    getAdminSession() {
        const raw = localStorage.getItem('om_admin_session');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    /**
     * Get active customer session
     */
    getCustomerSession() {
        const raw = localStorage.getItem('om_customer_session');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    /**
     * Get active customer phone
     */
    getCustomerPhone() {
        const sess = this.getCustomerSession();
        return sess ? sess.phone : localStorage.getItem('om_customer_phone');
    },

    /**
     * Admin logout
     */
    async logoutAdmin() {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client && client.auth) {
            try { await client.auth.signOut(); } catch (e) { /* ignore */ }
        }
        localStorage.removeItem('om_admin_session');
        window.location.href = 'login.html';
    },

    /**
     * Customer logout
     */
    logoutCustomer() {
        localStorage.removeItem('om_customer_session');
        localStorage.removeItem('om_customer_phone');
        window.location.href = 'login.html';
    }
};

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}
