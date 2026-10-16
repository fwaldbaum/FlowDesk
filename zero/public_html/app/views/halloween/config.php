<?php
$text = function (string $key, string $label, string $hint = '', bool $area = false) use ($hw): void {
    $max = HW_TEXTS[$key];
    echo '<div class="field"><label for="' . e($key) . '">' . e($label) . '</label>';
    echo $area
        ? '<textarea class="input" id="' . e($key) . '" name="' . e($key) . '" maxlength="' . $max . '" rows="2" data-live="' . e($key) . '">' . e($hw[$key]) . '</textarea>'
        : '<input class="input" id="' . e($key) . '" name="' . e($key) . '" maxlength="' . $max . '" value="' . e($hw[$key]) . '" data-live="' . e($key) . '">';
    if ($hint) {
        echo '<p class="hint">' . e($hint) . '</p>';
    }
    echo '</div>';
};
$color = function (string $key, string $label) use ($hw): void {
    echo '<label class="swatch"><input type="color" name="' . e($key) . '" value="' . e($hw[$key]) . '" data-var="' . e($key) . '"><span>' . e($label) . '</span></label>';
};
$range = function (string $key, string $label, string $unit, float $step) use ($hw): void {
    [$min, $max] = HW_NUMBERS[$key];
    echo '<div class="field range-field"><label for="' . e($key) . '">' . e($label) . ' <output for="' . e($key) . '">' . e((string) $hw[$key]) . ' ' . e($unit) . '</output></label>';
    echo '<input type="range" id="' . e($key) . '" name="' . e($key) . '" min="' . $min . '" max="' . $max . '" step="' . $step . '" value="' . e((string) $hw[$key]) . '" data-unit="' . e($unit) . '"></div>';
};
$check = function (string $key, string $label) use ($hw): void {
    echo '<label class="check"><input type="checkbox" name="' . e($key) . '" value="1"' . ($hw[$key] ? ' checked' : '') . '><span>' . e($label) . '</span></label>';
};
?>
<!doctype html>
<html lang="es" class="no-js">
<head>
<?php partial('head', ['title' => 'Panel de Halloween · ZERO']); ?>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/assets/css/halloween-admin.css?v=2">
<script defer src="/assets/js/halloween-admin.js?v=2"></script>
</head>
<body class="acct-body">
<header class="acct-top">
  <div class="container nav-inner">
    <?php partial('logo'); ?>
    <nav class="acct-tabs" aria-label="Halloween">
      <a href="/hallowing/config" class="active"><?= icon('settings', 17) ?><span>Configuración</span></a>
      <a href="/hallowing" target="_blank" rel="noopener"><?= icon('external-link', 17) ?><span>Ver página</span></a>
    </nav>
    <form method="post" action="/hallowing/config/salir"><?= csrf_field() ?><button class="btn btn-ghost btn-sm"><?= icon('log-out', 16) ?> Salir</button></form>
  </div>
</header>

<main class="acct-main">
  <div class="container">
    <?php partial('flashes'); ?>
    <h1>Halloween</h1>
    <p class="intro">Todo lo que ves en <a class="link" href="/hallowing" target="_blank" rel="noopener">zerosolutions.cl/hallowing</a>. Los colores y textos se ven al instante en la vista previa; guarda para publicarlos.</p>

    <div class="hw-admin">
      <form class="hw-form" id="hw-form" method="post" action="/hallowing/config" enctype="multipart/form-data">
        <?= csrf_field() ?>

        <section class="panel">
          <div class="panel-head"><h3>Textos</h3><p>Título, instrucciones y mensajes de la página.</p></div>
          <div class="panel-body grid-fields">
            <?php $text('title', 'Título'); ?>
            <?php $text('subtitle', 'Subtítulo', '', true); ?>
            <?php $text('sensor_title', 'Encabezado del sensor'); ?>
            <?php $text('sensor_hint', 'Instrucción del sensor'); ?>
            <?php $text('sensor_done', 'Mensaje al aceptar la huella'); ?>
            <?php $text('result_title', 'Texto sobre el premio', 'Aparece encima del premio que salió.'); ?>
            <?php $text('replay_label', 'Botón para volver a girar'); ?>
            <?php $text('footer', 'Pie de página', 'Déjalo vacío para no mostrarlo.'); ?>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h3>Ruleta y sensor</h3><p>Cuánto se mantiene presionado el sensor y cómo gira la ruleta.</p></div>
          <div class="panel-body">
            <?php $range('hold_seconds', 'Tiempo manteniendo el sensor', 's', 0.5); ?>
            <?php $range('spin_seconds', 'Duración del giro', 's', 0.5); ?>
            <?php $range('spin_speed', 'Velocidad (vueltas por segundo)', 'v/s', 0.1); ?>
            <p class="hint" data-turns>La ruleta dará unas <b></b> vueltas antes de detenerse.</p>
            <div class="checks-row">
              <?php $check('allow_replay', 'Permitir girar otra vez'); ?>
              <?php $check('sound', 'Sonidos'); ?>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h3>Premios de la ruleta</h3><p>Entre 2 y 24. La probabilidad sube con el peso: un premio con peso 4 sale el doble que uno con peso 2.</p></div>
          <div class="panel-body">
            <div class="items" data-items>
              <div class="items-head"><span>Color</span><span>Premio</span><span>Peso</span><span class="pct">Prob.</span><span></span></div>
              <?php foreach ($hw['items'] as $item): ?>
                <div class="item-row">
                  <input type="color" name="item_color[]" value="<?= e($item['color']) ?>" aria-label="Color">
                  <input class="input" name="item_label[]" value="<?= e($item['label']) ?>" maxlength="40" aria-label="Premio" required>
                  <input class="input" type="number" name="item_weight[]" value="<?= (int) $item['weight'] ?>" min="1" max="100" aria-label="Peso">
                  <span class="pct" data-pct></span>
                  <span class="row-actions">
                    <button type="button" class="icon-btn" data-move="-1" aria-label="Subir"><?= icon('chevron-down', 16, 'flip') ?></button>
                    <button type="button" class="icon-btn" data-move="1" aria-label="Bajar"><?= icon('chevron-down', 16) ?></button>
                    <button type="button" class="icon-btn danger" data-remove aria-label="Quitar"><?= icon('x', 16) ?></button>
                  </span>
                </div>
              <?php endforeach; ?>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-add><?= icon('plus', 16) ?> Agregar premio</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h3>Colores</h3><p>Fondo, brillo de la página, la ropa de la bruja y sus pociones.</p></div>
          <div class="panel-body">
            <div class="swatches">
              <?php $color('bg_from', 'Fondo arriba'); ?>
              <?php $color('bg_to', 'Fondo abajo'); ?>
              <?php $color('accent', 'Brillo y botones'); ?>
              <?php $color('text', 'Texto'); ?>
              <?php $color('robe', 'Vestido de la bruja'); ?>
              <?php $color('hat', 'Sombrero'); ?>
              <?php $color('skin', 'Piel de la bruja'); ?>
              <?php $color('potion_1', 'Poción 1'); ?>
              <?php $color('potion_2', 'Poción 2 y caldero'); ?>
              <?php $color('potion_3', 'Poción 3'); ?>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h3>Fondo</h3><p>Una imagen opcional sobre los colores de fondo, y la decoración del cielo.</p></div>
          <div class="panel-body">
            <?php if ($hw['bg_image']): ?>
              <div class="bg-current">
                <img src="<?= e($hw['bg_image']) ?>" alt="Fondo actual">
                <label class="check"><input type="checkbox" name="bg_remove" value="1"><span>Quitar esta imagen</span></label>
              </div>
            <?php endif; ?>
            <div class="field">
              <label for="bg_file"><?= $hw['bg_image'] ? 'Cambiar imagen' : 'Subir imagen' ?></label>
              <input class="input" type="file" id="bg_file" name="bg_file" accept="image/jpeg,image/png,image/webp">
              <p class="hint">JPG, PNG o WebP, hasta 5 MB. Se ve semitransparente para que el texto se lea bien.</p>
            </div>
            <div class="checks-row">
              <?php $check('stars', 'Estrellas'); ?>
              <?php $check('bats', 'Murciélagos'); ?>
            </div>
          </div>
        </section>

        <div class="save-bar">
          <button class="btn btn-primary"><?= icon('check', 17) ?> Guardar y publicar</button>
          <span class="hint" data-dirty hidden>Tienes cambios sin guardar.</span>
        </div>
      </form>

      <aside class="hw-preview">
        <div class="preview-frame">
          <div class="preview-bar"><span></span><span></span><span></span><small>zerosolutions.cl/hallowing</small></div>
          <div class="preview-viewport"><iframe src="/hallowing" title="Vista previa" id="hw-preview" tabindex="-1"></iframe></div>
        </div>
        <form method="post" action="/hallowing/config" class="reset" onsubmit="return confirm('¿Volver a los textos, colores y premios iniciales? Se pierde lo que configuraste.')">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="reset">
          <button class="btn btn-ghost btn-sm">Volver a la configuración inicial</button>
        </form>
      </aside>
    </div>
  </div>
</main>

<template id="item-template">
  <div class="item-row">
    <input type="color" name="item_color[]" value="#7c3aed" aria-label="Color">
    <input class="input" name="item_label[]" value="" maxlength="40" aria-label="Premio" placeholder="Nuevo premio" required>
    <input class="input" type="number" name="item_weight[]" value="1" min="1" max="100" aria-label="Peso">
    <span class="pct" data-pct></span>
    <span class="row-actions">
      <button type="button" class="icon-btn" data-move="-1" aria-label="Subir"><?= icon('chevron-down', 16, 'flip') ?></button>
      <button type="button" class="icon-btn" data-move="1" aria-label="Bajar"><?= icon('chevron-down', 16) ?></button>
      <button type="button" class="icon-btn danger" data-remove aria-label="Quitar"><?= icon('x', 16) ?></button>
    </span>
  </div>
</template>
</body>
</html>
