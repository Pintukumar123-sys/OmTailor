// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. PRELOADER =====
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 900);
    }

    // ===== 2. AOS INIT =====
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 50 });
    }

    // ===== 3. CUSTOM CURSOR =====
    const cursor = document.getElementById('cursor');
    const cursorRing = document.getElementById('cursorRing');
    if (cursor && cursorRing) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 6 + 'px';
            cursor.style.top  = e.clientY - 6 + 'px';
            cursorRing.style.left = e.clientX - 20 + 'px';
            cursorRing.style.top  = e.clientY - 20 + 'px';
        });
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(2.5)';
                cursorRing.style.transform = 'scale(1.4)';
                cursorRing.style.borderColor = '#D4AF37';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursorRing.style.transform = 'scale(1)';
                cursorRing.style.borderColor = 'rgba(212,175,55,0.6)';
            });
        });
    }

    // ===== 4. HERO PARTICLES =====
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = -Math.random() * 0.6 - 0.2;
                this.opacity = Math.random() * 0.6 + 0.2;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.y < 0 || this.x < 0 || this.x > canvas.width) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#D4AF37';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < 60; i++) particles.push(new Particle());

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // ===== 5. SCROLL PROGRESS + NAVBAR =====
    const scrollProgress = document.getElementById('scrollProgress');
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollProgress) scrollProgress.style.width = ((scrollTop / scrollHeight) * 100) + '%';
        if (navbar) {
            if (scrollTop > 50) {
                navbar.classList.add('bg-premium-dark/95', 'backdrop-blur-md', 'shadow-lg', 'py-2');
                navbar.classList.remove('bg-transparent', 'py-4');
            } else {
                navbar.classList.remove('bg-premium-dark/95', 'backdrop-blur-md', 'shadow-lg', 'py-2');
                navbar.classList.add('bg-transparent', 'py-4');
            }
        }
    });

    // ===== 6. MOBILE MENU =====
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu    = document.getElementById('mobileMenu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        mobileMenu.querySelectorAll('a').forEach(link =>
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'))
        );
    }

    // ===== 7. DARK/LIGHT MODE =====
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const icon = themeToggleBtn.querySelector('i');
            icon.classList.toggle('fa-sun');
            icon.classList.toggle('fa-moon');
        });
    }

    // ===== 8. STATS COUNTER ANIMATION =====
    function animateCounter(el, target, duration = 2000) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
            else el.textContent = Math.floor(start).toLocaleString();
        }, 16);
    }

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        let counted = false;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !counted) {
                counted = true;
                document.querySelectorAll('.stat-number[data-target]').forEach(el => {
                    animateCounter(el, parseInt(el.dataset.target));
                });
            }
        }, { threshold: 0.3 });
        observer.observe(statsSection);
    }

    // ===== 9. SCROLL REVEAL =====
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
            }
        });
    }, { threshold: 0.1 });
    revealEls.forEach(el => revealObserver.observe(el));

    // ===== 10. BEFORE / AFTER SLIDER =====
    const baSlider = document.getElementById('baSlider');
    if (baSlider) {
        const baAfter   = document.getElementById('baAfter');
        const baDivider = document.getElementById('baDivider');
        const baHandle  = document.getElementById('baHandle');
        let isDragging  = false;

        function setPosition(x) {
            const rect = baSlider.getBoundingClientRect();
            let pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
            const leftPct = (pct * 100).toFixed(1);
            const rightPct = (100 - pct * 100).toFixed(1);
            baAfter.style.clipPath = `inset(0 ${rightPct}% 0 0)`;
            baDivider.style.left = leftPct + '%';
            baHandle.style.left  = leftPct + '%';
        }

        baSlider.addEventListener('mousedown',  (e) => { isDragging = true; setPosition(e.clientX); });
        baSlider.addEventListener('touchstart', (e) => { isDragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
        window.addEventListener('mousemove',  (e) => { if (isDragging) setPosition(e.clientX); });
        window.addEventListener('touchmove',  (e) => { if (isDragging) setPosition(e.touches[0].clientX); }, { passive: true });
        window.addEventListener('mouseup',  () => isDragging = false);
        window.addEventListener('touchend', () => isDragging = false);
    }

    // ===== 11. TESTIMONIAL CAROUSEL =====
    const track = document.getElementById('testimonialTrack');
    const dots  = document.querySelectorAll('#testimonialDots button');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    if (track && dots.length) {
        let current = 0;
        const total = track.querySelectorAll('.testimonial-slide').length;

        function goTo(idx) {
            current = (idx + total) % total;
            track.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
        dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

        // Auto-slide every 5s
        setInterval(() => goTo(current + 1), 5000);
    }

    // ===== 12. FAQ ACCORDION =====
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // ===== 13. GALLERY FILTER =====
    const filterBtns  = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-premium-gold', 'text-white');
                b.classList.add('bg-transparent', 'text-gray-300');
            });
            btn.classList.add('bg-premium-gold', 'text-white');
            btn.classList.remove('bg-transparent', 'text-gray-300');
            const filter = btn.dataset.filter;
            galleryItems.forEach(item => {
                const match = filter === 'all' || item.dataset.category === filter;
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    item.style.display = match ? 'block' : 'none';
                    if (match) setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 20);
                }, 300);
            });
        });
    });

    // ===== 14. BOOKING FORM - WhatsApp Integration =====
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name    = bookingForm.querySelector('input[type="text"]').value;
            const phone   = bookingForm.querySelector('input[type="tel"]').value;
            const dress   = bookingForm.querySelector('select').value;
            const date    = bookingForm.querySelector('input[type="date"]').value;
            const message = bookingForm.querySelector('textarea').value;

            const waMsg = encodeURIComponent(
                `Hello OM Tailor! 🌟\n\n` +
                `I'd like to book a stitching appointment:\n` +
                `👤 Name: ${name}\n` +
                `📱 Phone: ${phone}\n` +
                `👗 Dress Type: ${dress}\n` +
                `📅 Date: ${date}\n` +
                `📝 Message: ${message || 'N/A'}`
            );

            const btn = bookingForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-check"></i> Redirecting to WhatsApp...';
            btn.disabled = true;

            setTimeout(() => {
                window.open(`https://wa.me/9779826251077?text=${waMsg}`, '_blank');
                bookingForm.reset();
                btn.innerHTML = 'Confirm Booking';
                btn.disabled = false;
            }, 800);
        });
    }

});

// Map Modal (global scope)
function openMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('mapModal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target.id === 'mapModal') closeMapModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMapModal(); });
    }
});
