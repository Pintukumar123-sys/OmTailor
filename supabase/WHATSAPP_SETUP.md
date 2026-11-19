# Automatic WhatsApp notifications

The dashboard calls the `whatsapp-notify` Supabase Edge Function. The function
keeps the WhatsApp token on the server; never put the token in browser JavaScript.

## Required WhatsApp setup

1. Set up a WhatsApp Business Platform / Cloud API phone number in Meta.
2. Create and get approval for two WhatsApp message templates in the correct
   language. Both templates must have four body variables:
   - Ready: customer name, order number, garment, delivery date.
   - Paid delivery: customer name, order number, total amount, payment method.
3. Make sure customers have opted in to receive WhatsApp updates.
4. Install/use the Supabase CLI, then link this project to the Supabase project
   whose URL is configured in `assets/js/config/supabase-client.js`.
5. Set these secrets in the linked Supabase project (use the actual values in
   your own terminal; do not commit or share the access token):

```powershell
supabase secrets set WHATSAPP_ACCESS_TOKEN="<Meta permanent access token>" WHATSAPP_PHONE_NUMBER_ID="<Meta phone number ID>" WHATSAPP_GRAPH_API_VERSION="<supported Graph API version>" WHATSAPP_TEMPLATE_READY="<approved ready template name>" WHATSAPP_TEMPLATE_DELIVERED_PAID="<approved paid delivery template name>" WHATSAPP_TEMPLATE_LANGUAGE="<template language code>"
```

6. Deploy the function:

```powershell
supabase functions deploy whatsapp-notify
```

The dashboard invokes it when an order is marked Ready, and when an order is
marked Delivered with a zero balance. Partial payment does not trigger the paid
delivery message. The browser reports provider/API errors in the dashboard.
