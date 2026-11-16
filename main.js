/* ============================================================
   DIY Finanzcoaching – main.js
   ============================================================ */

// ── ROOT PATH DETECTION ──
// Erkennt den Pfad zum Site-Root anhand des style.css-Links.
// Root-Seiten laden "style.css", Blog-Seiten "../style.css".
const _cssHref = document.querySelector('link[href$="style.css"]')?.getAttribute('href') ?? 'style.css';
const ROOT = _cssHref.replace('style.css', '') || './';

// ── NAV ──
// Seit der Einstellung des Angebots besteht die Nav nur noch aus dem Logo
// (kein Burger/Drawer mehr). Die Hide-on-Scroll-Logik unten nutzt navEl.
const navEl = document.querySelector('nav');

// ── HINWEIS: ANGEBOT EINGESTELLT ──
// Auf allen Seiten außer der Startseite (Abschiedsseite) erscheint unter
// dem Logo ein schmaler Balken mit Link zur Startseite. Er sitzt IN der
// fixierten Nav, damit er mit ihr ein- und ausblendet. Weil die Seiten
// ihren oberen Abstand auf die Nav-Höhe ohne Balken auslegen, bekommt der
// body zusätzlich die Balkenhöhe als padding-top.
if (navEl && !document.body.classList.contains('page-farewell')) {
  navEl.insertAdjacentHTML('beforeend', `
    <div class="offer-ended-bar">
      Das Angebot DIY Finanzcoaching wurde eingestellt.
      <a href="${ROOT}">Mehr erfahren →</a>
    </div>
  `);
  const offerBar = navEl.querySelector('.offer-ended-bar');
  const syncOfferBarOffset = () => {
    document.body.style.paddingTop = offerBar.offsetHeight + 'px';
  };
  syncOfferBarOffset();
  window.addEventListener('resize', syncOfferBarOffset);
}

// ── DYNAMIC FOOTER ──
const footerHTML = `
<footer>
  <div class="footer-logo">DIY Finanzcoaching</div>
  <div>Oliver Nitsch · <a href="${ROOT}impressum.html">Impressum</a> · <a href="${ROOT}datenschutz.html">Datenschutz</a></div>
  <div>© 2026</div>
</footer>
`;
document.querySelector('footer').outerHTML = footerHTML;

// ── HIDE-ON-SCROLL / SHOW-ON-SCROLL ──
let lastScrollY = window.scrollY;
let ticking = false;
const SCROLL_THRESHOLD = 80; // px vom Top – Nav bleibt sichtbar ganz oben

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const currentY = window.scrollY;

      if (currentY < SCROLL_THRESHOLD) {
        // Ganz oben – immer sichtbar
        navEl.classList.remove('nav--hidden');
      } else if (currentY > lastScrollY) {
        // Runterscrollen → verstecken
        navEl.classList.add('nav--hidden');
      } else {
        // Hochscrollen → zeigen
        navEl.classList.remove('nav--hidden');
      }

      lastScrollY = currentY;
      ticking = false;
    });
    ticking = true;
  }
});

// ── SCROLL REVEAL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── HASH NAVIGATION ──
// Beim direkten Aufruf mit #anchor (z. B. von einer anderen Seite):
// Reveal-Animation am Ziel sofort auslösen, dann hinscrollen.
window.addEventListener('load', () => {
  const hash = window.location.hash;
  if (!hash) return;
  const target = document.querySelector(hash);
  if (!target) return;
  target.classList.add('visible');
  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
});

// ── ACTIVE NAV LINK (für Unterseiten) ──
const currentPath = window.location.pathname.replace(/\/$/, '') + '/';
document.querySelectorAll('nav a').forEach(link => {
  const href = link.getAttribute('href');
  if (href && (currentPath.endsWith('/' + href) || currentPath === href || currentPath.endsWith(href))) {
    link.style.opacity = '0.5';
    link.style.pointerEvents = 'none';
  }
});

// ── FAQ ACCORDION ──
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('faq-open');
    // Close all
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('faq-open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    // Toggle clicked
    if (!isOpen) {
      item.classList.add('faq-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ── COST BARS ANIMATION ──
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.cost-bar-fill').forEach(bar => {
        const target = bar.style.width;
        bar.style.width = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { bar.style.width = target; });
        });
      });
      barObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.cost-chart').forEach(el => barObserver.observe(el));

// ── COOKIE BANNER & ANALYTICS ──
const COOKIE_KEY = 'diy_cookie_consent';
// ↓ Google Analytics Measurement-ID hier eintragen
const GA_ID = 'G-5M18DV1M83';

function loadAnalytics() {
  if (document.getElementById('ga-script')) return;
  const s = document.createElement('script');
  s.id = 'ga-script';
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.async = true;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

function initCookieBanner() {
  const stored = localStorage.getItem(COOKIE_KEY);
  if (stored === 'accepted') { loadAnalytics(); return; }
  if (stored === 'declined') return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie-Hinweis');
  banner.innerHTML = `
    <p>
      Diese Website verwendet Google Fonts und Google Analytics.
      Dabei werden Daten (u.&nbsp;a. deine IP-Adresse) an Google übertragen.
      Mit „Akzeptieren" stimmst du dem zu – bei „Ablehnen" werden keine
      Tracking-Daten erhoben und Schriften lokal ersetzt.
      <a href="${ROOT}datenschutz.html">Datenschutzerklärung</a>
    </p>
    <div class="cookie-banner-actions">
      <button class="cookie-btn cookie-btn-decline">Ablehnen</button>
      <button class="cookie-btn cookie-btn-accept">Akzeptieren</button>
    </div>
  `;

  document.body.appendChild(banner);
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('cookie-banner--visible')));

  banner.querySelector('.cookie-btn-accept').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    hideBanner(banner);
    loadAnalytics();
  });

  banner.querySelector('.cookie-btn-decline').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    hideBanner(banner);
  });
}

function hideBanner(banner) {
  banner.classList.remove('cookie-banner--visible');
  banner.addEventListener('transitionend', () => banner.remove(), { once: true });
}

initCookieBanner();

// ── CONTACT FORM (web3forms) ──
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    const feedback = contactForm.querySelector('.form-feedback');
    const hCaptchaResponse = contactForm.querySelector('textarea[name=h-captcha-response]')?.value;
    if (!hCaptchaResponse) {
      feedback.className = 'form-feedback form-feedback--error';
      feedback.textContent = 'Bitte bestätige zuerst das Captcha.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Wird gesendet …';
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(contactForm),
      });
      const data = await res.json();
      if (data.success) {
        feedback.classList.add('form-feedback--success');
        feedback.textContent = 'Danke – deine Nachricht ist angekommen! Ich melde mich in der Regel innerhalb von 24–48 Stunden.';
        contactForm.reset();
      } else {
        throw new Error(data.message);
      }
    } catch {
      feedback.classList.add('form-feedback--error');
      feedback.textContent = 'Da ist leider etwas schiefgelaufen. Bitte versuche es noch einmal oder schreib direkt an info@diy-finanzcoaching.de.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Nachricht senden →';
    }
  });
}
