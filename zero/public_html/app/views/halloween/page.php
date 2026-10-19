<?php
$cssVars = [
    '--bg-from' => $hw['bg_from'], '--bg-to' => $hw['bg_to'], '--accent' => $hw['accent'], '--text' => $hw['text'],
    '--robe' => $hw['robe'], '--hat' => $hw['hat'], '--skin' => $hw['skin'],
    '--potion-1' => $hw['potion_1'], '--potion-2' => $hw['potion_2'], '--potion-3' => $hw['potion_3'],
];
$style = implode(';', array_map(fn ($k, $v) => "{$k}:{$v}", array_keys($cssVars), $cssVars));
if ($hw['bg_image']) {
    $style .= ';--bg-image:url("' . e($hw['bg_image']) . '")';
}
$public = [
    'holdSeconds' => $hw['hold_seconds'], 'spinSeconds' => $hw['spin_seconds'], 'spinSpeed' => $hw['spin_speed'],
    'allowReplay' => $hw['allow_replay'], 'sound' => $hw['sound'], 'stars' => $hw['stars'], 'bats' => $hw['bats'],
    'items' => $hw['items'], 'sensorHint' => $hw['sensor_hint'], 'sensorDone' => $hw['sensor_done'],
    'behavior' => $hw['behavior'],
];
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($hw['title']) ?></title>
<meta name="description" content="<?= e($hw['subtitle']) ?>">
<meta name="theme-color" content="<?= e($hw['bg_to']) ?>">
<meta property="og:title" content="<?= e($hw['title']) ?>">
<meta property="og:description" content="<?= e($hw['subtitle']) ?>">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Creepster&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/css/halloween.css?v=3">
<script defer src="/assets/js/halloween.js?v=3"></script>
</head>
<body class="hw" style="<?= $style ?>">
<div class="hw-sky" aria-hidden="true">
  <div class="hw-moon"></div>
  <div class="hw-stars"></div>
  <div class="hw-bats"></div>
  <div class="hw-fog"><span></span><span></span><span></span></div>
</div>

<main class="hw-main">
  <header class="hw-head">
    <h1 class="hw-title"><?= e($hw['title']) ?></h1>
    <p class="hw-subtitle"><?= e($hw['subtitle']) ?></p>
  </header>

  <div class="hw-stage">
    <figure class="hw-witch" aria-hidden="true">
      <svg viewBox="0 0 420 480" class="witch-svg">
        <defs>
          <radialGradient id="brew" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="var(--potion-2)" stop-opacity="1"/>
            <stop offset="1" stop-color="var(--potion-2)" stop-opacity=".55"/>
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>

        <ellipse cx="215" cy="456" rx="170" ry="16" fill="#000" opacity=".35"/>

        <!-- Potions -->
        <g class="potions">
          <g class="potion p1">
            <ellipse cx="52" cy="400" rx="22" ry="22" fill="var(--potion-1)" filter="url(#glow)" opacity=".55" class="potion-glow"/>
            <path d="M44 352h16v18c12 6 20 17 20 31 0 19-13 32-28 32s-28-13-28-32c0-14 8-25 20-31z" fill="#ffffff22" stroke="#ffffff66" stroke-width="2"/>
            <path class="liquid" d="M27 398c8-4 17 4 25 0s17-4 25 0c1 17-11 32-25 32s-26-15-25-32z" fill="var(--potion-1)"/>
            <rect x="41" y="344" width="22" height="10" rx="3" fill="#8b5a2b"/>
            <circle class="bubble b1" cx="48" cy="410" r="3" fill="#fff" opacity=".7"/>
            <circle class="bubble b2" cx="58" cy="414" r="2" fill="#fff" opacity=".7"/>
          </g>
          <g class="potion p2">
            <ellipse cx="102" cy="418" rx="18" ry="18" fill="var(--potion-2)" filter="url(#glow)" opacity=".55" class="potion-glow"/>
            <path d="M94 368h14v14l14 30c4 9-2 20-12 20H92c-10 0-16-11-12-20l14-30z" fill="#ffffff22" stroke="#ffffff66" stroke-width="2"/>
            <path class="liquid" d="M84 412c6-3 12 3 18 0s12-3 18 0l2 4c4 8-1 16-10 16H92c-9 0-14-8-10-16z" fill="var(--potion-2)"/>
            <rect x="92" y="360" width="18" height="10" rx="3" fill="#8b5a2b"/>
            <circle class="bubble b3" cx="100" cy="422" r="2.5" fill="#fff" opacity=".7"/>
          </g>
          <g class="potion p3">
            <ellipse cx="140" cy="420" rx="14" ry="14" fill="var(--potion-3)" filter="url(#glow)" opacity=".55" class="potion-glow"/>
            <rect x="128" y="388" width="24" height="44" rx="8" fill="#ffffff22" stroke="#ffffff66" stroke-width="2"/>
            <rect class="liquid" x="130" y="404" width="20" height="26" rx="6" fill="var(--potion-3)"/>
            <rect x="133" y="378" width="14" height="12" rx="3" fill="#8b5a2b"/>
            <circle class="bubble b4" cx="140" cy="420" r="2" fill="#fff" opacity=".7"/>
          </g>
        </g>

        <!-- Cauldron -->
        <g class="cauldron">
          <ellipse cx="300" cy="372" rx="58" ry="15" fill="var(--potion-2)" filter="url(#glow)" opacity=".8" class="brew-glow"/>
          <path d="M240 374c0 48 26 78 60 78s60-30 60-78z" fill="#17121f"/>
          <path d="M250 392c4 30 22 48 50 52" stroke="#ffffff1a" stroke-width="5" fill="none" stroke-linecap="round"/>
          <rect x="262" y="446" width="10" height="12" rx="3" fill="#17121f"/>
          <rect x="328" y="446" width="10" height="12" rx="3" fill="#17121f"/>
          <ellipse cx="300" cy="374" rx="62" ry="14" fill="#241b31"/>
          <ellipse cx="300" cy="374" rx="52" ry="9" fill="url(#brew)"/>
          <g class="brew-bubbles">
            <circle cx="282" cy="372" r="5" fill="var(--potion-2)"/>
            <circle cx="304" cy="370" r="7" fill="var(--potion-2)"/>
            <circle cx="322" cy="373" r="4" fill="var(--potion-2)"/>
          </g>
          <g class="steam" fill="none" stroke="var(--potion-2)" stroke-width="4" stroke-linecap="round" opacity=".5">
            <path d="M285 350c-8-12 8-18 0-30"/>
            <path d="M306 344c-8-12 8-18 0-30"/>
            <path d="M325 352c-8-12 8-18 0-30"/>
          </g>
        </g>

        <!-- Witch -->
        <g class="witch-body">
          <path d="M152 236c-20 60-38 140-50 206h196c-10-66-26-146-46-206z" fill="var(--robe)"/>
          <path d="M200 236c-6 70-14 140-30 206h-28c10-70 26-140 40-206z" fill="#000" opacity=".14"/>
          <path d="M238 236c10 70 22 140 30 206h-22c-6-66-14-136-24-206z" fill="#fff" opacity=".07"/>
          <path d="M150 236c16 18 84 18 102 0l-6-14c-26 10-64 10-90 0z" fill="var(--hat)"/>
          <rect x="140" y="318" width="124" height="14" rx="5" fill="var(--hat)"/>
          <rect x="192" y="314" width="22" height="22" rx="4" fill="none" stroke="var(--accent)" stroke-width="4"/>

          <!-- Stirring arm and spoon -->
          <g class="stir-arm">
            <path d="M232 250c20 26 34 54 42 84" stroke="var(--robe)" stroke-width="30" stroke-linecap="round" fill="none"/>
            <path d="M262 316c8 8 14 16 16 24" stroke="var(--hat)" stroke-width="32" stroke-linecap="round" fill="none" opacity=".55"/>
            <circle cx="278" cy="342" r="11" fill="var(--skin)"/>
            <path d="M276 262l20 120" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
            <ellipse cx="297" cy="386" rx="9" ry="5" fill="#8b5a2b"/>
          </g>
          <!-- Other arm holding a potion -->
          <g class="lift-arm">
            <path d="M168 250c-24 20-40 40-48 62" stroke="var(--robe)" stroke-width="30" stroke-linecap="round" fill="none"/>
            <circle cx="118" cy="318" r="11" fill="var(--skin)"/>
            <path d="M110 286h12v10c8 4 13 11 13 20 0 12-8 20-19 20s-19-8-19-20c0-9 5-16 13-20z" fill="#ffffff22" stroke="#ffffff77" stroke-width="2"/>
            <path class="liquid" d="M99 318c6-3 11 3 17 0s11-3 17 0c0 11-8 18-17 18s-17-7-17-18z" fill="var(--potion-1)"/>
          </g>

          <!-- Head -->
          <g class="witch-head">
            <path d="M156 176c-10 40-6 74 6 96l14-6c-8-26-8-58-2-86z" fill="#1c0f2e"/>
            <path d="M246 176c10 40 6 74-6 96l-14-6c8-26 8-58 2-86z" fill="#1c0f2e"/>
            <circle cx="201" cy="186" r="44" fill="var(--skin)"/>
            <path d="M201 190l-5 26 10-4z" fill="#000" opacity=".12"/>
            <path d="M200 186c2 10 6 20 14 28-8 2-14-2-16-6z" fill="var(--skin)" stroke="#00000022" stroke-width="2"/>
            <g class="eyes">
              <ellipse cx="184" cy="180" rx="6" ry="7" fill="#1c0f2e"/>
              <ellipse cx="219" cy="180" rx="6" ry="7" fill="#1c0f2e"/>
              <circle cx="186" cy="177" r="2" fill="#fff"/>
              <circle cx="221" cy="177" r="2" fill="#fff"/>
            </g>
            <circle cx="172" cy="200" r="7" fill="#f472b6" opacity=".35"/>
            <circle cx="231" cy="200" r="7" fill="#f472b6" opacity=".35"/>
            <path d="M186 214c10 8 22 8 32 0" stroke="#1c0f2e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M210 216l3 6 3-6" fill="#fff"/>
            <path d="M160 160c14-20 64-24 84 2-14-6-30-8-44-6-14 0-28 2-40 4z" fill="#1c0f2e"/>
          </g>

          <!-- Hat -->
          <g class="witch-hat">
            <ellipse cx="202" cy="150" rx="92" ry="17" fill="var(--hat)"/>
            <path d="M146 148c10-50 26-86 50-112 18-20 46-26 62-14-22 4-34 18-40 34-6 18-4 52 8 92z" fill="var(--hat)"/>
            <path d="M154 134c24 8 50 8 72 0l4 16c-26 8-54 8-80 0z" fill="var(--accent)"/>
            <rect x="182" y="132" width="20" height="18" rx="3" fill="none" stroke="#fde68a" stroke-width="3.5"/>
            <path d="M196 40c18-22 46-26 62-18" stroke="#ffffff22" stroke-width="4" fill="none" stroke-linecap="round"/>
            <g class="hat-stars" fill="#fde68a">
              <path d="M224 92l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
              <circle cx="206" cy="70" r="2.5"/>
            </g>
          </g>
        </g>

        <!-- Sparkles from the brew -->
        <g class="sparkles" fill="var(--accent)">
          <circle cx="270" cy="330" r="3"/>
          <circle cx="330" cy="320" r="2.5"/>
          <circle cx="300" cy="300" r="2"/>
          <circle cx="250" cy="310" r="2"/>
        </g>
      </svg>
    </figure>

    <section class="hw-panel" aria-live="polite">
      <?php if ($hw['behavior']): ?>
        <div class="hw-behavior" data-step="behavior">
          <h2 class="hw-panel-title hw-behavior-title"><?= e($hw['behavior_title']) ?></h2>
          <div class="score" aria-hidden="true"><span class="score-num">50</span><span class="score-mood">Más o menos</span></div>
          <div class="behavior-range">
            <input type="range" min="1" max="100" step="1" value="50" class="behavior-input" aria-label="<?= e($hw['behavior_title']) ?>" aria-valuetext="50 de 100">
            <div class="behavior-ends"><span><?= e($hw['behavior_low']) ?> · 1</span><span>100 · <?= e($hw['behavior_high']) ?></span></div>
          </div>
          <p class="behavior-hint"><?= e($hw['behavior_hint']) ?></p>
          <p class="behavior-luck" hidden>Suerte con el premio más difícil: <b></b></p>
          <button type="button" class="hw-btn behavior-go"><?= e($hw['behavior_button']) ?></button>
        </div>
      <?php endif; ?>
      <div class="hw-sensor-wrap" data-step="sensor"<?= $hw['behavior'] ? ' hidden' : '' ?>>
        <h2 class="hw-panel-title"><?= e($hw['sensor_title']) ?></h2>
        <button type="button" class="hw-sensor" aria-label="<?= e($hw['sensor_hint']) ?>">
          <svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" class="ring-track"/>
            <circle cx="100" cy="100" r="92" class="ring-fill" pathLength="100"/>
          </svg>
          <svg class="print" viewBox="0 0 24 24" aria-hidden="true">
            <defs><clipPath id="print-clip"><rect class="print-clip" x="0" y="24" width="24" height="24"/></clipPath><g id="fp" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
            </g></defs>
            <g class="print-base"><use href="#fp"/></g>
            <g class="print-on" clip-path="url(#print-clip)"><use href="#fp"/></g>
            
          </svg>
          <span class="scan-line" aria-hidden="true"></span>
        </button>
        <p class="hw-hint"><span class="hint-text"><?= e($hw['sensor_hint']) ?></span> <span class="hint-count"></span></p>
      </div>

      <div class="hw-wheel-wrap" data-step="wheel" hidden>
        <div class="wheel-box">
          <svg class="wheel-pointer" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 46L4 10a16 16 0 1 1 32 0z"/><circle cx="20" cy="16" r="6"/></svg>
          <svg class="wheel" viewBox="-110 -110 220 220" role="img" aria-label="Ruleta de premios"></svg>
          <div class="wheel-hub" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/></svg></div>
        </div>
      </div>
    </section>
  </div>

  <?php if ($hw['footer'] !== ''): ?><footer class="hw-foot"><?= e($hw['footer']) ?></footer><?php endif; ?>
</main>

<div class="hw-result" hidden>
  <div class="hw-result-card" role="dialog" aria-modal="true" aria-labelledby="hw-result-title">
    <p class="result-kicker" id="hw-result-title"><?= e($hw['result_title']) ?></p>
    <p class="result-prize"></p>
    <?php if ($hw['allow_replay']): ?><button type="button" class="hw-btn replay"><?= e($hw['replay_label']) ?></button><?php else: ?><p class="result-next">Siguiente turno en <b>8</b> s</p><?php endif; ?>
  </div>
  <canvas class="hw-confetti" aria-hidden="true"></canvas>
</div>

<script type="application/json" id="hw-config"><?= json_encode($public, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
</body>
</html>
