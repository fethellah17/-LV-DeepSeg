/* LV-DeepSeg Presentation — Navigation, Animations, Lightbox & Charts */
(function () {
  'use strict';

  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  const progressBar = document.getElementById('progressBar');
  const slideCounter = document.getElementById('slideCounter');
  const dotsContainer = document.getElementById('navDots');
  const presentation = document.getElementById('presentation');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  let currentSlide = 0;
  let isAnimating = false;
  const ANIM_DURATION = 540; // ms — matches CSS transition

  /* ── Navigation dots ── */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = dotsContainer.querySelectorAll('.nav-dot');

  /* ── Core transition ── */
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides || isAnimating || index === currentSlide) return;
    isAnimating = true;
    closeLightbox();

    const direction = index > currentSlide ? 1 : -1;
    const outSlide = slides[currentSlide];
    const inSlide  = slides[index];

    // Check if this is the cinematic transition (Slide 1 → Slide 2)
    const isCinematicTransition = (currentSlide === 0 && index === 1);

    if (isCinematicTransition) {
      // ── CINEMATIC TRANSITION: Slide 1 → Slide 2 ──
      // Step 1: Add zoom-out animation to Slide 1
      outSlide.classList.add('zoom-out-transition');

      // Step 2: After 700ms, hide Slide 1 and show Slide 2
      setTimeout(() => {
        outSlide.classList.remove('visible');
        outSlide.style.display = 'none';

        // Prepare Slide 2
        inSlide.style.display = 'flex';
        inSlide.classList.add('visible', 'fade-in-transition');

        // Update UI
        currentSlide = index;
        progressBar.style.width = ((index + 1) / totalSlides * 100) + '%';
        slideCounter.textContent = (index + 1) + ' / ' + totalSlides;
        dots.forEach((d, i) => d.classList.toggle('active', i === index));

        if (inSlide.dataset.chart === 'classification') initClassificationChart();
        if (inSlide.dataset.chart === 'segmentation')   initSegmentationChart();

        // Step 3: Clean up classes after animations complete
        setTimeout(() => {
          outSlide.classList.remove('zoom-out-transition');
          inSlide.classList.remove('fade-in-transition');
          outSlide.style.display = '';
          isAnimating = false;
        }, 900);
      }, 700);

    } else {
      // ── STANDARD TRANSITION: All other slides ──
      // Stage incoming slide off-screen (no transition yet)
      inSlide.style.transition = 'none';
      inSlide.classList.remove('visible', 'slide-exit-left', 'slide-exit-right');
      inSlide.classList.add(direction > 0 ? 'slide-enter-right' : 'slide-enter-left');

      // Force reflow so the browser registers the start position
      void inSlide.offsetWidth;

      // Re-enable transitions
      inSlide.style.transition = '';

      // Outgoing slide exits in the opposite direction
      outSlide.classList.remove('visible');
      outSlide.classList.add(direction > 0 ? 'slide-exit-left' : 'slide-exit-right');

      // Incoming slide slides into view
      inSlide.classList.remove('slide-enter-right', 'slide-enter-left');
      inSlide.classList.add('visible');

      // Update UI
      currentSlide = index;
      progressBar.style.width = ((index + 1) / totalSlides * 100) + '%';
      slideCounter.textContent = (index + 1) + ' / ' + totalSlides;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));

      if (inSlide.dataset.chart === 'classification') initClassificationChart();
      if (inSlide.dataset.chart === 'segmentation')   initSegmentationChart();

      setTimeout(() => {
        // Clean up exit classes from old slide
        outSlide.classList.remove('slide-exit-left', 'slide-exit-right');
        isAnimating = false;
      }, ANIM_DURATION);
    }
  }

  prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

  /* ── Fullscreen ── */
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fsIconEnter   = document.getElementById('fsIconEnter');
  const fsIconExit    = document.getElementById('fsIconExit');

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function updateFsIcon() {
    const isFs = !!document.fullscreenElement;
    fsIconEnter.style.display = isFs ? 'none' : '';
    fsIconExit.style.display  = isFs ? '' : 'none';
    fullscreenBtn.setAttribute('title', isFs ? 'Exit fullscreen (F)' : 'Fullscreen (F)');
  }

  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFsIcon);

  /* ── Keyboard ── */
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault(); goToSlide(currentSlide + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); goToSlide(currentSlide - 1);
    } else if (e.key === 'Home') {
      e.preventDefault(); goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault(); goToSlide(totalSlides - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault(); toggleFullscreen();
    }
  });

  /* ── Wheel ── */
  let wheelTimeout;
  presentation.addEventListener('wheel', (e) => {
    if (lightbox.classList.contains('open')) return;
    const body = e.target.closest('.slide-body');
    if (body && body.scrollHeight > body.clientHeight) {
      const atTop    = body.scrollTop === 0;
      const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
      if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
    }
    e.preventDefault();
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
      if (e.deltaY > 25)       goToSlide(currentSlide + 1);
      else if (e.deltaY < -25) goToSlide(currentSlide - 1);
    }, 40);
  }, { passive: false });

  /* ── Touch swipe ── */
  let touchStartY = 0;
  presentation.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  presentation.addEventListener('touchend', (e) => {
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 60) goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
  }, { passive: true });

  /* ── Lightbox ── */
  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.figure-wrap').forEach(fig => {
    const img     = fig.querySelector('img');
    const caption = fig.querySelector('.figure-caption');
    if (!img) return;
    fig.addEventListener('click', () => {
      openLightbox(img.src, caption ? caption.textContent : img.alt);
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  /* ── QR Code Modal ── */
  const qrCodeIcon = document.querySelector('.qr-code-icon');
  const qrModal = document.getElementById('qrModal');
  const qrModalClose = document.getElementById('qrModalClose');

  function openQRModal() {
    qrModal.classList.add('open');
    qrModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQRModal() {
    qrModal.classList.remove('open');
    qrModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (qrCodeIcon) {
    qrCodeIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      openQRModal();
    });
  }

  if (qrModalClose) {
    qrModalClose.addEventListener('click', closeQRModal);
  }

  if (qrModal) {
    // Close modal when clicking on overlay
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal || e.target.classList.contains('qr-modal-overlay')) {
        closeQRModal();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && qrModal.classList.contains('open')) {
        e.preventDefault();
        closeQRModal();
      }
    });
  }

  /* ── Charts ── */
  let clfChart = null;
  let segChart = null;

  function initClassificationChart() {
    const canvas = document.getElementById('clfChart');
    if (!canvas || clfChart) return;
    clfChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Swin-Tiny', 'Classic-CNN', 'ConvNeXt-S', 'ResNet-50', 'VGG-16', 'EfficientNet-B4'],
        datasets: [
          { label: 'Accuracy (%)', data: [92.36, 88.53, 88.84, 87.60, 87.82, 85.33], backgroundColor: 'rgba(15,111,255,0.8)', borderRadius: 6 },
          { label: 'F1-Macro',     data: [92.95, 89.37, 89.61, 88.60, 87.41, 86.66], backgroundColor: 'rgba(0,180,216,0.7)',   borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
          legend: { labels: { font: { size: 13 } } },
          title: { display: true, text: 'Classification Performance', font: { size: 15, weight: '600' } }
        },
        scales: {
          y: { min: 80, max: 100, ticks: { font: { size: 12 } } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  function initSegmentationChart() {
    const canvas = document.getElementById('segChart');
    if (!canvas || segChart) return;
    segChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Dice FG', 'Dice Cav', 'Dice Wall', 'IoU Cav', 'IoU Wall', 'Pixel Acc'],
        datasets: [
          { label: 'UNet++', data: [91.11, 94.39, 87.84, 89.37, 78.32, 97.46], borderColor: '#0F6FFF', backgroundColor: 'rgba(15,111,255,0.15)', borderWidth: 2 },
          { label: 'FPN',    data: [90.98, 94.27, 87.69, 89.16, 78.09, 97.45], borderColor: '#00B4D8', backgroundColor: 'rgba(0,180,216,0.1)',   borderWidth: 2 },
          { label: 'MANet',  data: [87.82, 92.51, 83.13, 86.06, 71.13, 96.49], borderColor: '#7EB8FF', backgroundColor: 'rgba(126,184,255,0.08)', borderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1200 },
        plugins: { title: { display: true, text: 'Segmentation Metrics', font: { size: 15 } } },
        scales: { r: { min: 65, max: 100, ticks: { font: { size: 11 } } } }
      }
    });
  }

  /* ── Init — show first slide ── */
  slides[0].classList.add('visible');
  progressBar.style.width = ((1) / totalSlides * 100) + '%';
  slideCounter.textContent = '1 / ' + totalSlides;

  /* ─────────────────────────────────────────────────────────────
     AUTO-TAGGER  — scans every slide once and assigns data-anim
     + --anim-delay to each meaningful element so they animate in
     from their natural position when the slide becomes visible.
  ───────────────────────────────────────────────────────────── */
  (function tagSlideElements() {
    slides.forEach(slide => {
      let delay = 0.12; // start delay after slide enters (seconds)
      const STEP = 0.08;

      // Helper: tag an element if not already tagged
      function tag(el, anim) {
        if (!el || el.hasAttribute('data-anim')) return;
        el.setAttribute('data-anim', anim);
        el.style.setProperty('--anim-delay', delay.toFixed(2) + 's');
        delay += STEP;
      }

      // 1. Slide header pieces (tag, title, subtitle)
      slide.querySelectorAll('.slide-tag, .title-badge').forEach(el => tag(el, 'fade-in'));
      slide.querySelectorAll('.slide-title, .title-main, h1, h2').forEach(el => tag(el, 'fade-up'));
      slide.querySelectorAll('.slide-subtitle, .title-app, .title-divider').forEach(el => tag(el, 'fade-up'));

      // 2. Title page specific
      slide.querySelectorAll('.title-meta, .title-meta > div').forEach(el => tag(el, 'fade-up'));

      // 3. Cards — stagger from bottom
      slide.querySelectorAll('.card, .outline-list li').forEach(el => tag(el, 'fade-up'));

      // 4. Tables — whole table slides up
      slide.querySelectorAll('.table-wrap').forEach(el => tag(el, 'fade-up'));

      // 5. Images / figures — scale in
      slide.querySelectorAll('.figure-wrap').forEach(el => tag(el, 'scale-in'));

      // 6. Bullet list items — stagger from left
      slide.querySelectorAll('.bullet-list li').forEach(el => tag(el, 'fade-left'));

      // 7. Pipeline steps — stagger from bottom
      slide.querySelectorAll('.pipeline-step, .pipeline-arrow').forEach(el => tag(el, 'fade-up'));

      // 8. Workflow steps
      slide.querySelectorAll('.workflow-step').forEach(el => tag(el, 'fade-up'));

      // 9. Charts
      slide.querySelectorAll('.chart-container').forEach(el => tag(el, 'scale-in'));

      // 10. Stat values pop in
      slide.querySelectorAll('.stat-value').forEach(el => tag(el, 'scale-in'));

      // 11. Conclusion blocks
      slide.querySelectorAll('.conclusion-block, .thank-you').forEach(el => tag(el, 'fade-up'));

      // 12. Any remaining paragraphs / text blocks not yet tagged
      slide.querySelectorAll('p:not([data-anim])').forEach(el => {
        // only direct children of slide-body or card — skip deeply nested ones
        if (el.closest('.bullet-list') || el.closest('td')) return;
        tag(el, 'fade-in');
      });
    });
  })();

})();
