<?php
$statusLabel = ['paid' => ['Pagado', 'badge-live'], 'rejected' => ['Rechazado', ''], 'mismatch' => ['En revisión', 'badge-warn'], 'cancelled' => ['Anulado', ''], 'error' => ['Error', '']];
$appLinks = ['repeat' => '/admin/repeat', 'venu' => '/admin/venu', 'pido' => '/admin/pido'];
?>
<h1>Administración</h1>
<p class="intro">Todas las cuentas y aplicaciones de ZERO en un solo lugar.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>

<?php if ($stats['review']): ?>
  <div class="alert alert-info" style="margin-top:24px"><?= icon('alert-circle', 18) ?>
    <span><?= $stats['review'] ?> <?= $stats['review'] === 1 ? 'pago no coincide' : 'pagos no coinciden' ?> con el plan elegido y <?= $stats['review'] === 1 ? 'espera' : 'esperan' ?> revisión. Búscalos en los pagos recientes.</span></div>
<?php endif; ?>

<div class="stat-grid">
  <div class="stat"><span>Cuentas ZERO</span><b><?= number_format($stats['accounts'], 0, ',', '.') ?></b><small><?= $stats['confirmed'] ?> confirmadas · <?= $stats['new_week'] ?> esta semana</small></div>
  <div class="stat"><span>Planes activos</span><b><?= $stats['active_subs'] ?></b><small>pagados o regalados</small></div>
  <div class="stat"><span>Ingresos del mes</span><b><?= e(clp($stats['revenue_month'])) ?></b><small>con IVA</small></div>
  <div class="stat"><span>Ingresos totales</span><b><?= e(clp($stats['revenue_total'])) ?></b><small>desde el primer pago</small></div>
</div>

<section class="acct-section">
  <h2>Aplicaciones</h2>
  <div class="admin-apps">
    <div class="panel admin-app">
      <div class="admin-app-head"><span class="app-icon"><?= app_mark('flowdesk', 24) ?></span><div><b>FlowDesk</b><small>CRM y ventas</small></div></div>
      <p>FlowDesk tiene su propia administración: usuarios, espacios, suspensiones y su registro de acciones.</p>
      <a href="<?= e(flowdesk_admin_url()) ?>" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Abrir admin de FlowDesk <?= icon('external-link', 14) ?></a>
    </div>
    <?php foreach (['repeat' => 'Fidelización', 'venu' => 'Entradas y eventos', 'pido' => 'Autoservicio para restaurantes'] as $id => $cat): ?>
      <div class="panel admin-app">
        <div class="admin-app-head"><span class="app-icon"><?= app_mark($id, 24) ?></span><div><b><?= e(ucfirst($id)) ?></b><small><?= e($cat) ?></small></div></div>
        <?php if (isset($apps[$id])): ?>
          <dl class="admin-mini">
            <?php foreach ($apps[$id] as $label => $value): ?><div><dt><?= e($label) ?></dt><dd><?= e(is_int($value) ? number_format($value, 0, ',', '.') : $value) ?></dd></div><?php endforeach; ?>
          </dl>
          <a href="<?= e($appLinks[$id]) ?>" class="btn btn-secondary btn-sm">Administrar <?= e(ucfirst($id)) ?> <?= icon('arrow-right', 14) ?></a>
        <?php else: ?>
          <p>Aún no está instalada en esta base de datos.</p>
        <?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<div class="admin-cols">
  <section class="acct-section">
    <h2>Pagos recientes</h2>
    <div class="panel"><div class="table-wrap">
      <?php if (!$payments): ?><p class="admin-empty">Todavía no hay pagos.</p><?php else: ?>
      <table class="table">
        <thead><tr><th>Cuenta</th><th>Plan</th><th>Monto</th><th>Estado</th></tr></thead>
        <tbody>
          <?php foreach ($payments as $p): [$label, $cls] = $statusLabel[$p['status']] ?? [$p['status'], '']; ?>
            <tr>
              <td><a class="admin-link" href="/admin/cuentas/<?= (int) $p['user_id'] ?>"><?= e($p['email']) ?></a><small class="admin-sub"><?= e(local_time($p['paid_at'] ?: $p['created_at'])) ?></small></td>
              <td><?= e(zero_plan($p['plan'])['name'] ?? $p['plan']) ?></td>
              <td><?= e(clp((int) $p['amount'])) ?></td>
              <td><span class="badge <?= $cls ?>"><?= e($label) ?></span></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
    </div></div>
  </section>
  <section class="acct-section">
    <h2>Registros recientes</h2>
    <div class="panel"><div class="table-wrap">
      <table class="table">
        <tbody>
          <?php foreach ($signups as $s): ?>
            <tr>
              <td><a class="admin-link" href="/admin/cuentas/<?= (int) $s['id'] ?>"><?= e($s['name']) ?></a><small class="admin-sub"><?= e($s['email']) ?></small></td>
              <td><?= $s['email_verified_at'] ? '<span class="badge badge-live">Confirmada</span>' : '<span class="badge">Sin confirmar</span>' ?></td>
              <td class="admin-muted"><?= e(local_time($s['created_at'], 'j M')) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div></div>
  </section>
</div>
