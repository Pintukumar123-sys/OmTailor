/**
 * OM TAILOR - Supabase Client Configuration
 * File: assets/js/config/supabase-client.js
 * 
 * Connected to OM Tailor Supabase Project
 */

const SUPABASE_CONFIG = {
    url: "https://incdhvulrwcupencuwwv.supabase.co",
    anonKey: "sb_publishable_Sq_vAa6-GIxIezzj_uxQfQ_IKcxztRu"
};

let supabaseClient = null;

function initSupabase() {
    if (supabaseClient) return supabaseClient;

    try {
        if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('⚡ OM Tailor: Supabase Client connected successfully!');
        } else if (typeof require !== 'undefined') {
            const { createClient } = require('@supabase/supabase-js');
            supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('⚡ OM Tailor: Supabase Node Client initialized.');
        } else {
            console.warn('⚠️ Supabase SDK not yet loaded.');
        }
    } catch (err) {
        console.error('❌ Supabase Init Error:', err.message);
    }

    return supabaseClient;
}

// Auto-initialize when window loads or immediately if SDK is ready
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.initSupabase = initSupabase;
    window.getSupabase = () => supabaseClient || initSupabase();
    window.supabaseClient = initSupabase();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initSupabase, getSupabase: () => supabaseClient || initSupabase() };
}
