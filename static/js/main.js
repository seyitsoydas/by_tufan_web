const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

function updateHeader(){
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 18);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

function closeMenu(){
  if (!menuButton || !mobileMenu) return;
  mobileMenu.classList.remove('is-open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const open = !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('is-visible'));
}

document.querySelectorAll('img[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => {
    const fallback = img.dataset.fallback;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
    }
  }, { once: true });
});

const flashes = document.querySelectorAll('.flash');
flashes.forEach(flash => {
  setTimeout(() => {
    flash.style.transition = 'opacity .35s ease, transform .35s ease';
    flash.style.opacity = '0';
    flash.style.transform = 'translateY(-6px)';
    setTimeout(() => flash.remove(), 360);
  }, 5000);
});

// Keep the mobile menu state sane when the viewport changes orientation
// or returns to the desktop breakpoint.
let lastViewportWidth = window.innerWidth;
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  if (width > 900 && mobileMenu && mobileMenu.classList.contains('is-open')) {
    closeMenu();
  }
  if (Math.abs(width - lastViewportWidth) > 60) {
    lastViewportWidth = width;
  }
}, { passive: true });

// Home hero slider — rotates automatically at the interval defined on the hero element.
const heroSlider = document.querySelector('[data-hero-slider]');
if (heroSlider) {
  const slides = Array.from(heroSlider.querySelectorAll('.hero-slide'));
  const dots = Array.from(heroSlider.querySelectorAll('[data-slide-to]'));
  const prevButton = heroSlider.querySelector('[data-slider-prev]');
  const nextButton = heroSlider.querySelector('[data-slider-next]');
  const label = heroSlider.querySelector('.hero-current-label');
  const progress = heroSlider.querySelector('[data-slider-progress]');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const configuredInterval = Number.parseInt(heroSlider.dataset.slideInterval || '4000', 10);
  const slideInterval = Number.isFinite(configuredInterval) ? Math.max(2500, configuredInterval) : 4000;
  let currentSlide = 0;
  let sliderTimer = null;

  const restartProgress = () => {
    if (!progress || reduceMotion) return;
    progress.style.animation = 'none';
    // Force reflow so the progress animation restarts on every slide.
    void progress.offsetWidth;
    progress.style.animation = `heroProgress ${slideInterval}ms linear forwards`;
  };

  const showSlide = (index) => {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === currentSlide));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentSlide);
      dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false');
    });
    if (label) label.textContent = slides[currentSlide].dataset.label || '';
    restartProgress();
  };

  const stopSlider = () => {
    if (sliderTimer) {
      clearInterval(sliderTimer);
      sliderTimer = null;
    }
  };

  const startSlider = () => {
    stopSlider();
    if (!reduceMotion && slides.length > 1) {
      sliderTimer = setInterval(() => showSlide(currentSlide + 1), slideInterval);
    }
  };

  const moveTo = (index) => {
    showSlide(index);
    startSlider();
  };

  prevButton?.addEventListener('click', () => moveTo(currentSlide - 1));
  nextButton?.addEventListener('click', () => moveTo(currentSlide + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => {
    const target = Number.parseInt(dot.dataset.slideTo, 10);
    if (Number.isFinite(target)) moveTo(target);
  }));

  // Do not pause on mouse hover: the hero fills most of the screen and that
  // made automatic rotation appear broken on desktop. Pause only when the tab
  // itself is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSlider();
    else {
      restartProgress();
      startSlider();
    }
  });

  showSlide(0);
  startSlider();
}
