// Initialize GSAP & ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// WhatsApp Configuration
const WHATSAPP_NUMBER = "923000000000"; // Replace with owner's number

// Global State
const totalFrames = 192;
const images = [];
let loadedCount = 0;
let isLoaded = false;

// Canvas DOM refs
const canvas = document.getElementById('perfume-canvas');
const ctx = canvas.getContext('2d');
const particlesCanvas = document.getElementById('particles-canvas');
const pCtx = particlesCanvas.getContext('2d');
const ambientGlow = document.getElementById('ambient-glow');

// Mouse tracking for Parallax and Particles
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const mouseOffset = { x: 0, y: 0 };
const parallaxStrength = 22; // Maximum pixel shift for 3D parallax

// Particle list
let particles = [];
const particleCount = 65;
let lastScrollY = window.scrollY;
let scrollVelocity = 0;

// Web Audio API Synthesizer Context
let audioCtx = null;
let masterGain = null;
let oscillators = [];
let filterNode = null;
let lfoNode = null;
let isMuted = true;

// Helper to get frame paths
const frameUrl = (index) => `Fram Pictures/ffout${String(index).padStart(3, '0')}.gif`;

// ----------------------------------------------------
// 1. Asset Loading and Preloader System
// ----------------------------------------------------
function initPreloader() {
  const progressBar = document.getElementById('progress-bar');
  const loaderCounter = document.getElementById('loader-counter');
  
  const requiredInitialFrames = 35; // Unlock site early

  // Preload frames sequentially
  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    
    img.onload = () => {
      loadedCount++;
      
      if (loadedCount <= requiredInitialFrames) {
        const percentage = Math.round((loadedCount / requiredInitialFrames) * 100);
        progressBar.style.width = `${percentage}%`;
        loaderCounter.innerText = `${percentage}%`;
      }
      
      // Draw first frame immediately once loaded to prevent blank screen
      if (i === 1) {
        drawFrame(0);
      }
      
      if (loadedCount === requiredInitialFrames) {
        onLoadingComplete();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === requiredInitialFrames) {
        onLoadingComplete();
      }
    };

    img.src = frameUrl(i);
    images.push(img);
  }
}

function onLoadingComplete() {
  isLoaded = true;
  document.getElementById('preloader').classList.add('loaded');
  document.body.classList.remove('loading');
  
  // Setup animations and scrolltriggers
  initScrollAnimations();
  initLenis();
  initParticles();
  init3DTilt();
  initComparisonAnimations();
  initWhatsAppTriggers();
  animate();
}

// ----------------------------------------------------
// 2. Responsive Canvas Rendering
// ----------------------------------------------------
function resizeCanvases() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;

  if (isLoaded) {
    const activeFrame = Math.floor(perfumeSequence.frame);
    drawFrame(activeFrame);
  }
}

// Draw frame using Cover Fit calculation with mouse parallax displacement
function drawFrame(index) {
  const img = images[index];
  if (!img) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.width || 1920;
  const ih = img.height || 1080;

  // Cover aspect ratio
  const ratio = Math.max(cw / iw, ch / ih);
  
  // Draw with slightly oversized scale (1.05) to accommodate the parallax movements without showing blank edges
  const renderScale = 1.05;
  const nw = iw * ratio * renderScale;
  const nh = ih * ratio * renderScale;

  // Calculate centered position plus mouse parallax shift
  const x = (cw - nw) / 2 + mouseOffset.x;
  const y = (ch - nh) / 2 + mouseOffset.y;

  ctx.drawImage(img, x, y, nw, nh);
}

// ----------------------------------------------------
// 3. GSAP Scroll Scrubber
// ----------------------------------------------------
const perfumeSequence = { frame: 0 };

function initScrollAnimations() {
  // Bind scroll triggers for text fades
  const chapters = ['#chapter-2', '#chapter-3', '#chapter-4', '#chapter-5', '#chapter-6', '#chapter-7', '#chapter-8', '#chapter-9'];
  
  chapters.forEach((id) => {
    const section = document.querySelector(id);
    const card = section.querySelector('.story-card');
    
    ScrollTrigger.create({
      trigger: section,
      start: "top 65%",
      end: "bottom 35%",
      onEnter: () => card.classList.add('active'),
      onLeave: () => card.classList.remove('active'),
      onEnterBack: () => card.classList.add('active'),
      onLeaveBack: () => card.classList.remove('active')
    });
  });

  // Hero Card trigger
  const heroCard = document.querySelector('#chapter-hero .story-card');
  ScrollTrigger.create({
    trigger: '#chapter-hero',
    start: "top top",
    end: "bottom 30%",
    onLeave: () => heroCard.classList.remove('active'),
    onEnterBack: () => heroCard.classList.add('active')
  });

  // Fade out Hero floating bottle on scroll down
  ScrollTrigger.create({
    trigger: '#chapter-hero',
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      const bottle = document.getElementById('hero-bottle-container');
      if (bottle) {
        bottle.style.opacity = Math.max(0, 1 - self.progress * 1.6);
      }
    }
  });

  // Final Card trigger
  const finalCard = document.querySelector('#chapter-10 .story-card');
  ScrollTrigger.create({
    trigger: '#chapter-10',
    start: "top 70%",
    end: "bottom bottom",
    onEnter: () => finalCard.classList.add('active'),
    onLeaveBack: () => finalCard.classList.remove('active')
  });

  // Animate the image frame index directly mapped to scroll progress
  gsap.to(perfumeSequence, {
    frame: totalFrames - 1,
    snap: "frame",
    ease: "none",
    scrollTrigger: {
      trigger: ".story-scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: () => {
        const currentFrameIndex = Math.floor(perfumeSequence.frame);
        drawFrame(currentFrameIndex);
        
        // Dynamic sound adjustment based on scroll (opens filter cutoff)
        updateSynthFilterOnScroll(currentFrameIndex / totalFrames);
      }
    }
  });

  // Smoothly fade out Canvas container during the cinematic transition section
  ScrollTrigger.create({
    trigger: '#chapter-transition',
    start: "top bottom",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      // Fade out from 1 to 0 across the transition section
      const opacity = Math.max(0, 1 - (self.progress * 1.5));
      document.getElementById('canvas-container').style.opacity = opacity;
      
      if (self.progress > 0.05) {
        document.getElementById('scroll-indicator').classList.add('hidden');
      } else {
        document.getElementById('scroll-indicator').classList.remove('hidden');
      }
    }
  });

  // Handle Navbar styling on scroll
  ScrollTrigger.create({
    start: "top -50px",
    onEnter: () => document.querySelector('.luxury-navbar').classList.add('scrolled'),
    onLeaveBack: () => document.querySelector('.luxury-navbar').classList.remove('scrolled')
  });
}

// ----------------------------------------------------
// 4. Lenis Smooth Scroll Integration
// ----------------------------------------------------
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// ----------------------------------------------------
// 5. Interactive Particle System
// ----------------------------------------------------
class Particle {
  constructor() {
    this.reset();
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
  }

  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = window.innerHeight + Math.random() * 50;
    this.size = Math.random() * 2 + 0.8;
    this.alpha = Math.random() * 0.4 + 0.15;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.speedY = -(Math.random() * 0.8 + 0.4);
    
    const goldTones = [
      'rgba(212, 175, 55, ',
      'rgba(243, 210, 138, ',
      'rgba(255, 216, 122, ',
      'rgba(255, 244, 210, '
    ];
    this.colorBase = goldTones[Math.floor(Math.random() * goldTones.length)];
  }

  update() {
    this.y += this.speedY - (scrollVelocity * 0.05);
    this.x += this.speedX;

    const dx = mouse.targetX - this.x;
    const dy = mouse.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 320) {
      const force = (320 - dist) / 320;
      this.x += dx * force * 0.015;
      this.y += dy * force * 0.015;
    }

    if (this.y < -10) {
      this.reset();
    }
    if (this.x < -10) this.x = window.innerWidth + 10;
    if (this.x > window.innerWidth + 10) this.x = -10;
  }

  draw() {
    pCtx.save();
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fillStyle = this.colorBase + this.alpha + ')';
    
    if (this.size > 1.8) {
      pCtx.shadowBlur = 6;
      pCtx.shadowColor = 'rgba(255, 216, 122, 0.6)';
    }
    
    pCtx.fill();
    pCtx.restore();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function updateParticles() {
  pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
}

// ----------------------------------------------------
// 6. Interactive 3D Card Tilt & Hero Parallax
// ----------------------------------------------------
function init3DTilt() {
  // Collection Cards Tilt
  const cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const normX = (x / rect.width) - 0.5;
      const normY = (y / rect.height) - 0.5;
      
      const maxRot = 10; // Degrees of rotation
      const rotX = -normY * maxRot;
      const rotY = normX * maxRot;
      
      card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });

  // Hero Bottle Mouse Parallax Rotation
  const heroBottle = document.getElementById('hero-bottle');
  if (heroBottle) {
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      
      const rotX = -ny * 16;
      const rotY = nx * 16;
      
      heroBottle.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.04)`;
    });
  }
}

// ----------------------------------------------------
// 7. Why Ayzal Ayra Statistics progression trigger
// ----------------------------------------------------
function initComparisonAnimations() {
  const statsSection = document.getElementById('why-stats-trigger');
  if (!statsSection) return;

  ScrollTrigger.create({
    trigger: statsSection,
    start: "top 80%",
    onEnter: () => {
      const fills = statsSection.querySelectorAll('.stat-bar-fill');
      fills.forEach(fill => {
        fill.style.width = fill.getAttribute('data-percent');
      });

      const values = statsSection.querySelectorAll('.stat-value');
      values.forEach(val => {
        const target = parseInt(val.getAttribute('data-target'));
        const suffix = (target === 18) ? 'h' : '%';
        const counter = { val: 0 };
        
        gsap.to(counter, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            val.innerText = Math.round(counter.val) + suffix;
          }
        });
      });
    }
  });
}

// ----------------------------------------------------
// 8. Web Audio API Ambient Synthesizer
// ----------------------------------------------------
function initAudio() {
  if (audioCtx) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  // Create Master Gain
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

  // Create low-pass filter
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.setValueAtTime(320, audioCtx.currentTime);
  filterNode.Q.setValueAtTime(1.2, audioCtx.currentTime);

  filterNode.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  // Evolving LFO to modulate filter cutoff
  lfoNode = audioCtx.createOscillator();
  lfoNode.type = 'sine';
  lfoNode.frequency.setValueAtTime(0.08, audioCtx.currentTime);

  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(120, audioCtx.currentTime);

  lfoNode.connect(lfoGain);
  lfoGain.connect(filterNode.frequency);
  lfoNode.start();

  // Build luxury chord (C Minor 9)
  const notes = [
    { freq: 130.81, type: 'sawtooth', gain: 0.15 },
    { freq: 196.00, type: 'sine', gain: 0.25 },
    { freq: 293.66, type: 'triangle', gain: 0.18 },
    { freq: 311.13, type: 'triangle', gain: 0.20 },
    { freq: 466.16, type: 'sine', gain: 0.15 }
  ];

  notes.forEach(note => {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    
    osc.type = note.type;
    osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 8, audioCtx.currentTime);

    oscGain.gain.setValueAtTime(note.gain, audioCtx.currentTime);
    
    osc.connect(oscGain);
    oscGain.connect(filterNode);
    osc.start();

    oscillators.push(osc);
  });
}

function toggleAudio() {
  if (isMuted) {
    if (!audioCtx) initAudio();
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    masterGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 2.0);
    document.getElementById('audio-btn').classList.add('playing');
    document.getElementById('audio-text').innerText = "Mute Ambient";
    isMuted = false;
  } else {
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        if (isMuted && audioCtx) audioCtx.suspend();
      }, 900);
    }
    document.getElementById('audio-btn').classList.remove('playing');
    document.getElementById('audio-text').innerText = "Play Ambient";
    isMuted = true;
  }
}

// Adjust synthesizer filter cutoff frequency based on scroll progress
function updateSynthFilterOnScroll(scrollProgress) {
  if (!filterNode || isMuted) return;

  const targetFrequency = 320 + (scrollProgress * 530);
  filterNode.frequency.setTargetAtTime(targetFrequency, audioCtx.currentTime, 0.4);
}

// ----------------------------------------------------
// 9. WhatsApp Checkout Redirection Trigger
// ----------------------------------------------------
function handleWhatsAppRedirect(productName = "") {
  let message = "Hello, I want to order AYZAL AYRA perfume";
  if (productName) {
    message = `Hello, I would like to order ${productName}.`;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function initWhatsAppTriggers() {
  const triggers = document.querySelectorAll('.whatsapp-trigger');
  
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = trigger.getAttribute('data-product') || "";
      handleWhatsAppRedirect(product);
    });
  });

  const cardBtns = document.querySelectorAll('.card-btn');
  cardBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.showcase-card');
      const product = card ? card.getAttribute('data-product') : "Golden Aura";
      handleWhatsAppRedirect(product);
    });
  });
}

// ----------------------------------------------------
// 10. Event Listeners & Main Rendering loop
// ----------------------------------------------------
function initEventListeners() {
  window.addEventListener('resize', resizeCanvases);

  // Mousemove events for bokeh parallax and dynamic overlay glows
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;

    // Shift radial ambient light spot
    const glowX = (e.clientX / window.innerWidth) * 100;
    const glowY = (e.clientY / window.innerHeight) * 100;
    ambientGlow.style.setProperty('--glow-x', `${glowX}%`);
    ambientGlow.style.setProperty('--glow-y', `${glowY}%`);
  });

  // Audio btn bindings
  document.getElementById('audio-btn').addEventListener('click', toggleAudio);

  // Scroll bindings for other triggers
  document.getElementById('hero-discover-btn').addEventListener('click', () => {
    if (lenis) lenis.scrollTo('#chapter-2');
  });
  document.getElementById('final-explore-btn').addEventListener('click', () => {
    if (lenis) lenis.scrollTo('#collections-section');
  });
  document.getElementById('why-cta-btn').addEventListener('click', () => {
    if (lenis) lenis.scrollTo('#brandstory-section');
  });
  document.getElementById('cta-explore').addEventListener('click', () => {
    if (lenis) lenis.scrollTo('#collections-section');
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navLinks.classList.toggle('mobile-active');
    });

    // Close mobile menu when a link is clicked
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('mobile-active');
      });
    });
  }

  // Menu quick-links smooth scrolling
  document.getElementById('link-home').addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo('#chapter-hero');
  });
  document.getElementById('link-collections').addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo('#collections-section');
  });
  document.getElementById('link-experience').addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo('#chapter-2');
  });
  document.getElementById('link-craftsmanship').addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo('#brandstory-section');
  });
  document.getElementById('link-reviews').addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo('#reviews-section');
  });
}

// Main Frame Animate/Render loop
function animate() {
  // Lerp mouse offsets for smooth, heavy 3D parallax shifts (avoiding jumps)
  const targetOffsetLimitX = -mouse.x * parallaxStrength;
  const targetOffsetLimitY = -mouse.y * parallaxStrength;
  
  mouseOffset.x += (targetOffsetLimitX - mouseOffset.x) * 0.07;
  mouseOffset.y += (targetOffsetLimitY - mouseOffset.y) * 0.07;

  // Calculate current scroll velocity to expand dust movement dynamically
  const currentScrollY = window.scrollY;
  scrollVelocity = Math.abs(currentScrollY - lastScrollY);
  lastScrollY = currentScrollY;

  // Redraw canvases
  const activeFrame = Math.floor(perfumeSequence.frame);
  drawFrame(activeFrame);
  updateParticles();

  requestAnimationFrame(animate);
}

// ----------------------------------------------------
// Page Bootstrap
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvases();
  initPreloader();
  initEventListeners();
});
