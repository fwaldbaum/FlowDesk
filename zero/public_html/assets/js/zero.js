// Small progressive enhancements; every page works without JavaScript.
document.documentElement.classList.remove('no-js');

const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.mobile-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

document.querySelectorAll('[data-reveal-pass]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    btn.querySelector('.when-hidden').hidden = show;
    btn.querySelector('.when-shown').hidden = !show;
  });
});

const items = document.querySelectorAll('.reveal, .hook');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => io.observe(el));
} else {
  items.forEach((el) => el.classList.add('in'));
}

// Pricing: switch every card between monthly and yearly prices and checkout links.
const periodToggle = document.querySelector('.period-toggle');
if (periodToggle) {
  periodToggle.hidden = false;
  const show = (period) => {
    periodToggle.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === period)));
    document.querySelectorAll('[data-plan] [data-month]').forEach((el) => {
      const value = el.dataset[period];
      if (el.tagName === 'A') el.href = value;
      else el.textContent = value;
    });
  };
  periodToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-period]');
    if (btn) show(btn.dataset.period);
  });
}

// Admin: forms that change someone else's data ask first.
document.addEventListener('submit', (e) => {
  const message = e.target.dataset && e.target.dataset.confirm;
  if (message && !window.confirm(message)) e.preventDefault();
});
