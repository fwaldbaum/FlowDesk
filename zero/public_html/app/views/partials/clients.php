<?php
// Client logos, in gray until hovered. Add one entry per new client (file in assets/img/clients/).
$clients = [
    ['name' => 'MIRAX', 'logo' => 'mirax.png', 'h' => 46],
    ['name' => 'doble', 'logo' => 'doble.png', 'h' => 26],
];
// Enough copies to fill wide screens; the second half repeats the first so the loop is seamless.
$row = array_merge(...array_fill(0, 4, $clients));
?>
<section class="clients" aria-label="Empresas que confían en ZERO">
  <p class="clients-title">Empresas que ya confían en ZERO</p>
  <div class="marquee">
    <div class="marquee-track">
      <?php foreach ([false, true] as $copy): ?>
        <ul class="marquee-group" <?= $copy ? 'aria-hidden="true"' : '' ?>>
          <?php foreach ($row as $i => $c): ?>
            <li><img src="/assets/img/clients/<?= e($c['logo']) ?>" alt="<?= $copy || $i >= count($clients) ? '' : e($c['name']) ?>" style="height:<?= (int) $c['h'] ?>px" loading="lazy"></li>
          <?php endforeach; ?>
        </ul>
      <?php endforeach; ?>
    </div>
  </div>
</section>
