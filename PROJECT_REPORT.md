# OM TAILOR 1.0 — Project Report

## संक्षिप्त Project Overview

OM TAILOR 1.0 एक tailoring shop के लिए web application है। इसमें public-facing boutique website के साथ customer login/order tracking और staff/admin dashboard शामिल हैं। Admin dashboard से ग्राहक और stitching order दर्ज/देखे जा सकते हैं, order का production status बदला जा सकता है, भुगतान/बिलिंग विवरण संभाले जा सकते हैं और कुछ स्थितियों में WhatsApp सूचना भेजी जा सकती है। Customer अपने registered mobile number या order reference से order history, progress, measurements तथा invoice संबंधी जानकारी देख सकता है। Data के लिए Supabase integration मौजूद है; browser localStorage fallback भी code में है। Repository में database की पूरी schema migration उपलब्ध नहीं है, इसलिए नीचे database का वर्णन केवल application code में दिखने वाले fields/tables तक सीमित है।

---

## 1. Title Page

**Project Title:** OM TAILOR 1.0 — Tailoring Shop Website and Order Management System  
**Submitted by:** [Yahan details bharein]  
**Roll Number / Enrollment Number:** [Yahan details bharein]  
**Course / Semester:** [Yahan details bharein]  
**Department / Institution:** [Yahan details bharein]  
**Project Guide:** [Yahan details bharein]  
**Academic Session:** [Yahan details bharein]  
**Submission Date:** [Yahan details bharein]

## 2. Abstract

OM TAILOR 1.0 ek web-based tailoring business application hai jo shop ki services ko online dikhane ke saath order management ke kuch operational steps ko digital banata hai. Public website par shop introduction, tailoring services, collection/gallery, reviews, FAQs, contact/booking aur WhatsApp links diye gaye hain. Alag customer portal registered mobile number se profile/order lookup, order progress, history, measurement display aur invoice/print view deta hai. Admin portal authentication ke baad customer aur order records ko manage karne, order status update karne, payment details dekhne, ready-order photo aur WhatsApp notifications jaise workflows support karta hai.

Frontend HTML, CSS aur JavaScript par bana hai. Supabase JavaScript client ke madhyam se Auth, database queries aur Storage use kiye jaate hain. WhatsApp Business Platform notification ke liye ek Supabase Edge Function ka source bhi repository mein hai; iska chalna external Meta/Supabase configuration par nirbhar hai. Is report mein code se verify kiye gaye features ka hi ullekh hai. Application ko is report ke liye run ya test nahi kiya gaya hai; isliye test results ka daawa nahi kiya gaya.

## 3. Introduction aur Project Objectives

### 3.1 Introduction

Traditional tailoring workflow mein customer details, garment measurements, delivery dates, order status aur payment balance ko track karna zaroori hota hai. Is project mein ek public website aur do role-oriented portals—customer aur admin—banaye gaye hain. Order service in portals ko order data, customer data aur status progression ke saath jodti hai.

### 3.2 Objectives

- Shop ki services, collection, contact details aur customer-facing information online prastut karna.
- Admin ko customer aur tailoring order records banane aur unhe update karne ka interface dena.
- Order ko measurement se delivery tak status ke roop mein track karna.
- Customer ko phone/order reference se apne order aur history ki jaankari dikhana.
- Measurements, delivery date, total/advance/balance aur notes jaise order-related details ko record/display karna.
- Ready/delivered-paid events par WhatsApp notification workflow ko support karna, jab required external setup maujood ho.

## 4. Existing System aur Proposed System

### 4.1 Existing System (Samasya ka sandarbh)

Project source code kisi purane/manual system ka formal description nahi deta. Tailoring shop ke sandarbh mein paper register ya phone par follow-up se order details aur progress dhoondhne mein samay lag sakta hai. Yeh general problem context hai, repository se pramanit existing deployment ka daawa nahi.

### 4.2 Proposed System

Proposed application public website, customer tracking interface aur admin dashboard ko ek web project mein rakhti hai. Application code order/customer data Supabase mein padhne-likhne ki koshish karta hai aur kuch localStorage fallback records bhi rakhta hai. Admin ke status updates tracking page par progress ko badalne ke liye use hote hain. WhatsApp template notifications optional external integration hain.

## 5. Requirements

### 5.1 Software Requirements

**Repository se confirm:**

- Modern web browser aur JavaScript-enabled environment.
- Frontend: HTML, CSS, vanilla JavaScript.
- Supabase JavaScript client v2 (`@supabase/supabase-js`) — `package.json` dependency aur browser CDN references mein maujood.
- Supabase project: Auth, database tables aur ready-order image workflow ke liye Storage.
- Supabase Edge Function runtime (Deno-style `Deno.serve`) aur WhatsApp Business Platform/Cloud API, agar automated WhatsApp templates enable karne hon.
- UI assets/libraries ke external CDN references: Tailwind CSS, Font Awesome, Google Fonts; public page par AOS reference bhi hai.

**Is report ke liye sujhaaya gaya minimum environment (project ki official specification nahi):**

- Windows, macOS ya Linux ka up-to-date operating system.
- Chrome, Edge, Firefox ya Safari ka recent version.
- Code edit karne ke liye koi bhi text/code editor.
- Internet connection, jab CDN, Supabase ya WhatsApp integrations use hon.

Hardware ki koi fixed specification source mein nahi di gayi: [Yahan institution/project ke anusaar minimum hardware details bharein].

### 5.2 Hardware Requirements

Yeh browser-based application hai; dedicated server hardware specification repository mein nahi di gayi. Local development ke liye aam web-development capable computer aur internet connection kaafi hone chahiye, lekin yeh project-specific verified minimum nahi hai. **Processor, RAM, storage:** [Yahan details bharein].

## 6. Technologies Used

| Technology | Project mein istemal |
|---|---|
| HTML5 | Public site, login, tracking aur dashboard pages ka structure |
| CSS3 | Custom styles, responsive layout aur visual presentation |
| JavaScript (ES6+) | UI interactions, services, order workflow aur client-side logic |
| Tailwind CSS CDN | Utility-based styling classes |
| Supabase JS v2 | Authentication, database access aur Storage client |
| Supabase | `orders`, `customers`, `measurements`, `reviews` data access; Auth/Storage integration |
| Supabase Edge Function (Deno) | WhatsApp notification server-side request |
| WhatsApp Business Platform / Graph API | Configured templates ke zariye notifications (external setup required) |
| Font Awesome / Google Fonts / AOS | Icons, typography aur animation library reference |
| Browser localStorage | Local order/session/review/VIP-related fallback or client state |

## 7. System Design aur Modules

### 7.1 High-level Architecture

```text
Customer / Admin Browser
        |
        +-- Public site, Customer portal, Admin portal
        |
        +-- JavaScript services (Auth, Order, Customer, Payment)
                 |
                 +-- Supabase Auth / Database / Storage
                 +-- Browser localStorage fallback
                 +-- Supabase Edge Function --> WhatsApp Graph API
```

### 7.2 Main Modules

1. **Public Website:** `index.html`, `assets/css/`, `assets/js/main.js`; services, collection, reviews, FAQs, contact/booking UI aur responsive navigation.
2. **Customer Authentication:** `customer/login.html`, `assets/js/services/auth.js`; registered phone se order/profile verification aur browser session storage.
3. **Customer Tracking:** `customer/tracking.html`, `assets/js/customer/tracking.js`; order lookup, status stepper, order history, measurement panel, invoice/print aur payment QR UI.
4. **Admin Authentication:** `admin/login.html`; Supabase password authentication ka code path aur fallback/demo path.
5. **Admin Dashboard:** `admin/dashboard.html`, `assets/js/admin/dashboard.js`, `customer-management.js`; order/customer views, search/filter, order creation, status updates, delivery/payment handling aur ready photo workflow.
6. **Order Service:** `assets/js/services/order-service.js`; order number, Supabase/local order read/write, customer lookup, order updates, status labels, WhatsApp link generation aur VIP display data.
7. **Customer Service:** `assets/js/services/customer-service.js`; customer/measurement fetch, save aur customer listing.
8. **Payment Service:** `assets/js/services/payment-service.js`; payment-related client logic referenced by admin dashboard. Payment provider transaction processing repository se establish nahi hota.
9. **WhatsApp Edge Function:** `supabase/functions/whatsapp-notify/index.ts`; `ready` aur `delivered_paid` events ke liye configured template request.

## 8. Database / Data Flow

Repository mein `customers`, `orders`, `measurements` aur `reviews` tables ko query karne ka code hai. Lekin in chaar tables ki complete canonical schema ya initial creation migration repository mein nahi mili. Neeche sirf code mein nazar aane wale fields hain; actual database types, constraints, policies aur relationships ko Supabase project ke schema se verify karna hoga.

### 8.1 Code se dikhne wale data fields

- **customers:** `id`, `full_name`, `mobile`; code alternate contact field names (`phone`, `mobile_number`, `phone_number`) bhi dhoondhta hai. Customer view mein `measurements(*)` relation query hai.
- **orders:** `id`, `customer_id`, `order_number`/`order_code`, `customer_name`, `phone`, `country_code`, `dress_type`, `fabric`, `delivery_date`, `total_amount`, `advance_paid`, `balance_due`, `status`, `notes`, `measurements`, `created_at`; code `ready_photo`, `delivered_at`/delivery metadata aur `payment_method` jaise fields ko bhi use karta hai. Exact schema deployment par nirbhar ho sakti hai.
- **measurements:** `customer_id`, `garment_type`, `measurements` (object), `notes`; customer service `upsert` bhi karta hai.
- **reviews:** `created_at` ke anusaar load aur insert; review field schema poori tarah defined nahi hai.
- **Storage bucket:** SQL helper `order-photos` public bucket aur `orders.ready_photo` column ke liye setup dikhata hai. Is SQL file ko Supabase par manually apply karna hota hai.

### 8.2 Order Data Flow

1. Admin dashboard ka form customer aur order details leta hai.
2. `OrderService.createOrder()` order number generate karta hai, phone se customer record resolve/create karne ki koshish karta hai, phir `orders` table mein insert karta hai.
3. Measurement values hon to unhe alag `measurements` record mein insert karne ki koshish hoti hai.
4. Order ka local copy browser ke `om_local_orders` localStorage key mein rakha jata hai. Isse alag device/browser par shared fallback database nahi banta.
5. Admin status badalta hai; service Supabase aur local record update karne ki koshish karti hai.
6. Customer login/lookup phone ya order reference se matching orders laata hai aur tracking page status, order history aur available details render karta hai.

## 9. Main Features aur User Workflow

### 9.1 Public Visitor

1. Home page par shop, services aur collection dekhta hai.
2. Contact/booking controls ya WhatsApp links se shop se sampark kar sakta hai.
3. Reviews, FAQ aur contact/map UI dekh sakta hai.

### 9.2 Admin / Staff

1. Admin login page par email/password deta hai.
2. Dashboard mein order/customer data aur summary dekh sakta hai.
3. Naya order enter karta hai—customer, garment, fabric, delivery date, measurements aur billing fields.
4. Order status ko `measurement → cutting → stitching → finishing → ready → delivered` progression mein update karta hai.
5. Ready order ke liye photo attach karne ka workflow hai; Delivered karte waqt payment/delivery details lene ka workflow hai.
6. UI WhatsApp link ya configured Edge Function se customer notification bhejne ki koshish karti hai.

### 9.3 Customer

1. Login page par shop visit ke samay registered mobile number deta hai.
2. Code us number se linked order verify karta hai; match par customer session localStorage mein rakhta hai.
3. Tracking page par order lookup, current status/progress, order history aur available measurement details dekhta hai.
4. Invoice modal se bill details dekh/print ya PDF mein save kar sakta hai; QR payment UI available hai.

## 10. Testing Approach aur Observed Results

Is report taiyar karte samay project ko browser mein execute nahi kiya gaya aur automated/manual tests nahi chalaye gaye. Isliye koi pass/fail result ya production readiness ka nateeja report nahi kiya ja raha.

Code review se test karne layak areas:

- Supabase configured ho aur na ho—dono halaton mein login/order lookup behavior.
- Order create, measurements save aur status transition ke data checks.
- Customer phone/order reference se sahi order history milna.
- Customer/admin invoice, print layout aur responsive behavior.
- Ready photo upload/policy/accessibility aur Edge Function configuration.
- WhatsApp template/API success aur failure responses.
- Form validation, access control aur database Row Level Security policies.

**Actual test date, test environment, test cases aur observed outcomes:** [Yahan test karke details bharein]. `package.json` mein test script placeholder hai jo “no test specified” error deta hai; project test suite configured nahi hai.

## 11. Limitations aur Future Scope

### 11.1 Code Review se pahchani gayi limitations

- Browser localStorage fallback ek hi browser profile tak seemit hai; ise shared multi-user database nahi maana ja sakta.
- Customer login phone-based lookup hai; code mein OTP ya password verification flow nahi dikhta. Production deployment mein access control aur privacy policies ko verify karna chahiye.
- Admin login page mein prefilled demo credentials aur auth service mein demo fallback credentials ka code maujood hai. Actual deployment/auth configuration review zaroori hai; report un credentials ko repeat nahi karti.
- Complete database schema, migrations aur Row Level Security policies project mein nahi milti; integration ka real behavior external Supabase setup par nirbhar hai.
- Automated WhatsApp notices ke liye Meta templates, customer consent, Supabase secrets aur deployed Edge Function required hain; setup notes ise prerequisite batate hain.
- Customer-facing QR/payment interface code mein hai, lekin isse payment gateway transaction confirmation ya automatic reconciliation establish nahi hota.
- README aur current repository ke kuch setup/structure notes mein antar hai; implementation details ke liye current source files ko aadhar maana gaya hai.

### 11.2 Future Scope

- Phone OTP ya stronger identity verification aur role-based authorization.
- Database schema migrations, documented relationships aur tested Row Level Security policies.
- Centralized audit log, backups, error monitoring aur automated test suite.
- Payment gateway integration aur payment confirmation/reconciliation.
- WhatsApp templates, delivery retries aur notification preferences ka admin interface.
- Customer ke liye secure measurement history, order booking/appointment scheduling aur self-service support.
- Accessibility, localization aur performance improvements ko systematic test karna.

## 12. Conclusion

OM TAILOR 1.0 ek tailoring shop ke public information, order workflow aur customer tracking ko ek web application mein jodne ka prayas hai. Source code mein public website, admin order operations, customer order lookup, measurements/invoice views, Supabase access aur optional WhatsApp notification integration ke modules maujood hain. Iska actual end-to-end behavior external database, authentication, storage policies aur messaging configuration par nirbhar karta hai. College submission se pehle placeholders bharna, live database schema confirm karna aur actual test cases chala kar results darj karna uchit hoga.

## 13. References

### Project ke internal references

- `README.md` — project description aur setup notes (kuch notes current code se purane ho sakte hain).
- `index.html`, `assets/js/main.js`, `assets/js/translations.js` — public website aur client interactions.
- `admin/login.html`, `admin/dashboard.html`, `assets/js/admin/dashboard.js` — admin portal.
- `customer/login.html`, `customer/tracking.html`, `assets/js/customer/tracking.js` — customer portal.
- `assets/js/config/supabase-client.js`, `assets/js/services/auth.js`, `order-service.js`, `customer-service.js`, `payment-service.js` — client integration aur application services.
- `supabase/functions/whatsapp-notify/index.ts`, `supabase/WHATSAPP_SETUP.md` — WhatsApp Edge Function aur setup requirements.
- `supabase/setup-ready-order-photos.sql` — order photo storage ke liye SQL helper.
- `package.json` — dependency declaration.

### External platform documentation

- Supabase JavaScript documentation: https://supabase.com/docs/reference/javascript/introduction
- Supabase Edge Functions documentation: https://supabase.com/docs/guides/functions
- Meta WhatsApp Cloud API documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Tailwind CSS documentation: https://tailwindcss.com/docs

