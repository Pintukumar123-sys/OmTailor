// Supabase Edge Function. Keep WhatsApp credentials in Supabase secrets only.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const event = body?.event;
    if (event !== 'ready' && event !== 'delivered_paid') {
      return Response.json({ success: false, error: 'Unsupported notification event.' }, { status: 400, headers: corsHeaders });
    }

    const to = String(body?.to || '').replace(/\D/g, '');
    if (to.length < 8 || to.length > 15) {
      return Response.json({ success: false, error: 'Customer phone number must include country code.' }, { status: 400, headers: corsHeaders });
    }

    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const graphVersion = Deno.env.get('WHATSAPP_GRAPH_API_VERSION');
    const language = Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'en_US';
    const templateName = event === 'ready'
      ? Deno.env.get('WHATSAPP_TEMPLATE_READY')
      : Deno.env.get('WHATSAPP_TEMPLATE_DELIVERED_PAID');

    if (!accessToken || !phoneNumberId || !graphVersion || !templateName) {
      return Response.json({
        success: false,
        error: 'WhatsApp API is not configured. Set its access token, phone number ID, Graph API version and approved template names as Supabase secrets.',
      }, { status: 503, headers: corsHeaders });
    }

    // Create these approved WhatsApp templates with exactly four body variables:
    // Ready: customer, order number, garment, delivery date.
    // Paid delivery: customer, order number, total amount, payment method.
    const values = event === 'ready'
      ? [body.customer_name, body.order_number, body.dress_type, body.delivery_date]
      : [body.customer_name, body.order_number, String(body.total_amount), body.payment_method];
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: [{
          type: 'body',
          parameters: values.map((value) => ({ type: 'text', text: String(value || '-') })),
        }],
      },
    };

    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.error_user_msg || result?.error?.message || 'WhatsApp API rejected the notification.';
      return Response.json({ success: false, error: message }, { status: 502, headers: corsHeaders });
    }

    return Response.json({ success: true, message_id: result?.messages?.[0]?.id || null }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || 'Unexpected notification error.' }, { status: 500, headers: corsHeaders });
  }
});
