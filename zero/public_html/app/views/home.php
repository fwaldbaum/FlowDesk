<?php
$extraHead = '<link rel="stylesheet" href="/assets/css/home.css?v=' . (is_file(dirname(APP_DIR) . '/assets/css/home.css') ? filemtime(dirname(APP_DIR) . '/assets/css/home.css') : 1) . '">';
$arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
// Only the apps whose address is configured appear (see app/apps.php); FlowDesk is always there.
$apps = array_filter([
    'flowdesk' => [
        'name' => 'FlowDesk', 'tag' => 'CRM y ventas', 'shot' => '/assets/img/flowdesk/tablero.webp', 'host' => 'zerosolutions.cl/flowdesk', 'theme' => 'fd',
        'title' => 'Tus clientes, ordenados en un tablero',
        'text' => 'Cada interesado es una tarjeta. Muévela de etapa, deja notas y recordatorios, y sabe siempre a quién llamar hoy.',
        'points' => ['Tablero de ventas que arrastras de etapa en etapa', 'Vista Hoy con tus pendientes y los clientes que se enfrían', 'WhatsApp en un clic, con el mensaje ya escrito', 'Formulario para tu web y 20 guías de integración'],
        'cta' => ['/registro?next=/abrir/flowdesk', 'Probar FlowDesk gratis'], 'more' => ['/productos/flowdesk', 'Ver más'],
    ],
    'repeat' => zero_app('repeat') ? [
        'name' => 'Repeat', 'tag' => 'Fidelización', 'shot' => '/assets/img/repeat/panel.webp', 'host' => 'repeat.zerosolutions.cl', 'theme' => 'rp',
        'title' => 'Que tus clientes vuelvan, una y otra vez',
        'text' => 'La tarjeta de sellos de cartón, ahora en el celular de tus clientes. Sin apps que descargar y sin tarjetas perdidas.',
        'points' => ['Tarjeta digital con tus colores, tu logo y tu premio', 'Sellos con la cámara de tu celular', 'Google Wallet: la tarjeta se actualiza sola', 'Clientes por recuperar con un WhatsApp ya escrito'],
        'cta' => ['/registro?next=/abrir/repeat', 'Probar Repeat gratis'], 'more' => ['/precios#repeat', 'Ver Repeat Pro'],
    ] : null,
    'venu' => zero_app('venu') ? [
        'name' => 'Venu', 'tag' => 'Entradas y eventos', 'shot' => '/assets/img/venu/evento.webp', 'host' => 'tumarca.venu.zerosolutions.cl', 'theme' => 'vn',
        'title' => 'Tu evento, tu página, tus entradas',
        'text' => 'Crea la página de tu evento en minutos y vende entradas con Flow o Stripe, directo a tu cuenta. Sin comisión por entrada.',
        'points' => ['Editor de página con fotos, textos, mapa y tus colores', 'Cobros con Flow o Stripe, directo a tu cuenta', 'Entradas con QR por correo', 'Control de acceso escaneando con tu celular'],
        'cta' => ['/registro?next=/abrir/venu', 'Probar Venu gratis'], 'more' => ['/precios#venu', 'Ver Venu Pro'],
    ] : null,
    'pido' => zero_app('pido') ? [
        'name' => 'Pido', 'tag' => 'Autoservicio para restaurantes', 'shot' => '/assets/img/pido/totem.webp', 'host' => 'pido.zerosolutions.cl', 'theme' => 'pd',
        'title' => 'Tu tótem de pedidos, en una tablet',
        'text' => 'Tus clientes eligen en una pantalla con fotos, pagan con un QR desde su celular y retiran cuando aparece su número.',
        'points' => ['Menú con tamaños, agregados y combos', 'Pagos con Mercado Pago, Flow, Stripe o en caja', 'Pantallas de cocina y retiro con aviso sonoro', 'Tu diseño, o tu propio código con Pido Pro'],
        'cta' => ['/registro?next=/abrir/pido', 'Probar Pido gratis'], 'more' => [zero_app('pido')['url'] ?? '/precios#pido', 'Probar el tótem en vivo'],
    ] : null,
]);
$rotate = ['negocio', 'restaurante', 'tienda', 'productora', 'cafetería', 'barbería'];
?>
<section class="zh-hero">
  <canvas data-dots="28" aria-hidden="true"></canvas>
  <div class="container zh-hero-grid">
    <div class="zh-hero-copy">
      <a href="#apps" class="zh-pill" data-reveal><span class="zh-pill-dot"></span><?= count($apps) ?> aplicaciones, una sola cuenta <?= icon('arrow-right', 15) ?></a>
      <h1 class="zh-h1" data-split-group>
        <span data-split>Software simple</span>
        <span data-split>para hacer crecer</span>
        <span class="zh-rot-line"><span data-split>tu</span> <span class="zh-rot" data-rotate="<?= e(json_encode($rotate, JSON_UNESCAPED_UNICODE)) ?>"><span><?= e($rotate[0]) ?></span></span></span>
      </h1>
      <p class="zh-lead" data-blur>ZERO Solutions crea herramientas para emprendedores y pymes de Chile. Con una sola cuenta abres todas nuestras aplicaciones: para vender, para que tus clientes vuelvan, para tus eventos y para tu restaurante.</p>
      <div class="zh-ctas" data-reveal style="--d:.5s">
        <a href="/registro" class="btn btn-primary btn-lg zh-btn" data-magnet data-spark>Crear cuenta gratis <?= $arrow ?></a>
        <a href="#apps" class="btn btn-secondary btn-lg zh-btn">Ver las aplicaciones</a>
      </div>
      <p class="zh-note" data-reveal style="--d:.6s"><em><?= icon('check', 16) ?> Gratis para empezar</em> <em><?= icon('check', 16) ?> Sin tarjeta de crédito</em></p>
    </div>
    <div class="zh-hero-visual" data-reveal style="--d:.2s">
      <div class="zh-swap" data-swap="3800" aria-label="Pantallas de las aplicaciones ZERO">
        <?php foreach ($apps as $id => $a): ?>
          <figure class="zh-shot" data-app="<?= e($id) ?>">
            <div class="zh-shot-bar"><i></i><i></i><i></i><span><?= e($a['host']) ?></span></div>
            <img src="<?= e($a['shot']) ?>" alt="<?= e($a['name']) ?>: <?= e($a['title']) ?>" width="1440" height="900" loading="eager">
          </figure>
        <?php endforeach; ?>
      </div>
      <div class="zh-swap-label" aria-live="polite">
        <?php foreach ($apps as $id => $a): ?>
          <span class="zh-app-chip" data-chip="<?= e($id) ?>"><span class="app-icon"><?= app_mark($id, 20) ?></span><b><?= e($a['name']) ?></b><small><?= e($a['tag']) ?></small></span>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<?php partial('clients'); ?>

<section class="zh-account">
  <div class="container zh-account-grid">
    <div>
      <span class="eyebrow" data-reveal>Cuenta ZERO</span>
      <h2 class="zh-h2" data-split-words>Una cuenta para todas tus aplicaciones</h2>
      <p class="zh-sub" data-reveal>Entra una vez y abre cualquier aplicación de ZERO sin volver a escribir tu contraseña. Las que lancemos después también.</p>
      <ul class="zh-list" data-stagger="3">
        <li><span><?= icon('layout-grid', 20) ?></span><div><b>Todo en un lugar</b><p>Desde tu cuenta ves las aplicaciones que usas y las abres con un clic.</p></div></li>
        <li><span><?= icon('key', 20) ?></span><div><b>Un solo acceso</b><p>Tu correo y tu contraseña ZERO sirven para cada producto.</p></div></li>
        <li><span><?= icon('shield-check', 20) ?></span><div><b>Seguridad por defecto</b><p>Contraseñas cifradas, correo confirmado y cierre de sesión en todos tus dispositivos.</p></div></li>
      </ul>
    </div>
    <div class="zh-orbit" data-reveal aria-hidden="true">
      <div class="zh-ring zh-ring-1"></div>
      <div class="zh-ring zh-ring-2"></div>
      <div class="zh-orbit-spin" style="--n:<?= count($apps) ?>">
        <?php $i = 0; foreach ($apps as $id => $a): ?>
          <span class="zh-planet" style="--k:<?= $i++ ?>"><span class="app-icon"><?= app_mark($id, 30) ?></span></span>
        <?php endforeach; ?>
      </div>
      <div class="zh-core"><img src="/assets/img/zero-mark.svg" alt="" width="64" height="64"><small>1 cuenta</small></div>
    </div>
  </div>
</section>

<section class="zh-products" id="apps">
  <div class="container">
    <div class="zh-head">
      <span class="eyebrow" data-reveal>Aplicaciones</span>
      <h2 class="zh-h2" data-split-words>Una herramienta para cada parte de tu negocio</h2>
    </div>
    <div class="zh-stack" data-stack>
      <?php $i = 0; foreach ($apps as $id => $a): ?>
        <article class="zh-card zh-<?= e($a['theme']) ?>" data-stack-card style="--i:<?= $i++ ?>" id="<?= e($id) ?>">
          <div class="zh-card-copy">
            <div class="zh-card-head"><span class="app-icon"><?= app_mark($id, 26) ?></span><div><b><?= e($a['name']) ?></b><small><?= e($a['tag']) ?></small></div></div>
            <h3><?= e($a['title']) ?></h3>
            <p><?= e($a['text']) ?></p>
            <ul><?php foreach ($a['points'] as $pt): ?><li><?= icon('check', 16) ?><?= e($pt) ?></li><?php endforeach; ?></ul>
            <div class="zh-card-ctas">
              <a href="<?= e($a['cta'][0]) ?>" class="zh-cta" data-spark><?= e($a['cta'][1]) ?> <?= $arrow ?></a>
              <a href="<?= e($a['more'][0]) ?>" class="zh-more"><?= e($a['more'][1]) ?></a>
            </div>
          </div>
          <figure class="zh-card-shot">
            <div class="zh-shot-bar"><i></i><i></i><i></i><span><?= e($a['host']) ?></span></div>
            <img src="<?= e($a['shot']) ?>" alt="<?= e($a['name']) ?>" width="1440" height="900" loading="lazy">
          </figure>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="zh-steps">
  <div class="container">
    <div class="zh-head">
      <span class="eyebrow" data-reveal>Cómo empezar</span>
      <h2 class="zh-h2" data-split-words>De cero a funcionando en tres pasos</h2>
    </div>
    <div class="zh-timeline">
      <svg class="zh-line" viewBox="0 0 1000 40" preserveAspectRatio="none" data-draw aria-hidden="true" style="--len:1100"><path d="M10 20 C 250 -10, 380 50, 500 20 S 760 -10, 990 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="1100" stroke-linecap="round"/></svg>
      <ol data-stagger="3">
        <li><span class="zh-num">1</span><h3>Crea tu cuenta ZERO</h3><p>Solo tu nombre, tu correo y una contraseña.</p></li>
        <li><span class="zh-num">2</span><h3>Confirma tu correo</h3><p>Te enviamos un enlace para activar tu cuenta.</p></li>
        <li><span class="zh-num">3</span><h3>Abre tus aplicaciones</h3><p>Entra a cualquiera desde tu cuenta, sin otra contraseña.</p></li>
      </ol>
    </div>
  </div>
</section>

<section class="zh-team">
  <div class="container zh-team-grid">
    <div>
      <span class="eyebrow" data-reveal>Quiénes somos</span>
      <h2 class="zh-h2" data-split-words>Una empresa chilena que hace software que se entiende</h2>
      <p class="zh-sub" data-reveal>ZERO Solutions fue fundada por Matías Waldbaum y Facundo Waldbaum para que cualquier negocio, sin importar su tamaño, tenga herramientas simples y bien hechas.</p>
      <a href="/nosotros" class="zh-more zh-more-ink" data-reveal>Conoce nuestra historia <?= $arrow ?></a>
    </div>
    <div class="zh-founders" data-stagger="2">
      <?php foreach ([['Matías Waldbaum', '/assets/img/team/matias.webp'], ['Facundo Waldbaum', '/assets/img/team/facundo.webp']] as [$name, $photo]): ?>
        <figure class="zh-founder" data-tilt="12">
          <img src="<?= e($photo) ?>" alt="<?= e($name) ?>" width="240" height="240" loading="lazy">
          <figcaption><b><?= e($name) ?></b><small>Cofundador de ZERO Solutions</small></figcaption>
          <span class="zh-glare" aria-hidden="true"></span>
        </figure>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="zh-final" data-dark>
  <div class="container">
    <h2 data-split-group><span data-split>Empieza hoy</span> <span data-split>con ZERO</span></h2>
    <p data-reveal>Crea tu cuenta gratis y abre tu primera aplicación en minutos.</p>
    <div class="zh-ctas" data-reveal style="--d:.2s">
      <a href="/registro" class="btn btn-white btn-lg zh-btn" data-magnet data-spark>Crear cuenta gratis <?= $arrow ?></a>
      <a href="/entrar" class="btn btn-lg zh-btn zh-btn-line">Ya tengo cuenta</a>
    </div>
  </div>
</section>
