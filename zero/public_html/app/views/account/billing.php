<?php
$statusLabel = ['paid' => ['Pagado', 'badge-live'], 'rejected' => ['Rechazado', ''], 'mismatch' => ['En revisión', ''], 'pending' => ['Pendiente', ''], 'cancelled' => ['Anulado', '']];
$flowdesk = app_tier((int) $user['id'], 'flowdesk');
?>
<h1>Mi plan</h1>
<p class="intro">Tus planes, pagos y lo que incluye cada uno.</p>

<?php if ($order): ?>
  <?php if ($order['status'] === 'paid'): ?>
    <div class="alert alert-success" style="margin-top:24px"><?= icon('circle-check', 18) ?>
      <span>Pago recibido. <?= e(zero_plan($order['plan'])['name'] ?? $order['plan']) ?> está activo hasta el <?= e(local_time($order['period_end'], 'j M Y')) ?>. Te enviamos el comprobante por correo.</span></div>
  <?php elseif ($order['status'] === 'pending'): ?>
    <div class="alert alert-info" style="margin-top:24px"><?= icon('clock', 18) ?>
      <span>Mercado Pago todavía está procesando tu pago (orden <?= e($order['commerce_order']) ?>). Cuando se confirme, tu plan se activa solo y te avisamos por correo.</span></div>
  <?php elseif ($order['status'] === 'mismatch'): ?>
    <div class="alert alert-info" style="margin-top:24px"><?= icon('clock', 18) ?>
      <span>Recibimos tu pago (orden <?= e($order['commerce_order']) ?>), pero no coincide con el plan elegido y lo estamos revisando. Te escribimos a tu correo para resolverlo; no tienes que volver a pagar.</span></div>
  <?php else: ?>
    <div class="alert alert-error" style="margin-top:24px"><?= icon('alert-circle', 18) ?>
      <span>El pago no se completó (orden <?= e($order['commerce_order']) ?>). No se hizo ningún cobro; puedes intentarlo de nuevo.</span></div>
  <?php endif; ?>
<?php endif; ?>

<?php if ($checkout): $plan = $checkout['plan']; $period = $checkout['period']; ?>
  <section class="acct-section">
    <div class="panel checkout-panel">
      <div class="panel-head"><h3>Confirmar <?= e($plan['name']) ?></h3><p><?= e($plan['tagline']) ?></p></div>
      <div class="panel-body">
        <?php if ($checkout['covered']): ?>
          <p>Tu plan <b><?= e($checkout['covered']['name']) ?></b> ya incluye todo lo de <?= e($plan['name']) ?>, activo hasta el <?= e(local_time($checkout['covered']['ends_at'], 'j M Y')) ?>.</p>
        <?php else: ?>
          <div class="period-pick">
            <?php foreach (PLAN_PERIODS as $p => $info): ?>
              <a href="/cuenta/plan?plan=<?= e(rawurlencode($checkout['key'])) ?>&periodo=<?= $p === 'year' ? 'anual' : 'mes' ?>" class="<?= $p === $period ? 'active' : '' ?>">
                <b><?= e($info['label']) ?></b>
                <span><?= e(clp($plan['price'][$p])) ?> / <?= e($info['unit']) ?></span>
                <?php if ($p === 'year'): ?><small>Ahorras <?= yearly_saving($plan)['percent'] ?>%</small><?php endif; ?>
              </a>
            <?php endforeach; ?>
          </div>
          <dl class="kv" style="margin-top:20px">
            <dt>Total a pagar</dt><dd><?= e(clp($plan['price'][$period])) ?> <span class="hint-inline">IVA incluido</span></dd>
            <dt>Duración</dt><dd>1 <?= e(PLAN_PERIODS[$period]['unit']) ?><?= $checkout['credit_days'] ? ' + ' . $checkout['credit_days'] . ' días de tu plan actual' : '' ?></dd>
            <dt>Renovación</dt><dd>Manual: te avisamos antes de que venza, sin cobros automáticos.</dd>
          </dl>
          <?php if (!$user['email_verified_at']): ?>
            <div class="alert alert-info" style="margin-top:22px">
              <?= icon('mail', 18) ?>
              <span style="flex:1">Para pagar, primero confirma tu correo <b><?= e($user['email']) ?></b> con el enlace que te enviamos (revisa también spam).</span>
              <form method="post" action="/verificar/reenviar"><?= csrf_field() ?><input type="hidden" name="next" value="<?= e($_SERVER['REQUEST_URI'] ?? '/cuenta/plan') ?>"><button class="btn btn-secondary btn-sm">Reenviar correo</button></form>
            </div>
          <?php else: ?>
            <form method="post" action="/pagar" style="margin-top:22px">
              <?= csrf_field() ?>
              <input type="hidden" name="plan" value="<?= e($checkout['key']) ?>">
              <input type="hidden" name="periodo" value="<?= $period === 'year' ? 'anual' : 'mes' ?>">
              <button class="btn btn-primary"><?= icon('credit-card', 17) ?> Pagar <?= e(clp($plan['price'][$period])) ?> con Mercado Pago</button>
              <a href="/precios" class="btn btn-ghost">Ver otros planes</a>
            </form>
          <?php endif; ?>
          <p class="hint" style="margin-top:14px">Te llevamos a Mercado Pago para pagar con tarjeta de crédito, débito o tu saldo de Mercado Pago. Al volver, tu plan se activa al instante.</p>
        <?php endif; ?>
      </div>
    </div>
  </section>
<?php endif; ?>

<section class="acct-section">
  <h2>Planes activos</h2>
  <?php if (!$subscriptions): ?>
    <div class="panel"><div class="panel-body plan-empty">
      <div>
        <b>Estás en el plan gratis</b>
        <p>FlowDesk funciona gratis con lo esencial. Con Pro o Max sumas usuarios, leads ilimitados e integraciones.</p>
      </div>
      <a href="/precios" class="btn btn-primary btn-sm">Ver planes <?= icon('arrow-right', 15) ?></a>
    </div></div>
  <?php else: ?>
    <div class="plan-list">
      <?php foreach ($subscriptions as $key => $sub): $plan = zero_plan($key); $days = (int) ceil((strtotime($sub['ends_at'] . ' UTC') - time()) / 86400); ?>
        <div class="panel"><div class="panel-body plan-row">
          <div>
            <b><?= e($plan['name']) ?></b> <span class="badge badge-live">Activo</span>
            <p>Vence el <?= e(local_time($sub['ends_at'], 'j M Y')) ?> · quedan <?= $days ?> <?= $days === 1 ? 'día' : 'días' ?> · último pago <?= e(clp((int) $sub['amount'])) ?> (<?= e(mb_strtolower(PLAN_PERIODS[$sub['period']]['label'])) ?>)</p>
          </div>
          <div class="plan-actions">
            <a href="/cuenta/plan?plan=<?= e(rawurlencode($key)) ?>&periodo=<?= $sub['period'] === 'year' ? 'anual' : 'mes' ?>" class="btn btn-secondary btn-sm">Renovar</a>
            <?php if ($key !== 'zero_plus'): ?><a href="/precios" class="btn btn-ghost btn-sm">Subir de plan</a><?php endif; ?>
          </div>
        </div></div>
      <?php endforeach; ?>
    </div>
    <p class="hint" style="margin-top:12px">En FlowDesk tu espacio tiene el plan <b><?= e(ucfirst($flowdesk['tier'])) ?></b>. Usa el mismo correo (<?= e($user['email']) ?>) en FlowDesk.</p>
  <?php endif; ?>
</section>

<?php if ($payments): ?>
  <section class="acct-section">
    <h2>Pagos</h2>
    <div class="panel"><div class="table-wrap">
      <table class="table">
        <thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Estado</th><th>Orden</th></tr></thead>
        <tbody>
          <?php foreach ($payments as $p): [$label, $cls] = $statusLabel[$p['status']] ?? [$p['status'], '']; ?>
            <tr>
              <td><?= e(local_time($p['paid_at'] ?: $p['created_at'], 'j M Y')) ?></td>
              <td><?= e(zero_plan($p['plan'])['name'] ?? $p['plan']) ?> · <?= e(mb_strtolower(PLAN_PERIODS[$p['period']]['label'] ?? '')) ?></td>
              <td><?= e(clp((int) $p['amount'])) ?></td>
              <td><span class="badge <?= $cls ?>"><?= e($label) ?></span></td>
              <td class="mono"><?= e($p['commerce_order']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div></div>
  </section>
<?php endif; ?>
