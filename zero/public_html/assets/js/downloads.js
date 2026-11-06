// Download page: the server guesses the OS from the user agent; this refines it with client hints and
// iPadOS (which reports itself as a Mac), then points the main button at the matching installer.
(() => {
  const hero = document.querySelector('.dl-hero');
  if (!hero) return;
  const ua = navigator.userAgent;
  const hint = (navigator.userAgentData && navigator.userAgentData.platform) || '';
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  let os = hero.dataset.os;
  if (/Android|iPhone|iPad|iPod/.test(ua) || touchMac || (navigator.userAgentData && navigator.userAgentData.mobile)) os = 'mobile';
  else if (/Windows/i.test(hint)) os = 'windows';
  else if (/macOS/i.test(hint)) os = 'mac';
  else if (/Linux|Chrome OS/i.test(hint)) os = 'linux';
  if (os === hero.dataset.os) return;

  hero.dataset.os = os;
  document.querySelectorAll('.dl-platform').forEach((card) => card.classList.toggle('is-current', card.dataset.platform === os));
  const button = hero.querySelector('[data-primary]');
  const source = document.querySelector(`.dl-file[data-file="${os}"]`);
  if (!button) return;
  if (!source) {
    button.href = '#plataformas';
    button.removeAttribute('download');
    button.querySelector('[data-primary-label]').textContent = 'Elige tu sistema';
    hero.querySelector('[data-primary-meta]').textContent = os === 'mobile'
      ? 'La app es para computadores. Abre esta página desde tu PC o Mac para descargarla.'
      : 'Por ahora la app está disponible para Windows y macOS.';
    return;
  }
  button.href = source.getAttribute('href');
  const icon = document.querySelector(`.dl-platform[data-platform="${os}"] .dl-os svg`);
  const oldIcon = button.querySelector('.os-icon');
  if (icon && oldIcon) {
    const copy = icon.cloneNode(true);
    copy.setAttribute('width', '19');
    copy.setAttribute('height', '19');
    oldIcon.replaceWith(copy);
  }
  button.querySelector('[data-primary-label]').textContent = `Descargar para ${source.dataset.label}`;
  hero.querySelector('[data-primary-meta]').textContent = source.dataset.meta;
})();
