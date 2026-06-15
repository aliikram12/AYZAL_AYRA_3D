// Initialize GSAP & ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// WhatsApp Configuration
const WHATSAPP_NUMBER = "923000000000"; // Replace with owner's number

// Global State
let isLoaded = false;

// Web Audio API Synthesizer Context
let audioCtx = null;
let masterGain = null;
let oscillators = [];
let filterNode = null;
let lfoNode = null;
let isMuted = true;

// ----------------------------------------------------
// 1. Asset Loading and Preloader System
// ----------------------------------------------------
function initPreloader() {
  const progressBar = document.getElementById('progress-bar');
  const loaderCounter = document.getElementById('loader-counter');
  
  let isSiteUnlocked = false;

  const unlockSite = () => {
    if (!isSiteUnlocked) {
      isSiteUnlocked = true;
      onLoadingComplete();
    }
  };

  // 1. Cinematic Artificial Loader (0 to 100% over 2.5 seconds)
  let currentProgress = 0;
  const loadingDuration = 2500; // 2.5 seconds total loading time
  const fps = 30;
  const intervalTime = 1000 / fps;
  const progressStep = 100 / (loadingDuration / intervalTime);

  const loaderInterval = setInterval(() => {
    // Add some random easing to make it look realistic and organic
    const randomBoost = Math.random() * progressStep * 1.5;
    currentProgress += progressStep + randomBoost;

    if (currentProgress >= 100) {
      currentProgress = 100;
      clearInterval(loaderInterval);
      
      // Update DOM to 100%
      if (progressBar) progressBar.style.width = `100%`;
      if (loaderCounter) loaderCounter.innerText = `100%`;
      
      // Small delay before unlocking for visual impact
      setTimeout(unlockSite, 200);
    } else {
      if (progressBar) progressBar.style.width = `${Math.floor(currentProgress)}%`;
      if (loaderCounter) loaderCounter.innerText = `${Math.floor(currentProgress)}%`;
    }
  }, intervalTime);

  // Image preloading removed for video background
}

function onLoadingComplete() {
  isLoaded = true;
  document.getElementById('preloader').classList.add('loaded');
  document.body.classList.remove('loading');
  
  // Setup animations and scrolltriggers
  initScrollAnimations();
  initLenis();
  init3DTilt();
  initComparisonAnimations();
  initWhatsAppTriggers();
}

// ----------------------------------------------------
// 2. Responsive Canvas Rendering
// ----------------------------------------------------
// Canvas drawing logic removed for video background

// ----------------------------------------------------
// 3. GSAP Scroll Scrubber
// ----------------------------------------------------
function initScrollAnimations() {
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
// Particle System removed

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
  // Audio btn bindings
  const audioBtn = document.getElementById('audio-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', toggleAudio);
  }

  // Scroll bindings for other triggers
  const discoverBtn = document.getElementById('hero-discover-btn');
  if (discoverBtn) {
    discoverBtn.addEventListener('click', () => {
      if (lenis) lenis.scrollTo('#collections-section');
    });
  }
  
  const ctaExplore = document.getElementById('cta-explore-hero');
  if (ctaExplore) {
    ctaExplore.addEventListener('click', () => {
      if (lenis) lenis.scrollTo('#collections-section');
    });
  }

  const whyCta = document.getElementById('why-cta-btn');
  if (whyCta) {
    whyCta.addEventListener('click', () => {
      if (lenis) lenis.scrollTo('#brandstory-section');
    });
  }

  const ctaExploreBottom = document.getElementById('cta-explore');
  if (ctaExploreBottom) {
    ctaExploreBottom.addEventListener('click', () => {
      if (lenis) lenis.scrollTo('#collections-section');
    });
  }

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
  const linkHome = document.getElementById('link-home');
  if (linkHome) linkHome.addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo('.video-hero-section'); });
  
  const linkCollections = document.getElementById('link-collections');
  if (linkCollections) linkCollections.addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo('#collections-section'); });
  
  const linkCraftsmanship = document.getElementById('link-craftsmanship');
  if (linkCraftsmanship) linkCraftsmanship.addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo('#brandstory-section'); });
  
  const linkReviews = document.getElementById('link-reviews');
  if (linkReviews) linkReviews.addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo('#reviews-section'); });
}

// Main Frame Animate/Render loop
// Animation loop removed

// ----------------------------------------------------
// Page Bootstrap
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initEventListeners();
});
