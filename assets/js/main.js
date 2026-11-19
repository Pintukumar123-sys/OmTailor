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

    // ===== 6b. PORTAL DROPDOWN (LOGIN CORNER) =====
    const portalBtn = document.getElementById('portalDropdownBtn');
    const portalMenu = document.getElementById('portalDropdownMenu');
    const portalChevron = document.getElementById('portalDropdownChevron');

    if (portalBtn && portalMenu) {
        portalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = portalMenu.classList.toggle('hidden');
            if (portalChevron) {
                portalChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });

        document.addEventListener('click', (e) => {
            if (!portalMenu.contains(e.target) && !portalBtn.contains(e.target)) {
                portalMenu.classList.add('hidden');
                if (portalChevron) portalChevron.style.transform = 'rotate(0deg)';
            }
        });
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

    // ===== 11. CUSTOMER REVIEWS =====
    const reviewForm = document.getElementById('customerReviewForm');
    const reviewTrack = document.getElementById('testimonialTrack');

    function escapeReviewText(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function renderSubmittedReview(review) {
        if (!reviewTrack) return;
        const name = escapeReviewText(review.name || 'Customer');
        const message = escapeReviewText(review.message || '');
        const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const initial = name.charAt(0).toUpperCase();

        const slide = document.createElement('div');
        slide.className = 'testimonial-slide customer-submitted-review';
        slide.innerHTML = `
            <div class="testimonial-card">
                <div class="testimonial-stars mb-4">${stars}</div>
                <p class="text-gray-300 text-lg font-light leading-relaxed mb-6">"${message}"</p>
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-premium-gold/20 flex items-center justify-center text-premium-gold font-bold text-lg">${escapeReviewText(initial)}</div>
                    <div><p class="font-bold text-white">${name}</p><p class="text-sm text-gray-500">Verified Website Customer</p></div>
                </div>
            </div>
        `;
        reviewTrack.insertBefore(slide, reviewTrack.firstChild);
    }

    async function loadCustomerReviews() {
        const localReviews = JSON.parse(localStorage.getItem('om_customer_reviews') || '[]');
        localReviews.forEach(renderSubmittedReview);

        const client = window.getSupabase ? window.getSupabase() : null;
        if (!client) return;

        try {
            const { data, error } = await client.from('reviews').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) {
                const localKeys = new Set(localReviews.map(review => `${review.name}-${review.message}`));
                data.forEach(review => {
                    const key = `${review.name}-${review.message}`;
                    if (!localKeys.has(key)) renderSubmittedReview(review);
                });
            }
        } catch (err) {
            console.warn('Customer reviews load notice:', err.message);
        }
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nameInput = document.getElementById('reviewName');
            const ratingInput = document.getElementById('reviewRating');
            const messageInput = document.getElementById('reviewMessage');
            const status = document.getElementById('reviewFormStatus');
            const name = nameInput.value.trim();
            const message = messageInput.value.trim();
            const rating = Number(ratingInput.value);
            if (!name || !message) return;

            const review = {
                name,
                message,
                rating,
                created_at: new Date().toISOString()
            };

            const localReviews = JSON.parse(localStorage.getItem('om_customer_reviews') || '[]');
            localReviews.unshift(review);
            localStorage.setItem('om_customer_reviews', JSON.stringify(localReviews.slice(0, 50)));
            renderSubmittedReview(review);

            const client = window.getSupabase ? window.getSupabase() : null;
            if (client) {
                try {
                    await client.from('reviews').insert([review]);
                } catch (err) {
                    console.warn('Customer review cloud save notice:', err.message);
                }
            }

            reviewForm.reset();
            ratingInput.value = '5';
            if (status) {
                status.textContent = 'Review submitted successfully. Thank you!';
                status.className = 'text-sm text-emerald-400 text-center sm:text-left';
            }

            window.location.hash = 'reviews';
        });
    }

    loadCustomerReviews();

    // ===== 12. TESTIMONIAL CAROUSEL =====
    const track = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    const dotsContainer = document.getElementById('testimonialDots');
    if (track && dotsContainer) {
        let current = 0;
        let dots = [];

        function goTo(idx) {
            const slides = track.querySelectorAll('.testimonial-slide');
            const total = slides.length;
            if (!total) return;
            current = (idx + total) % total;
            track.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        function rebuildDots() {
            const slides = track.querySelectorAll('.testimonial-slide');
            dotsContainer.innerHTML = '';
            dots = Array.from(slides, (_, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.setAttribute('aria-label', `Show review ${index + 1}`);
                dot.className = index === current ? 'active' : '';
                dot.addEventListener('click', () => goTo(index));
                dotsContainer.appendChild(dot);
                return dot;
            });
            if (current >= slides.length) current = 0;
            goTo(current);
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
        rebuildDots();
        new MutationObserver(rebuildDots).observe(track, { childList: true });

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

    // ===== 14. SMART DESIGN STUDIO =====
    const studioPhone = '9779826251077';
    const openStudioWhatsApp = (message) => {
        window.open(`https://wa.me/${studioPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const lapelStyle = document.getElementById('lapelStyle');
    const buttonStyle = document.getElementById('buttonStyle');
    const pocketStyle = document.getElementById('pocketStyle');
    const fabricColor = document.getElementById('fabricColor');
    const updateOutfit = () => {
        const lapels = document.getElementById('outfitLapels');
        const buttons = document.getElementById('outfitButtons');
        const pocket = document.getElementById('outfitPocket');
        const body = document.getElementById('outfitBody');
        if (lapels) lapels.className = `outfit-lapels ${lapelStyle?.value || 'peak'}`;
        if (buttons) buttons.className = `outfit-buttons ${buttonStyle?.value || 'two'}`;
        if (pocket) pocket.className = `outfit-pocket ${pocketStyle?.value || 'flap'}`;
        if (body) body.className = `outfit-body ${fabricColor?.value || 'navy'}`;
    };
    [lapelStyle, buttonStyle, pocketStyle, fabricColor].forEach(control => {
        if (control) control.addEventListener('change', updateOutfit);
    });
    updateOutfit();

    document.getElementById('sendDesignWhatsapp')?.addEventListener('click', () => {
        const optionText = id => document.getElementById(id)?.options[document.getElementById(id).selectedIndex]?.text || '';
        openStudioWhatsApp(
            `Hello OM Tailor,\nI customized this coat design:\n\n` +
            `Lapel: ${optionText('lapelStyle')}\nButtons: ${optionText('buttonStyle')}\n` +
            `Pocket: ${optionText('pocketStyle')}\nFabric/Color: ${optionText('fabricColor')}\n\nPlease confirm availability and booking.`
        );
    });

    const estimateInputs = ['estimateFabric', 'estimateGarment', 'estimateSpeed', 'estimateExtra'];
    const estimatePrices = { suit: 4500, safari: 2600, kurta: 1800, lehenga: 6500 };
    const updateEstimate = () => {
        const garment = document.getElementById('estimateGarment')?.value || 'suit';
        let total = estimatePrices[garment] || 4500;
        if (document.getElementById('estimateFabric')?.value === 'shop') total += 2500;
        if (document.getElementById('estimateSpeed')?.value === 'express') total += 1800;
        const extraPrices = { embroidery: 2200, buttons: 600, lining: 900, all: 3700, none: 0 };
        total += extraPrices[document.getElementById('estimateExtra')?.value || 'none'] || 0;
        const result = document.getElementById('estimateResult');
        if (result) result.textContent = `₹${total.toLocaleString('en-IN')}`;
        return total;
    };
    estimateInputs.forEach(id => document.getElementById(id)?.addEventListener('change', updateEstimate));
    updateEstimate();

    document.getElementById('bookWithEstimate')?.addEventListener('click', () => {
        const total = updateEstimate();
        const garment = document.getElementById('estimateGarment');
        const garmentName = garment?.options[garment.selectedIndex]?.text || 'Garment';
        openStudioWhatsApp(`Hello OM Tailor,\nI want to book with this estimate:\nGarment: ${garmentName}\nEstimated Price: ₹${total.toLocaleString('en-IN')}\nPlease confirm final pricing and appointment.`);
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    });

    const brideColor = document.getElementById('brideColor');
    const groomColor = document.getElementById('groomColor');
    const updateCoupleColors = () => {
        const bride = document.getElementById('bridePreview');
        const groom = document.getElementById('groomPreview');
        if (bride) bride.className = `couple-person bride ${brideColor?.value || 'pink'}`;
        if (groom) groom.className = `couple-person groom ${groomColor?.value || 'ivory'}`;
    };
    brideColor?.addEventListener('change', updateCoupleColors);
    groomColor?.addEventListener('change', updateCoupleColors);
    updateCoupleColors();

    document.getElementById('findMyStyle')?.addEventListener('click', () => {
        const occasion = document.getElementById('quizOccasion')?.value;
        const fit = document.getElementById('quizFit')?.value;
        const style = document.getElementById('quizStyle')?.value;
        const suggestions = style === 'Royal Traditional'
            ? ['Royal Sherwani', 'Embroidered Jodhpuri Suit', 'Velvet Indo-Western']
            : ['Slim Notch-Lapel Suit', 'Modern Safari Jacket', 'Minimal Two-Piece Suit'];
        const results = document.getElementById('styleResults');
        if (results) {
            results.classList.remove('hidden');
            results.innerHTML = `<p class="text-premium-gold font-bold mb-2">Best match for ${occasion} • ${fit}</p><ul class="list-disc pl-5 space-y-1">${suggestions.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
    });

    document.getElementById('homeVisitForm')?.addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('homeVisitName')?.value.trim();
        const phone = document.getElementById('homeVisitPhone')?.value.trim();
        const address = document.getElementById('homeVisitAddress')?.value.trim();
        const date = document.getElementById('homeVisitDate')?.value;
        const notes = document.getElementById('homeVisitMessage')?.value.trim();
        openStudioWhatsApp(`Hello OM Tailor,\nI want to book Masterji at Home.\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nPreferred Date/Time: ${date}\nNotes: ${notes || 'None'}`);
    });

    document.getElementById('trialReminderWhatsapp')?.addEventListener('click', () => {
        openStudioWhatsApp('Hello OM Tailor,\nPlease send me a WhatsApp trial reminder for my garment fitting/trial appointment.');
    });

    // ===== 15. BOOKING FORM - WhatsApp Integration =====
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
