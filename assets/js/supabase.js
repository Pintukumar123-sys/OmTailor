/**
 * OM TAILOR - Supabase Connection
 * File: assets/js/supabase.js
 */

const SUPABASE_URL = "https://incdhvulrwcupencuwwv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Sq_vAa6-GIxIezzj_uxQfQ_IKcxztRu";

if (typeof window !== 'undefined' && window.supabase) {
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.supabaseClient = supabaseClient;
    console.log("Supabase connected successfully!");
}
