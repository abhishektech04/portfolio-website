'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ════════════════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════════════════ */
const CDN            = 'https://Aashishloop.b-cdn.net/Aashishloop/asset';
const EMAILJS_SVC    = 'service_ozpzz2g';
const EMAILJS_TPL    = 'template_0z73lc9';
const EMAILJS_PUBKEY = 'sGzb8PkOTicnGEIz2';

/* ── Init EmailJS as soon as the SDK tag has executed ── */
(function tryInitEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBKEY });
    console.log('%c✉ EmailJS initialised', 'color:#ff8c42;font-weight:700');
  } else {
    window.addEventListener('load', () => {
      if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: EMAILJS_PUBKEY });
        console.log('%c✉ EmailJS initialised (deferred)', 'color:#ff8c42;font-weight:700');
      } else {
        console.error('[EmailJS] SDK failed to load — check the <script> tag in <head>');
      }
    });
  }
})();

/* ════════════════════════════════════════════════════════
   1. SCROLL PROGRESS
════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════
   2. NAVBAR
════════════════════════════════════════════════════════ */
const NavbarModule = (() => {
  const nav      = $('#navbar');
  const toggle   = $('#navToggle');
  const menu     = $('#navMenu');
  const links    = $$('.nav-link');
  const sections = $$('section[id]');
  if (!nav) return { init: () => {} };

  function updateActive() {
    const y = window.scrollY + 120;
    let cur = sections[0]?.id || '';
    sections.forEach(s => { if (y >= s.offsetTop) cur = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
  }

  function closeMenu() {
    menu?.classList.remove('active');
    toggle?.classList.remove('active');
    document.body.style.overflow = '';
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

      links.forEach(l => l.addEventListener('click', closeMenu));
      document.addEventListener('click', e => {
        if (menu?.classList.contains('active') &&
            !menu.contains(e.target) &&
            !toggle?.contains(e.target)) closeMenu();
      });

      updateActive();
    }
  };
})();

/* ════════════════════════════════════════════════════════
   3. SCROLL REVEAL
════════════════════════════════════════════════════════ */
const RevealModule = (() => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.style.opacity   = '1';
      en.target.style.transform = 'translateY(0)';
      obs.unobserve(en.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  function prep(el, i, delay) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(40px)';
    el.style.transition = `opacity 0.5s ease ${i * delay}ms, transform 0.5s ease ${i * delay}ms`;
    obs.observe(el);
  }

  return {
    init() {
      $$('.video-card').forEach((c, i)  => prep(c, i, 60));
      $$('.poster-card').forEach((c, i) => prep(c, i, 70));
      $$('.long-card').forEach((c, i)   => prep(c, i, 90));
    }
  };
})();

/* ════════════════════════════════════════════════════════
   4. VIDEO FILTER
════════════════════════════════════════════════════════ */
const FilterModule = (() => {
  const btns  = $$('.filter-btn');
  const cards = $$('.video-card');
  if (!btns.length) return { init: () => {} };

  function apply(cat) {
    cards.forEach(c => {
      const show = cat === 'all' || c.dataset.category === cat;
      c.style.transition    = 'opacity 0.3s ease, transform 0.3s ease';
      c.style.opacity       = show ? '1' : '0';
      c.style.transform     = show ? 'scale(1)' : 'scale(0.94)';
      c.style.pointerEvents = show ? '' : 'none';
      c.classList.toggle('filter-hidden', !show);
    });
  }

  return {
    init() {
      btns.forEach(btn => btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        apply(btn.dataset.filter || 'all');
      }));
    }
  };
})();

/* ════════════════════════════════════════════════════════
   5. VIDEO MODAL
   getSrc() reads the <source src="..."> attribute directly —
   getAttribute() always returns exactly what's in the HTML,
   never a browser-resolved blob or wrong absolute path.
════════════════════════════════════════════════════════ */
const VideoModal = (() => {
  const modal    = $('#videoModal');
  const videoEl  = $('#modalVideo');
  const closeBtn = $('#modalClose');
  const backdrop = $('#modalBackdrop');
  if (!modal || !videoEl) return { init: () => {} };

  function getSrc(card) {
    const vid = card.querySelector('video');
    if (vid) {
      // getAttribute gives the raw string exactly as written in the HTML
      const src = vid.querySelector('source')?.getAttribute('src')
                  || vid.getAttribute('src')
                  || '';
      // Safety: if somehow a bare filename got through, prepend CDN
      if (src && !src.startsWith('http') && !src.startsWith('blob')) {
        return CDN + '/' + src.replace(/^\/+/, '');
      }
      return src;
    }
    return card.dataset.src || '';
  }

  function open(src) {
    if (!src) { console.warn('[Modal] No src found on card'); return; }
    console.log('[Modal] Opening:', src);

    videoEl.src = src;
    videoEl.load();

    modal.style.display = 'flex';
    modal.offsetHeight;                    // force reflow — makes CSS transition fire
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => videoEl.play().catch(() => {}), 350);
  }

  function close() {
    modal.classList.remove('active');
    videoEl.pause();
    videoEl.currentTime = 0;
    document.body.style.overflow = '';
    setTimeout(() => { modal.style.display = 'none'; videoEl.src = ''; }, 400);
  }

  return {
    init() {
      $$('.video-card, .long-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => open(getSrc(card)));
      });

      closeBtn?.addEventListener('click', close);
      backdrop?.addEventListener('click', close);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
  };
})();

/* ════════════════════════════════════════════════════════
   6. CONTACT FORM  — EmailJS v4
   Template variables used:
     {{from_name}}   — sender's name
     {{from_email}}  — sender's email
     {{video_type}}  — dropdown selection
     {{message}}     — message body
     {{reply_to}}    — set as Reply-To in EmailJS template
════════════════════════════════════════════════════════ */
const FormModule = (() => {
  const form      = $('#contactForm');
  const submitBtn = $('#formSubmitBtn');
  const toastOk   = $('#toastSuccess');
  const toastErr  = $('#toastError');
  if (!form) return { init: () => {} };

  /* Loading state */
  function setLoading(on) {
    submitBtn?.classList.toggle('loading', on);
    if (submitBtn) submitBtn.disabled = on;
  }

  /* Toast notification */
  function showToast(el, ms = 4000) {
    if (!el) return;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), ms);
  }

  /* Validation */
  function validate() {
    const name  = form.elements['name']?.value?.trim()    || '';
    const email = form.elements['email']?.value?.trim()   || '';
    const msg   = form.elements['message']?.value?.trim() || '';
    const rx    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name)          { shake(form.elements['name'],    'Please enter your name');     return false; }
    if (!rx.test(email)){ shake(form.elements['email'],   'Please enter a valid email'); return false; }
    if (!msg)           { shake(form.elements['message'], 'Please write a message');     return false; }
    return true;
  }

  function shake(el, msg) {
    if (!el) return;
    el.focus();
    el.classList.add('input-error');
    const orig = el.dataset.placeholder || el.placeholder;
    el.placeholder = msg;
    el.addEventListener('input', () => {
      el.classList.remove('input-error');
      el.placeholder = orig;
    }, { once: true });
  }

  /* EmailJS send */
  async function sendEmail() {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS not loaded');

    const params = {
      from_name:  form.elements['name']?.value?.trim()      || '',
      from_email: form.elements['email']?.value?.trim()     || '',
      video_type: form.elements['videoType']?.value         || 'Not specified',
      message:    form.elements['message']?.value?.trim()   || '',
      reply_to:   form.elements['email']?.value?.trim()     || '',
    };

    console.log('[EmailJS] Sending with params:', params);

    const res = await emailjs.send(EMAILJS_SVC, EMAILJS_TPL, params, EMAILJS_PUBKEY);

    console.log('[EmailJS] Response:', res);

    if (res.status !== 200) throw new Error('Status ' + res.status + ': ' + res.text);
  }

  /* Netlify Forms fallback */
  async function netlifyFallback() {
    const data = new URLSearchParams({
      'form-name': 'contact',
      name:    form.elements['name']?.value?.trim()    || '',
      email:   form.elements['email']?.value?.trim()   || '',
      message: form.elements['message']?.value?.trim() || '',
    });
    const res = await fetch('/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    data.toString(),
    });
    if (!res.ok) throw new Error('Netlify fallback ' + res.status);
  }

  function resetForm() {
    form.reset();
    $$('#contactForm input, #contactForm textarea').forEach(el => {
      el.placeholder = el.dataset.placeholder || '';
      el.classList.remove('input-error');
    });
  }

  return {
    init() {
      /* Cache original placeholders */
      $$('#contactForm input, #contactForm textarea').forEach(el => {
        el.dataset.placeholder = el.placeholder;
      });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validate()) return;

        /* Honeypot bot guard */
        if (form.elements['bot-field']?.value) return;

        setLoading(true);
        let ok = false;

        try {
          await sendEmail();
          ok = true;
        } catch (err) {
          console.warn('[EmailJS failed]', err.message);
          /* Try Netlify fallback */
          try {
            await netlifyFallback();
            ok = true;
          } catch (err2) {
            console.warn('[Netlify failed]', err2.message);
          }
        }

        setLoading(false);
        if (ok) { showToast(toastOk); resetForm(); }
        else      showToast(toastErr);
      });
    }
  };
})();

/* ════════════════════════════════════════════════════════
   7. SMOOTH SCROLL
════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════ */
function init() {
  ProgressModule.init();
  NavbarModule.init();
  RevealModule.init();
  FilterModule.init();
  VideoModal.init();
  FormModule.init();
  initSmoothScroll();
  console.log('%c✦ AshishLoop — Ready', 'color:#ff7a00;font-weight:700;font-size:14px;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
