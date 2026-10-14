<?php
$plans = zero_plans();
$best = max(array_map(fn ($p) => yearly_saving($p)['percent'], $plans));
$checkoutLink = fn (string $key, string $period) => '/cuenta/plan?plan=' . rawurlencode($key) . '&periodo=' . ($period === 'year' ? 'anual' : 'mes');
?>
<section class="page-head">
  <div class="container">
    <span class="eyebrow">Precios</span>
    <h1>Planes simples, en pesos chilenos</h1>
    <p class="lead">Empieza gratis y cambia de plan cuando tu negocio lo pida. Todos los precios incluyen IVA.</p>
    <div class="period-toggle" role="group" aria-label="Forma de pago" hidden>
      <button type="button" data-period="month" aria-pressed="true">Mensual</button>
      <button type="button" data-period="year" aria-pressed="false">Anual <span class="save">Ahorra hasta <?= $best ?>%</span></button>
    </div>
  </div>
</section>

<section class="section" style="padding-top:32px">
  <div class="container">
    <div class="pricing-grid">
      <div class="card price-card">
        <span class="app-icon"><?= app_mark('flowdesk', 26) ?></span>
        <h3>FlowDesk Gratis</h3>
        <p class="tagline">Para ordenar tus primeros clientes.</p>
        <div class="price"><span class="amount">$0</span></div>
        <p class="price-note">Sin tarjeta, para siempre.</p>
        <a href="/flowdesk/registro" class="btn btn-secondary btn-block">Empezar gratis</a>
        <ul class="checks">
          <li><?= icon('check', 18) ?><span>1 usuario</span></li>
          <li><?= icon('check', 18) ?><span>Hasta 100 leads</span></li>
          <li><?= icon('check', 18) ?><span>Tablero, vista Hoy y notas</span></li>
          <li><?= icon('check', 18) ?><span>Formulario web y WhatsApp</span></li>
        </ul>
      </div>

      <?php foreach ($plans as $key => $plan): $save = yearly_saving($plan); ?>
        <div class="card price-card<?= !empty($plan['featured']) ? ' featured' : '' ?>" data-plan>
          <?php if (!empty($plan['featured'])): ?><span class="ribbon">Recomendado</span><?php endif; ?>
          <span class="app-icon"><?= $key === 'zero_plus' ? '<img src="/assets/img/zero-mark.svg" width="24" height="24" alt="">' : app_mark('flowdesk', 26) ?></span>
          <h3><?= e($plan['name']) ?></h3>
          <p class="tagline"><?= e($plan['tagline']) ?></p>
          <div class="price">
            <span class="amount" data-month="<?= e(clp($plan['price']['month'])) ?>" data-year="<?= e(clp($save['per_month'])) ?>"><?= e(clp($plan['price']['month'])) ?></span>
            <span class="per">/ mes</span>
          </div>
          <p class="price-note"
             data-month="<?= e('o ' . clp($plan['price']['year']) . ' al año, ahorrando ' . $save['percent'] . '%') ?>"
             data-year="<?= e(clp($plan['price']['year']) . ' en un solo pago al año') ?>"><?= e('o ' . clp($plan['price']['year']) . ' al año, ahorrando ' . $save['percent'] . '%') ?></p>
          <a href="<?= e($checkoutLink($key, 'month')) ?>" data-month="<?= e($checkoutLink($key, 'month')) ?>" data-year="<?= e($checkoutLink($key, 'year')) ?>"
             class="btn <?= !empty($plan['featured']) ? 'btn-primary' : 'btn-secondary' ?> btn-block">Elegir <?= e($plan['name']) ?></a>
          <ul class="checks">
            <?php foreach ($plan['features'] as $feature): ?>
              <li><?= icon('check', 18) ?><span><?= e($feature) ?></span></li>
            <?php endforeach; ?>
          </ul>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="pricing-faq">
      <div>
        <h4><?= icon('credit-card', 18) ?> ¿Cómo pago?</h4>
        <p>Con Flow: tarjetas de crédito y débito, transferencia y otros medios chilenos. Pagas por mes o por año, sin contratos.</p>
      </div>
      <div>
        <h4><?= icon('zap', 18) ?> ¿Y si cambio de plan?</h4>
        <p>Al subir de plan, los días que te quedaban se convierten en días extra del plan nuevo. No pierdes lo que ya pagaste.</p>
      </div>
      <div>
        <h4><?= icon('shield-check', 18) ?> ¿Qué pasa si no renuevo?</h4>
        <p>Tus datos quedan intactos y tu cuenta vuelve al plan gratis. Te avisamos por correo antes de que venza.</p>
      </div>
    </div>
  </div>
</section>
