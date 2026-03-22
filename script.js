'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// ✅ CORRECT STORJ CDN URL
const CDN            = 'https://link.storjshare.io/raw/jwpugstjuwnugsucltn24634mb4q/ashishloop';
const EMAILJS_SVC    = 'service_ozpzz2g';
const EMAILJS_TPL    = 'template_0z73lc9';
const EMAILJS_PUBKEY = 'sGzb8PkOTicnGEIz2';

(function tryInitEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBKEY });
  } else {
    window.addEventListener('load', () => {
      if (typeof emailjs !== 'undefined') emailjs.init({ publicKey: EMAILJS_PUBKEY });
    });
  }
})();

const ProgressModule = (() => {
  const bar = $('#scrollProgress');
  if (!bar) return { init: () => {} };
  let ticking = false;
  const upd = () => {
    const s = window.scrollY;
    const t = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (t > 0 ? (s / t) * 100 : 0) + '%';
    ticking = false;
  };
  return {
    init() {
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(upd); ticking = true; }
      }, { passive: true });
      upd();
    }
  };
})();

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

  let navTicking = false;
  return {
    init() {
      window.addEventListener('scroll', () => {
        if (!navTicking) {
          requestAnimationFrame(() => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
            updateActive();
            navTicking = false;
          });
          navTicking = true;
        }
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

const RevealModule = (() => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.style.opacity   = '1';
      en.target.style.transform = 'translateY(0)';
      obs.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function prep(el, i, delay) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(40px)';
    el.style.transition = `opacity 0.45s ease ${i * delay}ms, transform 0.45s ease ${i * delay}ms`;
    obs.observe(el);
  }

  return {
    init() {
      $$('.video-card').forEach((c, i)  => prep(c, i, 50));
      $$('.poster-card').forEach((c, i) => prep(c, i, 60));
      $$('.long-card').forEach((c, i)   => prep(c, i, 80));
    }
  };
})();

const LazyVideoModule = (() => {
  const videoObs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const video = en.target.querySelector('video');
      if (!video || video.dataset.loaded) return;

      const source = video.querySelector('source');
      if (source && source.dataset.src) {
        source.src = source.dataset.src;
        video.load();
        video.dataset.loaded = 'true';
      } else if (video.dataset.src) {
        video.src = video.dataset.src;
        video.load();
        video.dataset.loaded = 'true';
      }
      videoObs.unobserve(en.target);
    });
  }, { rootMargin: '200px 0px', threshold: 0 });

  return {
    init() {
      $$('.video-card, .long-card').forEach(card => {
        const video  = card.querySelector('video');
        if (!video) return;
        const source = video.querySelector('source');

        if (source) {
          if (source.getAttribute('src') && !source.dataset.src) {
            source.dataset.src = source.getAttribute('src');
            source.removeAttribute('src');
          }
        } else {
          const directSrc = video.getAttribute('src');
          if (directSrc && !video.dataset.src) {
            video.dataset.src = directSrc;
            video.removeAttribute('src');
          }
        }

        videoObs.observe(card);
      });
    }
  };
})();

const FilterModule = (() => {
  const btns  = $$('.filter-btn');
  const cards = $$('.video-card');
  if (!btns.length) return { init: () => {} };

  function apply(cat) {
    cards.forEach(c => {
      const show = cat === 'all' || c.dataset.category === cat;
      c.style.transition    = 'opacity 0.25s ease, transform 0.25s ease';
      c.style.opacity       = show ? '1' : '0';
      c.style.transform     = show ? 'translateY(0)' : 'scale(0.95)';
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

const VideoModal = (() => {
  const modal    = $('#videoModal');
  const videoEl  = $('#modalVideo');
  const closeBtn = $('#modalClose');
  const backdrop = $('#modalBackdrop');
  if (!modal || !videoEl) return { init: () => {} };

  function getSrc(card) {
    const vid = card.querySelector('video');
    if (vid) {
      const source = vid.querySelector('source');
      const src = source?.dataset.src
               || source?.getAttribute('src')
               || vid.dataset.src
               || vid.getAttribute('src')
               || card.dataset.src
               || '';
      if (!src) return '';
      if (src.startsWith('http') || src.startsWith('blob')) return src;
      return CDN + '/' + src.replace(/^\/+/, '');
    }
    return card.dataset.src || '';
  }

  function open(src) {
    if (!src) return;
    videoEl.src = src;
    videoEl.load();
    modal.style.display = 'flex';
    modal.offsetHeight;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => videoEl.play().catch(() => {}), 400);
  }

  function close() {
    modal.classList.remove('active');
    videoEl.pause();
    videoEl.currentTime = 0;
    document.body.style.overflow = '';
    setTimeout(() => { modal.style.display = 'none'; videoEl.src = ''; }, 380);
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

const IgFeedModule = (() => {
  const igObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const item = entry.target;
      const vid  = item.querySelector('video');
      if (!vid || vid.dataset.loaded) return;

      const src = item.dataset.src;
      if (!src) return;

      vid.src            = src;
      vid.dataset.loaded = 'true';
      vid.load();

      vid.addEventListener('canplay', () => item.classList.add('vid-ready'), { once: true });
      igObs.unobserve(item);
    });
  }, { rootMargin: '200px 0px', threshold: 0 });

  return {
    init() {
      $$('.ig-item').forEach(item => {
        const vid = item.querySelector('video');
        igObs.observe(item);

        item.addEventListener('mouseenter', () => {
          if (vid && vid.src) {
            if (!vid.muted) vid.muted = true;
            vid.play().catch(() => {});
          }
        });
        item.addEventListener('mouseleave', () => {
          if (vid) { vid.pause(); vid.currentTime = 0; }
        });

        if (vid) vid.addEventListener('click', e => e.stopPropagation());
      });
    }
  };
})();

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

  function showToast(el, ms = 4000) {
    if (!el) return;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), ms);
  }

  function validate() {
    const name  = form.elements['name']?.value?.trim()    || '';
    const email = form.elements['email']?.value?.trim()   || '';
    const msg   = form.elements['message']?.value?.trim() || '';
    const rx    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name)           { shake(form.elements['name'],    'Please enter your name');     return false; }
    if (!rx.test(email)) { shake(form.elements['email'],   'Please enter a valid email'); return false; }
    if (!msg)            { shake(form.elements['message'], 'Please write a message');     return false; }
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

  async function sendEmail() {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS not loaded');
    const videoType = form.elements['videoType']?.value || '';
    const params = {
      title:    videoType ? `Video Type: ${videoType}` : 'Portfolio Inquiry',
      name:     form.elements['name']?.value?.trim()    || '',
      time:     new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      message:  form.elements['message']?.value?.trim() || '',
      reply_to: form.elements['email']?.value?.trim()   || '',
    };
    const res = await emailjs.send(EMAILJS_SVC, EMAILJS_TPL, params, EMAILJS_PUBKEY);
    if (res.status !== 200) throw new Error('Status ' + res.status);
  }

  async function netlifyFallback() {
    const data = new URLSearchParams({
      'form-name': 'contact',
      name:    form.elements['name']?.value?.trim()    || '',
      email:   form.elements['email']?.value?.trim()   || '',
      message: form.elements['message']?.value?.trim() || '',
    });
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    });
    if (!res.ok) throw new Error('Netlify ' + res.status);
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
      $$('#contactForm input, #contactForm textarea').forEach(el => {
        el.dataset.placeholder = el.placeholder;
      });
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validate()) return;
        if (form.elements['bot-field']?.value) return;
        setLoading(true);
        let ok = false;
        try {
          await sendEmail();
          ok = true;
        } catch (err) {
          try { await netlifyFallback(); ok = true; } catch {}
        }
        setLoading(false);
        if (ok) { showToast(toastOk); resetForm(); }
        else      showToast(toastErr);
      });
    }
  };
})();

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

function init() {
  ProgressModule.init();
  NavbarModule.init();
  LazyVideoModule.init();
  IgFeedModule.init();
  RevealModule.init();
  FilterModule.init();
  VideoModal.init();
  FormModule.init();
  initSmoothScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
