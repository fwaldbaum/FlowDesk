// /hallowing/config: prize rows, live preview of colors and texts, and a "turns" estimate.
(() => {
  const form = document.getElementById('hw-form');
  const list = form.querySelector('[data-items]');
  const tpl = document.getElementById('item-template');
  const frame = document.getElementById('hw-preview');
  const dirty = form.querySelector('[data-dirty]');
  const MAX = 24;

  const rows = () => [...list.querySelectorAll('.item-row')];
  const refreshItems = () => {
    const weights = rows().map((r) => Math.max(1, parseInt(r.querySelector('[name="item_weight[]"]').value, 10) || 1));
    const total = weights.reduce((a, b) => a + b, 0);
    rows().forEach((r, i) => {
      r.querySelector('[data-pct]').textContent = `${Math.round((weights[i] / total) * 100)}%`;
      r.querySelector('[data-remove]').disabled = rows().length <= 2;
    });
    form.querySelector('[data-add]').disabled = rows().length >= MAX;
  };
  form.querySelector('[data-add]').addEventListener('click', () => {
    const row = tpl.content.firstElementChild.cloneNode(true);
    const palette = ['#7c3aed', '#f97316', '#db2777', '#a855f7', '#ea580c', '#16a34a', '#0ea5e9'];
    row.querySelector('[type="color"]').value = palette[rows().length % palette.length];
    list.appendChild(row);
    row.querySelector('[name="item_label[]"]').focus();
    refreshItems();
    markDirty();
  });
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = btn.closest('.item-row');
    if (btn.hasAttribute('data-remove') && rows().length > 2) row.remove();
    const move = Number(btn.dataset.move || 0);
    if (move < 0 && row.previousElementSibling?.classList.contains('item-row')) row.previousElementSibling.before(row);
    if (move > 0 && row.nextElementSibling) row.nextElementSibling.after(row);
    refreshItems();
    markDirty();
  });
  list.addEventListener('input', refreshItems);
  refreshItems();

  // Ranges show their value; the turns hint follows duration x speed.
  const turns = form.querySelector('[data-turns] b');
  const refreshRanges = () => {
    form.querySelectorAll('input[type="range"]').forEach((r) => {
      r.closest('.field').querySelector('output').textContent = `${r.value} ${r.dataset.unit}`;
    });
    turns.textContent = Math.max(2, Math.round(form.spin_seconds.value * form.spin_speed.value));
  };
  form.addEventListener('input', (e) => {
    if (e.target.type === 'range') refreshRanges();
  });
  refreshRanges();

  // Live preview inside the iframe (same origin): colors as CSS variables, texts by selector.
  const targets = { title: '.hw-title', subtitle: '.hw-subtitle', sensor_title: '.hw-panel-title', sensor_hint: '.hint-text', footer: '.hw-foot' };
  const doc = () => frame.contentDocument;
  form.addEventListener('input', (e) => {
    const t = e.target;
    const d = doc();
    if (!d?.body) return;
    if (t.dataset.var) d.body.style.setProperty(`--${t.dataset.var.replace('_', '-')}`, t.value);
    if (t.dataset.live && targets[t.dataset.live]) {
      const node = d.querySelector(targets[t.dataset.live]);
      if (node) node.textContent = t.value;
    }
  });

  const viewport = frame.parentElement;
  const fit = () => viewport.style.setProperty('--k', (viewport.clientWidth / 1280).toFixed(4));
  new ResizeObserver(fit).observe(viewport);
  fit();

  function markDirty() { dirty.hidden = false; }
  form.addEventListener('input', markDirty);
  form.addEventListener('submit', () => { window.onbeforeunload = null; });
  window.onbeforeunload = () => (dirty.hidden ? undefined : true);
})();
