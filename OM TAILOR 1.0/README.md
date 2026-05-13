# OM Tailor - Premium Tailoring Shop Website 🎨

A modern, elegant, and professional website for OM Tailor - a premium tailoring shop in Nagwa Birgunj. Built with HTML5, CSS3, and vanilla JavaScript with advanced features and smooth animations.

## 🌟 Features

### Premium Design Elements
- **Modern UI/UX** with elegant tailoring & fashion theme
- **Responsive Design** for mobile, tablet, and desktop
- **Smooth Animations** and hover effects
- **Professional Typography** and layout
- **Luxury Boutique Feel** with dark red, black, gold, and white color palette

### Core Sections
1. **Hero Section** - Eye-catching banner with CTA buttons
2. **About Us** - Company information with animated counters
3. **Services** - 9 different tailoring services with icons
4. **Festival Banner** - Special offers and promotions
5. **Gallery** - Filterable image gallery with lightbox
6. **Why Choose Us** - 8 compelling reasons section
7. **Customer Reviews** - 5-star testimonials carousel
8. **Price List** - Transparent pricing for all services
9. **Booking Form** - Easy appointment booking with WhatsApp integration
10. **Contact Section** - Full contact information with embedded map
11. **Footer** - Complete footer with social links

### Advanced Features
- 🎨 Sticky Navigation Bar
- 📱 Mobile-First Responsive Design
- ✨ Scroll Reveal Animations (AOS-like)
- 🎬 Animated Counter Statistics
- 🖼️ Lightbox Gallery with filtering
- 💬 WhatsApp Integration
- 📞 Floating Call & WhatsApp Buttons
- ⬆️ Back to Top Button
- 📧 Functional Contact Forms
- 🗺️ Google Maps Integration
- 🔍 SEO Optimized
- ♿ Accessibility Support
- 📊 Structured Data Schema
- 🚀 Performance Optimized

## 📋 Installation & Setup

### Quick Start
1. Extract the project files
2. Open `index.html` in your web browser
3. No dependencies needed - pure vanilla HTML/CSS/JavaScript

### Customization Required
Update the following placeholders in the files:

**In `index.html`:**
- Replace `+977-XXXXXXXXX` with actual phone number (5 occurrences)
- Update Google Maps iframe coordinates for your location
- Change email: `info@omtailor.com` to your actual email
- Customize shop address in contact section
- Update working hours if different

**Color Scheme (in `styles.css`):**
```css
--primary-color: #8B1538;      /* Dark Red */
--secondary-color: #000000;    /* Black */
--accent-color: #D4AF37;       /* Gold */
--light-color: #FFFFFF;        /* White */
```

## 📁 Project Structure

```
OM TAILOR/
├── index.html          # Main HTML file (9KB)
├── styles.css          # Complete styling (15KB)
├── script.js           # Interactive features (12KB)
└── README.md          # This file
```

**Total Size:** ~36 KB (excluding images)

## 🎨 Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Dark Red | #8B1538 | Primary buttons, headings, accents |
| Black | #000000 | Secondary, backgrounds, text |
| Gold | #D4AF37 | Highlights, accents, premium feel |
| White | #FFFFFF | Light backgrounds, text on dark |

## 🔧 Customization Guide

### Change Phone Numbers
Search for `+977XXXXXXXXX` and replace with your actual number:
- Floating call button
- Floating WhatsApp button
- Booking form WhatsApp link
- Contact section
- Footer contact links

### Update Contact Information
In the **Contact Section** (~line 680):
```html
<p>Nagwa, Birgunj<br>Nepal</p>
<p><a href="tel:+977XXXXXXXXX">+977 XXXXXXXXX</a></p>
```

### Customize Google Maps
Replace the iframe src with your coordinates:
```html
<iframe src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE"></iframe>
```

### Add Your Own Images
Replace image URLs in gallery section:
```html
<img src="your-image-url.jpg" alt="Description">
```

### Modify Prices
Update the price list section (~line 550):
```html
<li>Service: <strong>₹XXX-YYY</strong></li>
```

## 📱 Responsive Breakpoints

- **Desktop:** 1200px+ (Full layout)
- **Tablet:** 768px - 1199px (2-column layouts)
- **Mobile:** Below 768px (1-column layout)
- **Small Mobile:** Below 480px (Optimized layout)

## 🚀 Performance Tips

1. **Image Optimization:**
   - Use compressed images (WebP format recommended)
   - Target sizes: 800x600px for gallery

2. **Caching:**
   - Leverage browser caching
   - Use CDN for Font Awesome icons

3. **Minification:**
   - Minify CSS and JavaScript in production
   - Use tools like UglifyJS and CSSNano

4. **Lazy Loading:**
   - Implement lazy loading for images
   - Use IntersectionObserver API

## 🔍 SEO Features Included

✅ Meta tags (title, description, keywords)
✅ Open Graph tags for social sharing
✅ Structured data (LocalBusiness schema)
✅ Mobile-friendly viewport
✅ Fast loading time
✅ Accessibility attributes
✅ Semantic HTML5
✅ Proper heading hierarchy

## ♿ Accessibility Features

✅ ARIA labels and roles
✅ Keyboard navigation support
✅ Color contrast compliance
✅ Screen reader support
✅ Focus indicators
✅ Alt text for images
✅ Form labels

## 📞 Integration Instructions

### WhatsApp Integration
The website uses WhatsApp API for:
- Floating WhatsApp button
- Booking form submission
- Contact link

Update the phone number format: `977XXXXXXXXX` (country code + number without +)

### Google Maps
1. Get your embed code from Google Maps
2. Replace the iframe src in the contact section

### Contact Form
The booking form integrates with WhatsApp:
1. User fills out form
2. Pre-formatted message created
3. Redirects to WhatsApp Web

## 🎬 Animation Guide

The website uses CSS animations for:
- **Fade In Up:** Text and elements appearing from bottom
- **Slide In:** Navigation bar sliding down
- **Scale In:** Cards and images zooming in
- **Bounce:** Floating buttons
- **Hover Effects:** Smooth transitions on interactive elements

Configure animation speed in `styles.css`:
```css
--transition: all 0.3s ease;      /* Smooth transitions */
--transition-slow: all 0.5s ease; /* Slower animations */
```

## 📊 Analytics Integration

The code includes hooks for Google Analytics:
```javascript
trackEvent('button_click', { button_text: 'Book Now' });
```

To enable, add Google Analytics code to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🛠️ Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | Latest | ✅ Full |
| Edge | Latest | ✅ Full |
| IE | 11 | ⚠️ Limited |

## 📝 Content Guidelines

### Service Descriptions
Keep service descriptions:
- Short (1-2 lines)
- Benefit-focused
- Easy to understand

### Testimonials
Include:
- Customer name
- 5-star rating
- Specific compliment
- Authentic feedback

### Pricing
Always include:
- Service name
- Price range (₹XXX-YYY)
- Clear units

## 🔒 Security

- No sensitive data stored
- Contact form uses WhatsApp (secure)
- No backend authentication needed
- HTTPS recommended for production

## 📦 Deployment

### Local Development
Simply open `index.html` in a browser

### Web Hosting
1. Upload files via FTP/SFTP
2. Ensure all files are in same directory
3. Point domain to hosting account
4. Test all functionality

### CDN Setup
For faster loading:
1. Upload images to CDN
2. Update image URLs in HTML
3. Use CDN for Font Awesome

## 🐛 Troubleshooting

### Issues & Solutions

**Images not loading:**
- Check image URLs are correct
- Verify image paths
- Ensure proper file permissions

**WhatsApp button not working:**
- Verify phone number format (no + or spaces)
- Ensure number is valid
- Check WhatsApp Web access

**Animations not smooth:**
- Check browser support
- Disable extensions
- Clear browser cache

**Form not submitting:**
- Verify all required fields filled
- Check browser console for errors
- Ensure WhatsApp API accessible

## 📞 Support

For issues or customization:
1. Check browser console for errors (F12)
2. Verify all phone numbers are updated
3. Clear cache and reload page
4. Test in different browsers
5. Review console logs for errors

## 📄 License

This website template is free to use and modify for OM Tailor.

## 🎯 Maintenance

### Regular Updates
- Update testimonials monthly
- Refresh gallery images quarterly
- Update prices as needed
- Check links monthly
- Review analytics weekly

### Backup
- Regular backups of files
- Version control recommended
- Keep original files safe

## ✨ Future Enhancements

Suggested improvements:
- [ ] Backend booking system
- [ ] Online payment integration
- [ ] Email newsletter signup
- [ ] Blog section
- [ ] Video testimonials
- [ ] Virtual tour
- [ ] Appointment calendar
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Live chat feature

## 🙏 Credits

**Technologies Used:**
- HTML5
- CSS3 (with Grid & Flexbox)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts
- Unsplash Images (sample only)

**Design Inspiration:**
- Modern luxury boutique websites
- Professional tailoring shops
- Premium fashion brands

---

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Production Ready ✅

**Made with ❤️ for OM Tailor - Nagwa, Birgunj**

For the best experience, view on desktop or mobile device with modern browser.
