/* ===========================
   INITIALIZATION & DOM SETUP
   =========================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupScrollAnimations();
    setupCounterAnimation();
    setupGalleryFilter();
    setupLightbox();
    setupFormHandling();
    setupFloatingButtons();
    setupBackToTop();
    setupSmoothScroll();
    setupCategoryAutoScroll();
    setup3DTiltEffect();
    setupParallaxText();
}

/* ===========================
   NAVIGATION SETUP
   =========================== */

function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Update active navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }

        // Update active nav link
        updateActiveNavLink();
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/* ===========================
   SCROLL ANIMATIONS (AOS-like)
   =========================== */

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                entry.target.style.animation = getAnimationType(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(element => {
        observer.observe(element);
    });
}

function getAnimationType(element) {
    const aosType = element.getAttribute('data-aos');
    const delay = element.getAttribute('data-aos-delay') || 0;

    const animations = {
        'fade-up': `slideInUp 0.8s ease ${delay}ms backwards`,
        'fade-right': `slideInRight 0.8s ease ${delay}ms backwards`,
        'fade-left': `slideInLeft 0.8s ease ${delay}ms backwards`,
        'zoom-in': `scaleIn 0.8s ease ${delay}ms backwards`,
        'fade-up-delay': `slideInUp 0.8s ease 0.2s backwards`,
    };

    return animations[aosType] || animations['fade-up'];
}

/* ===========================
   COUNTER ANIMATION
   =========================== */

function setupCounterAnimation() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-counter'));
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/* ===========================
   GALLERY FILTER
   =========================== */

function setupGalleryFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter gallery items
            const filterValue = button.getAttribute('data-filter');
            galleryItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.classList.remove('hide');
                    item.style.animation = 'scaleIn 0.3s ease';
                } else {
                    item.classList.add('hide');
                }
            });
        });
    });
}

/* ===========================
   LIGHTBOX
   =========================== */

function setupLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxContent = document.querySelector('.lightbox-content');
    const lightboxClose = document.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
        const image = item.querySelector('img');
        item.addEventListener('click', () => {
            lightboxModal.classList.add('active');
            lightboxContent.src = image.src;
        });
    });

    lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
    });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('active');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
            lightboxModal.classList.remove('active');
        }
    });
}

/* ===========================
   FORM HANDLING
   =========================== */

function setupFormHandling() {
    const bookingForm = document.getElementById('bookingForm');

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Get form values
        const name = this.querySelector('input[type="text"]').value;
        const phone = this.querySelector('input[type="tel"]').value;
        const dressType = this.querySelector('select').value;
        const date = this.querySelectorAll('input[type="date"]')[0].value;
        const message = this.querySelector('textarea').value;

        // Validate form
        if (!name || !phone || !dressType || !date) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Create WhatsApp message
        const whatsappMessage = `Hello! I would like to book an appointment.
Name: ${name}
Phone: ${phone}
Dress Type: ${dressType}
Preferred Date: ${date}
Message: ${message || 'N/A'}`;

        // Send to WhatsApp
        const whatsappNumber = '977XXXXXXXXX'; // Update with actual number
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        window.open(whatsappUrl, '_blank');
        showAlert('Redirecting to WhatsApp. Your appointment request has been prepared!', 'success');

        // Reset form
        this.reset();
    });
}

/* ===========================
   FLOATING BUTTONS
   =========================== */

function setupFloatingButtons() {
    const callButton = document.querySelector('.float-call');
    const whatsappButton = document.querySelector('.float-whatsapp');

    callButton.addEventListener('click', function(e) {
        e.preventDefault();
        const phone = '+977XXXXXXXXX'; // Update with actual number
        window.location.href = `tel:${phone}`;
    });

    whatsappButton.addEventListener('click', function(e) {
        e.preventDefault();
        const whatsappNumber = '977XXXXXXXXX'; // Update with actual number
        const message = 'Hello! I am interested in your tailoring services.';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}

/* ===========================
   BACK TO TOP BUTTON
   =========================== */

function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ===========================
   SMOOTH SCROLL
   =========================== */

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ===========================
   CATEGORY AUTO SCROLL
   =========================== */

function setupCategoryAutoScroll() {
    const scrollContainer = document.getElementById('category-scroll');
    if (!scrollContainer) return;

    const scrollDelay = 3000; // 3 seconds

    setInterval(() => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        if (scrollContainer.scrollLeft >= maxScroll - 10) {
            // Reset to beginning smoothly
            scrollContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        } else {
            // Scroll right
            scrollContainer.scrollBy({
                left: 300, 
                behavior: 'smooth'
            });
        }
    }, scrollDelay);
}

/* ===========================
   UTILITY FUNCTIONS
   =========================== */

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(alert);

    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInLeft 0.3s ease reverse';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

/* ===========================
   PERFORMANCE OPTIMIZATIONS
   =========================== */

// Lazy loading images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Debounce function for scroll events
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ===========================
   ADDITIONAL FEATURES
   =========================== */

// Add hover animation to service cards
document.addEventListener('DOMContentLoaded', () => {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) rotateX(5deg)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateX(0)';
        });
    });
});

// Add ripple effect to buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn')) {
        const btn = e.target;
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            animation: ripple-animation 0.6s ease-out;
        `;

        btn.style.position = 'relative';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

// Add CSS animation for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Analytics tracking
function trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
        gtag('event', eventName, eventData);
    }
}

// Page visibility tracking
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        trackEvent('page_hidden');
    } else {
        trackEvent('page_visible');
    }
});

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('button_click', {
            button_text: btn.textContent,
            button_class: btn.className
        });
    });
});

/* ===========================
   PERFORMANCE MONITORING
   =========================== */

// Monitor Core Web Vitals
if ('web-vital' in window) {
    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            console.log('LCP:', entry.renderTime || entry.loadTime);
        }
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
}

// Handle network errors gracefully
window.addEventListener('error', (event) => {
    if (event.target !== window) return;
    console.error('Error:', event.error);
    showAlert('Something went wrong. Please try again.', 'error');
});

// Handle offline status
window.addEventListener('offline', () => {
    showAlert('You are offline. Please check your connection.', 'error');
});

window.addEventListener('online', () => {
    showAlert('You are back online!', 'success');
});

/* ===========================
   SEO & STRUCTURED DATA
   =========================== */

// Inject structured data for rich snippets
function injectStructuredData() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'OM Tailor',
        'image': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
        'description': 'Premium tailoring and custom stitching services in Nagwa Birgunj',
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Nagwa',
            'addressLocality': 'Birgunj',
            'addressCountry': 'NP'
        },
        'telephone': '+977XXXXXXXXX',
        'url': window.location.href,
        'priceRange': '₹100-₹10000',
        'rating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'reviewCount': '150'
        },
        'openingHoursSpecification': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'opens': '09:00',
            'closes': '21:00'
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// Call on page load
window.addEventListener('DOMContentLoaded', injectStructuredData);

/* ===========================
   SERVICE WORKER REGISTRATION
   =========================== */

// Register service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    });
}

/* ===========================
   PRINT STYLES
   =========================== */

window.addEventListener('beforeprint', () => {
    document.querySelectorAll('section').forEach(section => {
        section.style.pageBreakInside = 'avoid';
    });
});

/* ===========================
   ACCESSIBILITY
   =========================== */

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

// Announce dynamic content to screen readers
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

/* ===========================
   PREMIUM 3D EFFECTS & PARALLAX
   =========================== */

function setup3DTiltEffect() {
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            // Add a subtle shine effect if desired
            // card.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), ${-rotateY}px ${rotateX}px 20px rgba(212,175,55,0.1)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            // card.style.boxShadow = '';
        });
    });
}

function setupParallaxText() {
    const parallaxElements = document.querySelectorAll('.parallax-text');
    
    if(parallaxElements.length > 0) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            parallaxElements.forEach(el => {
                const speed = el.getAttribute('data-speed') || 0.5;
                const direction = el.getAttribute('data-direction') === 'left' ? -1 : 1;
                el.style.transform = `translateX(${scrolled * speed * direction}px)`;
            });
        });
    }
}

console.log('OM Tailor - Website Initialized Successfully! 🎉');
