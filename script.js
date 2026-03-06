'use strict';

/* ── utils ── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const EMAILJS_SERVICE_ID  = 'service_ozpzz2g';
const EMAILJS_TEMPLATE_ID = 'template_0z73lc9';
const EMAILJS_PUBLIC_KEY  = 'sGzb8PkOTicnGEIz2';

/* ================================================================
   1. SCROLL PROGRESS BAR
================================================================ */
const ProgressModule = (() => {
  const bar = $('#scrollProgress');
  if (!bar) return { init: () => {} };
  const upd = () => {
    const s = window.scrollY;
    const t = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (t > 0 ? (s / t) * 100 : 0) + '%';
  };
  return { init() { window.addEventListener('scroll', upd, { passive: true }); upd(); } };
})();

/* ================================================================
   2. NAVBAR — scroll shrink + mobile toggle
================================================================ */
const NavbarModule = (() => {
  const nav    = $('#navbar');
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  const links  = $$('.nav-link');
  const sections = $$('section[id]');
  if (!nav) return { init: () => {} };

  function updateActive() {
    const y = window.scrollY + 100;
    let cur = sections[0]?.id || '';
    sections.forEach(s => { if (y >= s.offsetTop) cur = s.id; });
    links.forEach(l => {
      const href = l.getAttribute('href');
      l.classList.toggle('active', href === '#' + cur);
    });
  }

  return {
    init() {
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        updateActive();
      }, { passive: true });

      toggle?.addEventListener('click', () => {
        const open = menu.classList.toggle('active');
        toggle.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });

      links.forEach(l => l.addEventListener('click', () => {
        menu.classList.remove('active');
        toggle?.classList.remove('active');
        document.body.style.overflow = '';
      }));

      updateActive();
    }
  };
})();

/* ================================================================
   3. SCROLL REVEAL — fade-up cards when they enter viewport
================================================================ */
const RevealModule = (() => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.style.opacity   = '1';
      en.target.style.transform = 'translateY(0)';
      obs.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  return {
    init() {
      $$('.video-card').forEach((c, i) => {
        c.style.transitionDelay = (i * 60) + 'ms';
        obs.observe(c);
      });
      $$('.poster-card').forEach((c, i) => {
        c.style.transitionDelay = (i * 70) + 'ms';
        obs.observe(c);
      });
      $$('.long-card').forEach((c, i) => {
        c.style.transitionDelay = (i * 90) + 'ms';
        obs.observe(c);
      });
    }
  };
})();

/* ================================================================
   4. VIDEO FILTER — filter short-form cards by category
================================================================ */
const FilterModule = (() => {
  const btns  = $$('.filter-btn');
  const cards = $$('.video-card');
  if (!btns.length) return { init: () => {} };

  function apply(cat) {
    cards.forEach(c => {
      const match = cat === 'all' || c.dataset.category === cat;
      if (match) {
        c.classList.remove('filter-hidden');
        requestAnimationFrame(() => c.classList.add('filter-show'));
      } else {
        c.classList.add('filter-hidden');
        c.classList.remove('filter-show');
      }
    });
  }

  return {
    init() {
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          apply(btn.dataset.filter || 'all');
        });
      });
    }
  };
})();

/* ================================================================
   5. VIDEO MODAL — click any video card / long card to open modal
================================================================ */
const VideoModal = (() => {
  const modal    = $('#videoModal');
  const videoEl  = $('#modalVideo');
  const closeBtn = $('#modalClose');
  const backdrop = modal ? $('.modal-backdrop', modal) : null;
  if (!modal || !videoEl) return { init: () => {} };

  function open(src) {
    if (!src) return;
    videoEl.src = src;
    videoEl.load();
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => videoEl.play().catch(() => {}), 300);
  }

  function close() {
    modal.classList.remove('active');
    videoEl.pause();
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.style.display = 'none';
      videoEl.src = '';
    }, 400);
  }

  return {
    init() {
      $$('.video-card').forEach(card => {
        card.addEventListener('click', () => {
          const src = card.querySelector('source')?.src || card.querySelector('video')?.src || '';
          open(src);
        });
      });

      $$('.long-card').forEach(card => {
        card.addEventListener('click', () => {
          const src = card.querySelector('source')?.src || card.querySelector('video')?.src || '';
          open(src);
        });
      });

      closeBtn?.addEventListener('click', close);
      backdrop?.addEventListener('click', close);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
  };
})();

/* ================================================================
   6. CONTACT FORM — EmailJS primary / Netlify Forms fallback
================================================================ */
const FormModule = (() => {
  const form      = $('#contactForm');
  const submitBtn = $('#formSubmitBtn');
  const toastOk   = $('#toastSuccess');
  const toastErr  = $('#toastError');
  if (!form) return { init: () => {} };

  function setLoading(on) {
    submitBtn?.classList.toggle('loading', on);
    if (submitBtn) submitBtn.disabled = on;
  }

  function showToast(el, duration = 4000) {
    if (!el) return;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), duration);
  }

  function validate() {
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name)             { shakeFocus(form.name,    'Please enter your name');    return false; }
    if (!emailRx.test(email)) { shakeFocus(form.email,   'Please enter a valid email'); return false; }
    if (!message)          { shakeFocus(form.message, 'Please write a message');    return false; }
    return true;
  }

  function shakeFocus(el, msg) {
    el.focus();
    el.classList.add('input-error');
    el.setAttribute('placeholder', msg);
    el.addEventListener('input', () => {
      el.classList.remove('input-error');
      el.setAttribute('placeholder', el.dataset.placeholder || '');
    }, { once: true });
  }

  async function netlifyFallback() {
    const data = new URLSearchParams({
      'form-name': 'contact',
      name:        form.name.value.trim(),
      email:       form.email.value.trim(),
      message:     form.message.message?.value?.trim() || form.message.value.trim(),
    });
    const res = await fetch('/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    data.toString(),
    });
    if (!res.ok) throw new Error('Netlify fallback failed: ' + res.status);
  }

  async function sendViaEmailJS() {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS SDK not loaded');
    await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form, EMAILJS_PUBLIC_KEY);
  }

  return {
    init() {
      if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }

      $$('#contactForm input, #contactForm textarea').forEach(el => {
        el.dataset.placeholder = el.placeholder;
      });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validate()) return;

        const bot = form.querySelector('[name="bot-field"]');
        if (bot?.value) return;

        setLoading(true);

        let emailjsOk = false;

        try {
          await sendViaEmailJS();
          emailjsOk = true;
        } catch (ejsErr) {
          console.warn('[EmailJS]', ejsErr.message);
        }

        if (!emailjsOk) {
          try {
            await netlifyFallback();
            emailjsOk = true;
          } catch (netErr) {
            console.warn('[Netlify fallback]', netErr.message);
          }
        }

        setLoading(false);

        if (emailjsOk) {
          showToast(toastOk);
          form.reset();
          $$('#contactForm input, #contactForm textarea').forEach(el => {
            el.placeholder = el.dataset.placeholder || '';
          });
        } else {
          showToast(toastErr);
        }
      });
    }
  };
})();

/* ================================================================
   7. SMOOTH SCROLL
================================================================ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const tgt = $(a.getAttribute('href'));
      if (!tgt) return;
      e.preventDefault();
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ================================================================
   INIT
================================================================ */
function init() {
  ProgressModule.init();
  NavbarModule.init();
  RevealModule.init();
  FilterModule.init();
  VideoModal.init();
  FormModule.init();
  initSmoothScroll();

  console.log('%c✦ AshishLoop Portfolio — Ready', 'color:#ff7a00;font-weight:700;font-size:14px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}