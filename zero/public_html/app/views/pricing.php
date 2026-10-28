<?php
$plans = zero_plans();
$best = max(array_map(fn ($p) => yearly_saving($p)['percent'], $plans));
$checkoutLink = fn (string $key, string $period) => '/cuenta/plan?plan=' . rawurlencode($key) . '&periodo=' . ($period === 'year' ? 'anual' : 'mes');
$planCard = function (string $key, array $plan) use ($checkoutLink): void {
    $save = yearly_saving($plan);
    $list = $plan['list_price'] ?? null;
    $featured = !empty($plan['featured']) || !empty($plan['offer']);
    $mark = $plan['app'] === 'zero' ? '<img src="/assets/img/zero-mark.svg" width="24" height="24" alt="">' : app_mark($plan['app'], 26);
    ?>
        <div class="card price-card<?= $featured ? ' featured' : '' ?><?= !empty($plan['offer']) ? ' offer' : '' ?>" data-plan>
          <?php if (!empty($plan['offer'])): ?><span class="ribbon"><?= e($plan['offer']) ?></span><?php elseif (!empty($plan['featured'])): ?><span class="ribbon">Recomendado</span><?php endif; ?>
          <span class="app-icon"><?= $mark ?></span>
          <h3><?= e($plan['name']) ?></h3>
          <p class="tagline"><?= e($plan['tagline']) ?></p>
          <?php if ($list): ?>
            <p class="was-price"><span data-month="<?= e(clp($list['month'])) ?>" data-year="<?= e(clp((int) round($list['year'] / 12))) ?>"><?= e(clp($list['month'])) ?></span> <b><?= (int) round((1 - $plan['price']['month'] / $list['month']) * 100) ?>% menos</b></p>
          <?php endif; ?>
          <div class="price">
            <span class="amount" data-month="<?= e(clp($plan['price']['month'])) ?>" data-year="<?= e(clp($save['per_month'])) ?>"><?= e(clp($plan['price']['month'])) ?></span>
            <span class="per">/ mes</span>
          </div>
          <p class="price-note"
             data-month="<?= e('o ' . clp($plan['price']['year']) . ' al año, ahorrando ' . $save['percent'] . '%') ?>"
             data-year="<?= e(clp($plan['price']['year']) . ' en un solo pago al año') ?>"><?= e('o ' . clp($plan['price']['year']) . ' al año, ahorrando ' . $save['percent'] . '%') ?></p>
          <a href="<?= e($checkoutLink($key, 'month')) ?>" data-month="<?= e($checkoutLink($key, 'month')) ?>" data-year="<?= e($checkoutLink($key, 'year')) ?>"
             class="btn <?= $featured ? 'btn-primary' : 'btn-secondary' ?> btn-block">Elegir <?= e($plan['name']) ?></a>
          <ul class="checks">
            <?php foreach ($plan['features'] as $feature): ?>
              <li><?= icon('check', 18) ?><span><?= e($feature) ?></span></li>
            <?php endforeach; ?>
          </ul>
        </div>
    <?php
};
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

      <?php foreach ($plans as $key => $plan) {
          if (!in_array($plan['app'], ['repeat', 'venu'], true)) {
              $planCard($key, $plan);
          }
      } ?>
    </div>

    <div class="pricing-group" id="repeat">
      <div class="pricing-group-head">
        <span class="app-icon"><?= app_mark('repeat', 26) ?></span>
        <div><h2>Repeat</h2><p>Tarjetas de sellos digitales para que tus clientes vuelvan.</p></div>
      </div>
      <div class="pricing-grid two">
        <div class="card price-card">
          <span class="app-icon"><?= app_mark('repeat', 26) ?></span>
          <h3>Repeat Gratis</h3>
          <p class="tagline">Tu tarjeta de sellos digital, lista en minutos.</p>
          <div class="price"><span class="amount">$0</span></div>
          <p class="price-note">Sin tarjeta, para siempre.</p>
          <a href="<?= e(zero_app('repeat')['url'] ?? '/productos') ?>" class="btn btn-secondary btn-block">Empezar gratis</a>
          <ul class="checks">
            <li><?= icon('check', 18) ?><span>Clientes ilimitados</span></li>
            <li><?= icon('check', 18) ?><span>Escáner con la cámara y búsqueda por teléfono</span></li>
            <li><?= icon('check', 18) ?><span>Tarjeta en el celular y en Google Wallet</span></li>
            <li><?= icon('check', 18) ?><span>Clientes por recuperar y cumpleaños del mes</span></li>
            <li><?= icon('check', 18) ?><span>Afiche con tu QR para imprimir</span></li>
          </ul>
        </div>
        <?php $planCard('repeat_pro', zero_plan('repeat_pro')); ?>
      </div>
    </div>

    <?php if (zero_app('venu')): ?>
    <div class="pricing-group" id="venu">
      <div class="pricing-group-head">
        <span class="app-icon"><?= app_mark('venu', 26) ?></span>
        <div><h2>Venu</h2><p>Tu página de eventos para vender entradas con Flow o Stripe.</p></div>
      </div>
      <div class="pricing-grid two">
        <div class="card price-card">
          <span class="app-icon"><?= app_mark('venu', 26) ?></span>
          <h3>Venu Gratis</h3>
          <p class="tagline">Tu página de eventos y tus entradas, sin comisión.</p>
          <div class="price"><span class="amount">$0</span></div>
          <p class="price-note">Sin tarjeta, para siempre.</p>
          <a href="<?= e(zero_app('venu')['url']) ?>" class="btn btn-secondary btn-block">Empezar gratis</a>
          <ul class="checks">
            <li><?= icon('check', 18) ?><span>Tu página en tumarca.venu.zerosolutions.cl</span></li>
            <li><?= icon('check', 18) ?><span>Cobros con Flow y Stripe, directo a tu cuenta</span></li>
            <li><?= icon('check', 18) ?><span>Editor de página y de correo</span></li>
            <li><?= icon('check', 18) ?><span>Hasta 3 eventos publicados y 25 correos al día</span></li>
            <li><?= icon('check', 18) ?><span>Entradas con QR y control de acceso</span></li>
          </ul>
        </div>
        <?php $planCard('venu_pro', zero_plan('venu_pro')); ?>
      </div>
    </div>
    <?php endif; ?>

    <div class="pricing-faq">
      <div>
        <h4><?= icon('credit-card', 18) ?> ¿Cómo pago?</h4>
        <p>Con Mercado Pago: tarjetas de crédito y débito o tu saldo en Mercado Pago. Pagas por mes o por año, sin contratos.</p>
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
