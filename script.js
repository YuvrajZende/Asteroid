/* ========================================
   ASTEROID - AI Search Landing Page
   GSAP Animations & Scroll Frame Animation
   ======================================== */

// Configuration
const FRAME_COUNT = 87;
const FRAME_PATH = './src/frames/ezgif-frame-';
const LOADING_DURATION = 8000; // 8 seconds

// Global variables
let canvas, ctx;
let images = [];
let currentFrame = 1;
let imagesLoaded = 0;
let frameAnimationReady = false;

/* ========================================
   LOADING SCREEN - AURIGA STYLE
   ======================================== */

function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const loadingVideo = document.getElementById('loading-video');
    const loadingBar = document.getElementById('loading-bar');
    const asteroidTextFront = document.getElementById('asteroid-text-front');
    const loadingText = document.getElementById('loading-text');

    if (!loadingScreen || !mainContent) {
        // No loading screen, start animations immediately
        initAllAnimations();
        return;
    }

    // Play video from the beginning
    if (loadingVideo) {
        loadingVideo.currentTime = 0;
        loadingVideo.play();
    }

    // Loading status text animation
    const statusTexts = ['SENDING...', 'LOADING...', 'PREPARING...', 'ALMOST READY...'];
    let textIndex = 0;
    const textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % statusTexts.length;
        if (loadingText) {
            loadingText.textContent = statusTexts[textIndex];
        }
    }, 2000);

    // Create GSAP timeline for loading animation
    const loadingTl = gsap.timeline({
        onComplete: () => {
            clearInterval(textInterval);

            // Update text to complete
            if (loadingText) {
                loadingText.textContent = 'COMPLETE!';
            }

            // Add a small delay before hiding
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainContent.classList.add('visible');

                // Pause video when hidden
                if (loadingVideo) {
                    loadingVideo.pause();
                }

                // Start all GSAP animations AFTER loading ends
                initAllAnimations();
            }, 300);
        }
    });

    // Animate progress bar to 100%
    loadingTl.to(loadingBar, {
        width: '100%',
        duration: LOADING_DURATION / 1000,
        ease: 'power1.inOut',
        onUpdate: function () {
            // Sync the text reveal with progress bar
            const progress = this.progress();
            const clipValue = 100 - (progress * 100);
            if (asteroidTextFront) {
                asteroidTextFront.style.clipPath = `inset(0 ${clipValue}% 0 0)`;
            }
        }
    });
}

function initAllAnimations() {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initialize hero animations
    initHeroAnimations();
    initScrollAnimations();
    initCounterAnimations();

    // Initialize canvas and start loading frames
    initCanvas();
    preloadImages();

    // Initialize cursor effects
    initTrailingCursor();
    initFloatingElements();
}

// Initialize loading screen when DOM is ready
document.addEventListener('DOMContentLoaded', initLoadingScreen);

/* ========================================
   CANVAS & FRAME ANIMATION
   ======================================== */

function initCanvas() {
    canvas = document.getElementById('planet-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 1280;
    canvas.height = 720;
}

function preloadImages() {
    if (!canvas) return;

    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(3, '0');
        img.src = `${FRAME_PATH}${frameNum}.jpg`;

        img.onload = () => {
            imagesLoaded++;

            // Draw first frame as soon as it loads
            if (i === 1) {
                drawFrame(1);
            }

            // All images loaded
            if (imagesLoaded === FRAME_COUNT) {
                frameAnimationReady = true;
                initFrameScrollAnimation();
            }
        };

        img.onerror = () => {
            console.log(`Failed to load frame ${i}`);
        };

        images.push(img);
    }
}

function drawFrame(frameIndex) {
    if (!ctx) return;

    const img = images[frameIndex - 1];
    if (img && img.complete && img.naturalWidth > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

function initFrameScrollAnimation() {
    if (!frameAnimationReady) return;

    // Create scroll trigger for frame animation
    ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.3,
        onUpdate: (self) => {
            // Calculate which frame to show based on scroll progress
            const frame = Math.floor(self.progress * (FRAME_COUNT - 1)) + 1;
            if (frame !== currentFrame && frame >= 1 && frame <= FRAME_COUNT) {
                currentFrame = frame;
                drawFrame(currentFrame);
            }
        },
        onLeaveBack: () => {
            // Reset to first frame when scrolling back to top
            currentFrame = 1;
            drawFrame(1);
        }
    });
}

/* ========================================
   HERO ANIMATIONS
   ======================================== */

function initHeroAnimations() {
    // Create main timeline for hero
    const heroTl = gsap.timeline({
        defaults: {
            ease: 'power3.out'
        }
    });

    // Set initial states (nav is always visible, not animated)
    gsap.set('#planet', { opacity: 0, scale: 0.9 });
    gsap.set('#headline-top', { opacity: 0, x: -80 });
    gsap.set('#headline-bottom', { opacity: 0, x: 80 });
    gsap.set('.description-top', { opacity: 0, y: 30 });
    gsap.set('.description-bottom', { opacity: 0, y: 30 });
    gsap.set('#cta', { opacity: 0, y: 40 });

    // Planet entrance with scale
    heroTl.to('#planet', {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: 'power2.out'
    }, '-=0.7');

    // Headlines entrance
    heroTl.to('#headline-top', {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power3.out'
    }, '-=1.2');

    heroTl.to('#headline-bottom', {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power3.out'
    }, '-=1');

    // Descriptions fade in
    heroTl.to('.description-top', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out'
    }, '-=0.8');

    heroTl.to('.description-bottom', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out'
    }, '-=0.7');

    // CTA button
    heroTl.to('#cta', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
    }, '-=0.5');
}

/* ========================================
   SCROLL ANIMATIONS
   ======================================== */

function initScrollAnimations() {
    // Fade out hero text on scroll
    gsap.to('.headlines-layer', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '50% top',
            scrub: 1
        },
        opacity: 0,
        y: -80,
        ease: 'none'
    });

    gsap.to('.descriptions-layer', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '40% top',
            scrub: 1
        },
        opacity: 0,
        y: -50,
        ease: 'none'
    });

    // Features section - animate from hidden to visible
    gsap.fromTo('.features .section-header',
        { opacity: 0, y: 50 },
        {
            scrollTrigger: {
                trigger: '.features',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 1
        }
    );

    // Feature cards stagger animation
    gsap.fromTo('.feature-card',
        { opacity: 0, y: 60 },
        {
            scrollTrigger: {
                trigger: '.features-grid',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out'
        }
    );

    // ========================================
    // PROVIDERS SECTION - ADVANCED GSAP EFFECTS
    // ========================================

    // Create timeline for providers section
    const providersTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.providers',
            start: 'top 80%',
            end: 'center center',
            toggleActions: 'play none none reverse'
        }
    });

    // Section label - slide in from left with clip path
    providersTl.fromTo('.section-header-left .section-label',
        {
            opacity: 0,
            x: -50,
            clipPath: 'inset(0 100% 0 0)'
        },
        {
            opacity: 1,
            x: 0,
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.8,
            ease: 'power3.out'
        }
    );

    // Title - dramatic reveal with split effect
    providersTl.fromTo('.section-header-left .section-title',
        {
            opacity: 0,
            y: 60,
            rotationX: 45,
            transformOrigin: 'center bottom'
        },
        {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 1,
            ease: 'power4.out'
        },
        '-=0.4'
    );

    // Subtitle - fade in with blur
    providersTl.fromTo('.section-header-left .section-subtitle',
        {
            opacity: 0,
            y: 30,
            filter: 'blur(10px)'
        },
        {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power2.out'
        },
        '-=0.6'
    );

    // Provider cards - staggered 3D entrance
    providersTl.fromTo('.providers-grid .provider-item',
        {
            opacity: 0,
            y: 80,
            x: -30,
            rotationY: 15,
            scale: 0.8,
            transformOrigin: 'left center'
        },
        {
            opacity: 1,
            y: 0,
            x: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.7,
            stagger: {
                each: 0.12,
                from: 'start'
            },
            ease: 'back.out(1.4)'
        },
        '-=0.4'
    );

    // Video showcase - cinematic entrance
    providersTl.fromTo('.video-showcase',
        {
            opacity: 0,
            scale: 0.85,
            x: 100,
            rotationY: -10,
            transformOrigin: 'center center'
        },
        {
            opacity: 1,
            scale: 1,
            x: 0,
            rotationY: 0,
            duration: 1.2,
            ease: 'power3.out'
        },
        '-=0.8'
    );

    // Video parallax effect on scroll
    gsap.to('.showcase-video', {
        scrollTrigger: {
            trigger: '.providers',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        scale: 1.1,
        ease: 'none'
    });

    // Floating glow effect on video container
    gsap.to('.video-container', {
        boxShadow: '0 35px 100px rgba(74, 144, 217, 0.25), 0 0 0 1px rgba(74, 144, 217, 0.2)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    // Provider logos subtle float animation
    gsap.to('.provider-logo', {
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: {
            each: 0.3,
            from: 'random'
        }
    });

    // How it works section
    gsap.fromTo('.how-it-works .section-header',
        { opacity: 0, y: 40 },
        {
            scrollTrigger: {
                trigger: '.how-it-works',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.8
        }
    );

    // Steps stagger animation
    gsap.fromTo('.step',
        { opacity: 0, x: -50 },
        {
            scrollTrigger: {
                trigger: '.steps-container',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        }
    );

    // ========================================
    // HOW IT WORKS SECTION - ADVANCED EFFECTS
    // ========================================

    const howItWorksTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.how-it-works',
            start: 'top 80%',
            end: 'center center',
            toggleActions: 'play none none reverse'
        }
    });

    // Video entrance from left with 3D rotation
    howItWorksTl.fromTo('.how-it-works .video-showcase',
        {
            opacity: 0,
            x: -120,
            rotationY: 15,
            scale: 0.9,
            transformOrigin: 'left center'
        },
        {
            opacity: 1,
            x: 0,
            rotationY: 0,
            scale: 1,
            duration: 1.2,
            ease: 'power3.out'
        }
    );

    // Section label reveal
    howItWorksTl.fromTo('.section-header-right .section-label',
        {
            opacity: 0,
            x: 50,
            clipPath: 'inset(0 0 0 100%)'
        },
        {
            opacity: 1,
            x: 0,
            clipPath: 'inset(0 0 0 0%)',
            duration: 0.7,
            ease: 'power3.out'
        },
        '-=0.8'
    );

    // Title with 3D flip
    howItWorksTl.fromTo('.section-header-right .section-title',
        {
            opacity: 0,
            y: 40,
            rotationX: 35,
            transformOrigin: 'center bottom'
        },
        {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.9,
            ease: 'power4.out'
        },
        '-=0.5'
    );

    // Subtitle blur in
    howItWorksTl.fromTo('.section-header-right .section-subtitle',
        {
            opacity: 0,
            y: 20,
            filter: 'blur(8px)'
        },
        {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.6,
            ease: 'power2.out'
        },
        '-=0.5'
    );

    // Steps staggered entrance
    howItWorksTl.fromTo('.step',
        {
            opacity: 0,
            x: 60,
            y: 20,
            scale: 0.95
        },
        {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: 'back.out(1.2)'
        },
        '-=0.4'
    );

    // Video parallax for How It Works
    gsap.to('.how-it-works .showcase-video', {
        scrollTrigger: {
            trigger: '.how-it-works',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        },
        scale: 1.08,
        ease: 'none'
    });

    // Step numbers pulse animation
    gsap.to('.step-number', {
        textShadow: '0 0 20px rgba(74, 144, 217, 0.5)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: {
            each: 0.2,
            from: 'start'
        }
    });

    // Stats section
    gsap.fromTo('.stat-item',
        { opacity: 0, y: 30 },
        {
            scrollTrigger: {
                trigger: '.stats',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        }
    );

    // Final CTA section
    gsap.fromTo('.cta-content',
        { opacity: 0, y: 50, scale: 0.95 },
        {
            scrollTrigger: {
                trigger: '.final-cta',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out'
        }
    );
}

/* ========================================
   COUNTER ANIMATIONS
   ======================================== */

function initCounterAnimations() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    statNumbers.forEach(stat => {
        const target = parseInt(stat.dataset.count);

        ScrollTrigger.create({
            trigger: stat,
            start: 'top 85%',
            onEnter: () => {
                gsap.to(stat, {
                    innerText: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { innerText: 1 },
                    onUpdate: function () {
                        stat.innerText = Math.round(this.targets()[0].innerText);
                    }
                });
            },
            once: true
        });
    });
}

/* ========================================
   SMOOTH SCROLL FOR ANCHORS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

/* ========================================
   TRAILING CURSOR EFFECT (Hero Section Only)
   ======================================== */

function initTrailingCursor() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // Trail configuration
    const trailImages = [
        'src/cursor-planet.png',
        'src/cursor-alien.png',
        'src/cursor-ghost.png',
        'src/cursor-ufo.png',
        'src/cursor-asteroid.png'
    ];

    const trailCount = 12; // Number of trailing elements
    const trailDelay = 0.08; // Delay between each trail element (seconds)
    const trails = [];

    // Create trail elements
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';

        const img = document.createElement('img');
        img.src = trailImages[i % trailImages.length];
        img.alt = '';

        trail.appendChild(img);
        document.body.appendChild(trail);
        trails.push({
            el: trail,
            x: 0,
            y: 0,
            currentX: 0,
            currentY: 0
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isInHero = false;

    // Track mouse position and check if in hero section
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Check if mouse is within hero section bounds
        const heroRect = hero.getBoundingClientRect();
        const wasInHero = isInHero;
        isInHero = (
            e.clientY >= heroRect.top &&
            e.clientY <= heroRect.bottom &&
            e.clientX >= heroRect.left &&
            e.clientX <= heroRect.right
        );

        // Update active class when entering/leaving hero
        if (isInHero && !wasInHero) {
            trails.forEach(trail => trail.el.classList.add('active'));
        } else if (!isInHero && wasInHero) {
            trails.forEach(trail => trail.el.classList.remove('active'));
        }
    });

    // Animation loop for smooth trailing
    function animateTrails() {
        trails.forEach((trail, index) => {
            // Each trail follows the previous one with a delay
            const targetX = index === 0 ? mouseX : trails[index - 1].currentX;
            const targetY = index === 0 ? mouseY : trails[index - 1].currentY;

            // Smooth lerp
            const speed = 0.15 - (index * 0.008);
            trail.currentX += (targetX - trail.currentX) * Math.max(speed, 0.02);
            trail.currentY += (targetY - trail.currentY) * Math.max(speed, 0.02);

            // Apply position with slight offset and rotation
            const rotation = Math.sin(Date.now() * 0.002 + index) * 15;
            const scale = 1 - (index * 0.05);

            gsap.set(trail.el, {
                x: trail.currentX - 20,
                y: trail.currentY - 20,
                rotation: rotation,
                scale: Math.max(scale, 0.4),
                opacity: isInHero ? (1 - index * 0.07) : 0
            });
        });

        requestAnimationFrame(animateTrails);
    }

    animateTrails();
}

/* ========================================
   FLOATING SPACE ELEMENTS
   ======================================== */

function initFloatingElements() {
    const floatingImages = [
        'src/cursor-planet.png',
        'src/cursor-alien.png',
        'src/cursor-ghost.png',
        'src/cursor-ufo.png',
        'src/cursor-asteroid.png'
    ];

    const floatingElements = [];
    const elementCount = 15; // More floating elements

    // Create floating elements
    for (let i = 0; i < elementCount; i++) {
        const el = document.createElement('div');
        el.className = 'floating-element';

        const img = document.createElement('img');
        img.src = floatingImages[i % floatingImages.length];
        img.alt = '';

        el.appendChild(img);
        document.body.appendChild(el);

        // Random initial position within viewport
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;

        floatingElements.push({
            el: el,
            x: startX,
            y: startY,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 1,
            scale: 0.5 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI * 2
        });

        // Set initial position
        gsap.set(el, {
            x: startX,
            y: startY,
            scale: floatingElements[i].scale,
            rotation: floatingElements[i].rotation
        });
    }

    // Animate floating elements
    function animateFloating() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        floatingElements.forEach((item, index) => {
            // Update position with drift
            item.x += item.speedX;
            item.y += item.speedY;
            item.rotation += item.rotationSpeed;

            // Add gentle floating motion
            const floatY = Math.sin(Date.now() * 0.001 + item.floatOffset) * 15;
            const floatX = Math.cos(Date.now() * 0.0008 + item.floatOffset) * 10;

            // Wrap around screen edges (viewport only)
            if (item.x < -80) item.x = viewportWidth + 40;
            if (item.x > viewportWidth + 80) item.x = -40;
            if (item.y < -80) item.y = viewportHeight + 40;
            if (item.y > viewportHeight + 80) item.y = -40;

            // Store actual position for collision detection
            item.actualX = item.x + floatX;
            item.actualY = item.y + floatY;

            // Apply animation (pure fixed positioning)
            gsap.set(item.el, {
                x: item.actualX,
                y: item.actualY,
                rotation: item.rotation,
                scale: item.scale,
                opacity: 0.6
            });
        });

        // Collision detection between elements
        checkCollisions();

        requestAnimationFrame(animateFloating);
    }

    // Track recent collisions to prevent spam
    const recentCollisions = new Set();

    function checkCollisions() {
        const collisionDistance = 50; // Distance to trigger collision

        for (let i = 0; i < floatingElements.length; i++) {
            for (let j = i + 1; j < floatingElements.length; j++) {
                const a = floatingElements[i];
                const b = floatingElements[j];

                const dx = a.actualX - b.actualX;
                const dy = a.actualY - b.actualY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const collisionKey = `${i}-${j}`;

                if (distance < collisionDistance) {
                    if (!recentCollisions.has(collisionKey)) {
                        // Create spark at collision point
                        const sparkX = (a.actualX + b.actualX) / 2;
                        const sparkY = (a.actualY + b.actualY) / 2;
                        createSpark(sparkX, sparkY);

                        // Mark as recent collision
                        recentCollisions.add(collisionKey);

                        // Clear after cooldown
                        setTimeout(() => {
                            recentCollisions.delete(collisionKey);
                        }, 1000);
                    }
                }
            }
        }
    }

    function createSpark(x, y) {
        const spark = document.createElement('div');
        spark.className = 'collision-spark';
        document.body.appendChild(spark);

        gsap.set(spark, { x: x, y: y });

        // Remove after animation
        setTimeout(() => {
            spark.remove();
        }, 600);
    }

    animateFloating();

    // Reposition elements on resize
    window.addEventListener('resize', () => {
        floatingElements.forEach(item => {
            if (item.x > window.innerWidth) {
                item.x = Math.random() * window.innerWidth;
            }
        });
    });
}
