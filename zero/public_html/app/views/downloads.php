<?php
$css = dirname(APP_DIR) . '/assets/css/downloads.css';
$js = dirname(APP_DIR) . '/assets/js/downloads.js';
$extraHead = '<link rel="stylesheet" href="/assets/css/downloads.css?v=' . (is_file($css) ? filemtime($css) : 1) . '">'
    . '<script defer src="/assets/js/downloads.js?v=' . (is_file($js) ? filemtime($js) : 1) . '"></script>';
$release = desktop_release();
$platforms = $release['platforms'];
$current = $os === 'mobile' ? null : ($platforms[$os] ?? null);
$main = $current['files'][0] ?? null;
$features = [
    ['app-window', 'Cada app en su ventana', 'FlowDesk, Repeat, Venu y Pido se abren como programas, con tu sesión ya iniciada. Nada de pestañas perdidas.'],
    ['mouse-pointer-click', 'Acceso directo a un clic', 'Instala las apps que usas y quedan en tu escritorio y en el menú de tu computador.'],
    ['credit-card', 'Tu cuenta y tu plan', 'Cambia tu nombre o contraseña, revisa tu plan y tus pagos sin entrar a la web.'],
    ['shield-check', 'Sesiones bajo control', 'Ve en qué computadores está abierta tu cuenta y cierra la que no reconozcas.'],
];
$steps = [
    'windows' => [
        'Abre el instalador que descargaste.',
        'Si aparece «Windows protegió tu PC», haz clic en «Más información» y luego en «Ejecutar de todas formas».',
        'Elige dónde instalarlo y listo: ZERO queda en el menú Inicio y en el escritorio.',
    ],
    'mac' => [
        'Abre el archivo .dmg y arrastra ZERO a la carpeta Aplicaciones.',
        'Abre ZERO desde Aplicaciones. Si macOS avisa que no puede verificar la app, ve a Ajustes del Sistema, Privacidad y seguridad, y elige «Abrir igualmente».',
        'Solo se pide la primera vez. Después ZERO se abre como cualquier app.',
    ],
    'linux' => [
        'AppImage: dale permiso para ejecutarse (clic derecho, Propiedades, «Permitir ejecutar») y ábrelo con doble clic.',
        'En Ubuntu 22.04 o superior puede pedir FUSE: <code>sudo apt install libfuse2</code> (en 24.04, <code>libfuse2t64</code>).',
        'Con el .deb: <code>sudo apt install ./ZERO-' . e($release['version']) . '-linux-amd64.deb</code> y búscalo en tus aplicaciones.',
    ],
];
?>
<section class="dl-hero" data-os="<?= e($os) ?>">
  <canvas data-dots="30" aria-hidden="true"></canvas>
  <div class="container dl-hero-inner">
    <span class="eyebrow" data-reveal><?= icon('monitor', 16) ?> App de escritorio</span>
    <h1 data-split>ZERO, en tu computador</h1>
    <p class="lead" data-reveal style="--d:.25s">Tu cuenta ZERO y todas sus apps en un solo programa para Windows, Mac y Linux. Instálalas una vez y ábrelas con un clic, con tu sesión ya iniciada.</p>

    <div class="dl-cta" data-reveal style="--d:.4s">
      <?php if ($main): ?>
        <a href="<?= e(desktop_file_url($main['file'])) ?>" class="btn btn-primary btn-lg" data-magnet data-spark data-primary download>
          <?= os_icon($os, 19) ?> <span data-primary-label>Descargar para <?= e($current['name']) ?></span>
        </a>
        <p class="dl-meta" data-primary-meta>Versión <?= e($release['version']) ?> · <?= e(format_megabytes($main['bytes'])) ?> · <?= e($current['requires']) ?></p>
      <?php else: ?>
        <a href="#plataformas" class="btn btn-primary btn-lg"><?= icon('download', 19) ?> Elige tu sistema</a>
        <p class="dl-meta"><?= $os === 'mobile' ? 'La app es para computadores. Abre esta página desde tu PC o Mac para descargarla.' : 'Disponible para Windows, macOS y Linux.' ?></p>
      <?php endif; ?>
      <a href="#plataformas" class="link dl-other">Otras plataformas <?= icon('chevron-down', 16) ?></a>
    </div>

    <figure class="dl-window" data-reveal data-tilt style="--d:.5s">
      <div class="dl-window-bar" aria-hidden="true"><i></i><i></i><i></i><span>ZERO</span></div>
      <img src="/assets/img/desktop/inicio.webp" width="2480" height="1560" alt="Pantalla de inicio de la app ZERO con FlowDesk, Repeat y Pido instaladas">
    </figure>
  </div>
</section>

<section class="section dl-features">
  <div class="container">
    <div class="center">
      <span class="eyebrow">Qué puedes hacer</span>
      <h2 class="h2" data-split-words>Todo lo de tu cuenta, sin abrir el navegador</h2>
    </div>
    <div class="dl-feature-grid" data-spotlight>
      <?php foreach ($features as $i => [$ic, $title, $text]): ?>
        <div class="card dl-feature" data-reveal style="--d:<?= $i * 0.08 ?>s">
          <span class="feature-icon"><?= icon($ic, 22) ?></span>
          <h3><?= e($title) ?></h3>
          <p><?= e($text) ?></p>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="section section-soft" id="plataformas">
  <div class="container">
    <div class="center">
      <span class="eyebrow">Descargas</span>
      <h2 class="h2">Elige tu sistema</h2>
      <p class="dl-sub">Versión <?= e($release['version']) ?> · publicada el <?= e(date('d-m-Y', strtotime($release['date']))) ?></p>
    </div>
    <div class="dl-platforms">
      <?php foreach ($platforms as $key => $p): ?>
        <article class="card dl-platform<?= $key === $os ? ' is-current' : '' ?>" data-platform="<?= e($key) ?>" data-reveal>
          <header>
            <span class="dl-os"><?= os_icon($key, 26) ?></span>
            <div>
              <h3><?= e($p['name']) ?></h3>
              <p><?= e($p['requires']) ?></p>
            </div>
            <span class="badge dl-yours">Tu sistema</span>
          </header>
          <div class="dl-files">
            <?php foreach ($p['files'] as $j => $f): ?>
              <a href="<?= e(desktop_file_url($f['file'])) ?>" class="btn <?= $j === 0 ? 'btn-primary' : 'btn-secondary' ?> btn-block dl-file" download
                 data-file="<?= e($key) ?>" data-label="<?= e($p['name']) ?>" data-meta="Versión <?= e($release['version']) ?> · <?= e(format_megabytes($f['bytes'])) ?> · <?= e($p['requires']) ?>">
                <?= icon('download', 17) ?>
                <span class="dl-file-text"><b><?= e($f['label']) ?></b><small><?= e($f['kind']) ?> · <?= e(format_megabytes($f['bytes'])) ?></small></span>
              </a>
            <?php endforeach; ?>
          </div>
          <ol class="dl-steps">
            <?php foreach ($steps[$key] as $s): ?>
              <li><?= $s ?></li>
            <?php endforeach; ?>
          </ol>
        </article>
      <?php endforeach; ?>
    </div>
    <p class="dl-note"><?= icon('shield-check', 16) ?> La app aún no lleva la firma de Microsoft ni de Apple, por eso tu sistema pide confirmar la primera vez que la abres. Descárgala solo desde zerosolutions.cl.</p>

    <details class="dl-hashes">
      <summary>Verificar la descarga (SHA-256)</summary>
      <div class="dl-hash-list">
        <?php foreach ($platforms as $p): foreach ($p['files'] as $f): ?>
          <div><span><?= e($f['file']) ?></span><code><?= e($f['sha256']) ?></code></div>
        <?php endforeach; endforeach; ?>
      </div>
    </details>
  </div>
</section>

<section class="section dl-split">
  <div class="container dl-split-grid">
    <div data-reveal>
      <span class="eyebrow">Mis apps</span>
      <h2 class="h2">Tus herramientas, donde las necesitas</h2>
      <p class="dl-sub left">Instala solo las apps que usas. Cada una guarda su propia sesión, se abre en su ventana y aparece en tu escritorio. Si cierras sesión en ZERO, se cierran todas.</p>
      <ul class="dl-checks">
        <li><?= icon('circle-check', 18) ?> Inicias sesión una vez, con tu cuenta ZERO</li>
        <li><?= icon('circle-check', 18) ?> Los pagos siguen en la web, con Mercado Pago</li>
        <li><?= icon('circle-check', 18) ?> Tu sesión queda cifrada en tu computador</li>
      </ul>
    </div>
    <figure class="dl-window dl-window-sm" data-reveal style="--d:.15s">
      <div class="dl-window-bar" aria-hidden="true"><i></i><i></i><i></i><span>ZERO · Mis apps</span></div>
      <img src="/assets/img/desktop/mis-apps.webp" width="2480" height="1560" loading="lazy" alt="Sección Mis apps de la app ZERO">
    </figure>
  </div>
</section>

<?php if (!current_user()): ?>
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band" data-reveal>
      <h2>¿Aún no tienes cuenta ZERO?</h2>
      <p>Créala gratis y úsala en la web, en el celular o en la app de escritorio.</p>
      <div class="hero-ctas">
        <a href="/registro" class="btn btn-white btn-lg">Crear cuenta ZERO <?= icon('arrow-right', 18) ?></a>
      </div>
    </div>
  </div>
</section>
<?php endif; ?>
