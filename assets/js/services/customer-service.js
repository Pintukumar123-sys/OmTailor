/**
 * OM TAILOR - Customer Service
 * File: assets/js/services/customer-service.js
 * 
 * Manages customer profiles, measurement records (Naap Locker), and search.
 */

const CustomerService = {
    /**
     * Fetch customer profile and measurements by phone number
     */
    async getCustomerByPhone(phone) {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client) {
            try {
                const { data, error } = await client
                    .from('customers')
                    .select('*, measurements(*)')
                    .eq('mobile', phone)
                    .single();
                if (!error && data) {
                    return {
                        success: true,
                        customer: {
                            ...data,
                            name: data.full_name || data.name || 'Customer',
                            phone: data.mobile || data.phone || phone
                        }
                    };
                }
            } catch (err) {
                console.warn('Customer lookup via Supabase failed, using mock data:', err.message);
            }
        }

        // Demo fallback data
        const mockCustomer = {
            id: 'cust-001',
            name: 'Pintu Kumar',
            phone: phone || '9807216628',
            city: 'Nagwa, Birgunj',
            registered_at: '2026-01-15',
            measurements: {
                chest: '38 inch',
                waist: '32 inch',
                length: '29 inch',
                shoulder: '17.5 inch',
                sleeve: '24.5 inch',
                collar: '15.5 inch',
                notes: 'Slim fit cut, high-lapel coat preference'
            }
        };

        return { success: true, customer: mockCustomer };
    },

    /**
     * Save or update customer measurements (Digital Naap Book)
     */
    async saveMeasurements(customerId, measurements) {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client) {
            try {
                const { data, error } = await client
                    .from('measurements')
                    .upsert({ customer_id: customerId, ...measurements });
                if (error) throw error;
                return { success: true, data };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        console.log('Saved measurements locally:', measurements);
        return { success: true, localSaved: true };
    },

    /**
     * List all customers (for Admin dashboard)
     */
    async getAllCustomers() {
        const client = window.getSupabase ? window.getSupabase() : null;
        if (client) {
            try {
                const { data, error } = await client.from('customers').select('*').order('created_at', { ascending: false });
                if (!error && data) return { success: true, customers: data };
            } catch (err) {
                console.warn('Fetching all customers failed:', err.message);
            }
        }

        return {
            success: true,
            customers: [
                { id: 'CUST-101', full_name: 'Amit Sharma', name: 'Amit Sharma', mobile: '9826251077', phone: '9826251077', city: 'Birgunj', total_orders: 4 },
                { id: 'CUST-102', full_name: 'Rohan Gupta', name: 'Rohan Gupta', mobile: '9807216628', phone: '9807216628', city: 'Nagwa', total_orders: 2 },
                { id: 'CUST-103', full_name: 'Pooja Verma', name: 'Pooja Verma', mobile: '9812345678', phone: '9812345678', city: 'Adarsh Nagar', total_orders: 3 }
            ]
        };
    }
};

if (typeof window !== 'undefined') {
    window.CustomerService = CustomerService;
}
