// Initialize Lenis for Smooth Scrolling - Robust Check
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// GSAP Register ScrollTrigger - Robust Check
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Custom Cursor
    const cursor = document.querySelector('.custom-cursor');
    const cursorGlow = document.querySelector('.cursor-glow');

    if (cursor && cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(cursorGlow, { x: e.clientX, y: e.clientY, duration: 0.5 });
        });

        document.addEventListener('mousedown', () => gsap.to(cursor, { scale: 0.8, duration: 0.2 }));
        document.addEventListener('mouseup', () => gsap.to(cursor, { scale: 1, duration: 0.2 }));

        const interactiveElements = document.querySelectorAll('a, button, .track-card, .tier-badge');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 2, borderColor: '#00ff88', backgroundColor: 'rgba(0, 255, 136, 0.1)', duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, borderColor: '#00ff88', backgroundColor: 'transparent', duration: 0.3 });
            });
        });
    }

    // Preloader and Video Intro Logic
    const videoIntro = document.querySelector('#video-intro');
    const introVideo = document.querySelector('#intro-video');
    const enterBtn = document.querySelector('#enter-btn');
    const skipIntro = document.querySelector('.skip-intro');

    const exitIntro = () => {
        const tl = gsap.timeline();
        tl.to(videoIntro, { opacity: 0, duration: 1, ease: 'power4.inOut' })
            .call(() => {
                videoIntro.style.display = 'none';
                document.body.classList.remove('loading');
                // Trigger hero animations
                gsap.from('.system-feed', { opacity: 0, y: -20, duration: 0.8 });
                gsap.from('.hero-tagline', { opacity: 0, y: 30, duration: 1, ease: 'power4.out' }, '-=0.4');
                gsap.from('.hero-btns', { opacity: 0, y: 20, duration: 0.8 }, '-=0.6');
                gsap.from('.hero-bg-image', { opacity: 0, scale: 1.1, duration: 2, ease: 'power2.out' }, '-=1.2');
                gsap.to('.hero-content', { y: -20, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            });
        if (introVideo) introVideo.pause();
    };

    const startLoader = () => {
        if (!document.body.classList.contains('loading')) return;

        const tl = gsap.timeline();
        tl.to('.loader-bar', { width: '100%', duration: 1, ease: 'power2.inOut' })
            .to('.preloader', { opacity: 0, duration: 0.8, ease: 'power4.inOut' })
            .call(() => {
                document.querySelector('.preloader').style.display = 'none';
                if (videoIntro) {
                    videoIntro.classList.add('active');
                    gsap.to(videoIntro, { opacity: 1, duration: 1 });
                    if (introVideo) {
                        introVideo.play().catch(e => console.log("Autoplay blocked or video error:", e));
                    }
                    // Animate intro content
                    gsap.to('.intro-status', { opacity: 1, duration: 1, delay: 0.5 });
                    gsap.to('.intro-btn', { opacity: 1, y: 0, duration: 1, delay: 1, ease: 'power4.out' });
                } else {
                    // Fallback if video intro missing
                    document.body.classList.remove('loading');
                }
            });
    };

    const burger = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-link');

    if (burger && navLinks) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        links.forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    if (enterBtn) enterBtn.addEventListener('click', exitIntro);
    if (skipIntro) skipIntro.addEventListener('click', exitIntro);

    window.addEventListener('load', startLoader);

    // Safety Timeout: Force hide preloader if load event hangs
    setTimeout(startLoader, 6000);


    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    // Hero Parallax Effect
    gsap.to('.hero-bg-image', {
        y: '20%',
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

    gsap.to('.hero-content', {
        y: 100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'center center',
            end: 'bottom top',
            scrub: true
        }
    });

    // Reveal Animations on Scroll
    const revealElements = document.querySelectorAll('.ui-panel, .mission-briefing, .track-card, .benefit-panel, .tier-badge');
    revealElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 85%' },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Track Card Gloss Effect
    const cards = document.querySelectorAll('.track-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    // Neural Network Background - Enhanced Version
    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null, radius: 180 };

    const colors = [
        '#00ff88', // Neon Green
        '#00cc6a', // Medium Green
        '#062b1e', // Emerald
        '#ffffff'  // Pure White (small sparse ones)
    ];

    function init() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particles = [];
        const numberOfParticles = (canvas.width * canvas.height) / 10000;
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle());
        }
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.alpha = Math.random() * 0.5 + 0.2;
            this.pulse = Math.random() * 0.02;
            this.pulseDirection = 1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Pulse opacity
            this.alpha += this.pulse * this.pulseDirection;
            if (this.alpha > 0.8 || this.alpha < 0.2) this.pulseDirection *= -1;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }

    function connect() {
        const maxDistance = 150;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = (1 - (distance / maxDistance)) * 0.15;
                    ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();

                    // Active signal effect (occasional bright signals)
                    if (Math.random() > 0.9995) {
                        ctx.strokeStyle = `rgba(0, 255, 136, 0.8)`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            }

            // Mouse Proximity Interaction
            if (mouse.x != null) {
                const dxMouse = particles[a].x - mouse.x;
                const dyMouse = particles[a].y - mouse.y;
                const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                if (distanceMouse < mouse.radius) {
                    const opacity = (1 - (distanceMouse / mouse.radius)) * 0.4;
                    ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                    ctx.lineWidth = 1.5;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = '#00ff88';
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connect();
        requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('resize', () => {
        init();
    });

    init();
    animate();

    // FAQ Accordion Interaction
    const faqBoxes = document.querySelectorAll('.faq-box');
    faqBoxes.forEach(box => {
        const trigger = box.querySelector('.faq-trigger');
        if (trigger) {
            trigger.addEventListener('click', () => {
                const isActive = box.classList.contains('active');
                faqBoxes.forEach(b => b.classList.remove('active'));
                if (!isActive) box.classList.add('active');
            });
        }
    });

    // Reveal Animations for New Sections
    const revealOnScroll = () => {
        const revealables = document.querySelectorAll('.timeline-item, .flow-box, .prize-card, .event-category-card, .poster-card');
        revealables.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.9) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    };

    // Initial state for revealables
    document.querySelectorAll('.timeline-item, .flow-box, .prize-card, .event-category-card, .poster-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

} else {
    // Fallback if GSAP is blocked
    window.addEventListener('load', () => {
        document.querySelector('.preloader').style.display = 'none';
        document.body.classList.remove('loading');
    });
    setTimeout(() => {
        const loader = document.querySelector('.preloader');
        if (loader) loader.style.display = 'none';
        document.body.classList.remove('loading');
    }, 4000);
}
