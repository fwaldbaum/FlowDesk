<?php
$a = $account;
$statusLabel = ['paid' => ['Pagado', 'badge-live'], 'rejected' => ['Rechazado', ''], 'mismatch' => ['En revisión', 'badge-warn'], 'cancelled' => ['Anulado', ''], 'error' => ['Error', '']];
$appNames = ['repeat' => 'Repeat', 'venu' => 'Venu'];
?>
<a href="/admin/cuentas" class="admin-back"><?= icon('arrow-left', 15) ?> Cuentas</a>
<div class="admin-person">
  <div class="avatar"><?= e(initials($a['name'])) ?></div>
  <div>
    <h1><?= e($a['name']) ?></h1>
    <p class="intro"><?= e($a['email']) ?> · cuenta #<?= (int) $a['id'] ?> · creada el <?= e(local_time($a['created_at'], 'j M Y')) ?></p>
  </div>
</div>
<?php partial('admin_nav', ['tab' => $tab]); ?>

<div class="admin-cols">
  <section class="acct-section">
    <h2>Cuenta</h2>
    <div class="panel"><div class="panel-body">
      <dl class="kv">
        <dt>Correo</dt><dd><?= $a['email_verified_at'] ? 'Confirmado el ' . e(local_time($a['email_verified_at'], 'j M Y')) : '<span class="badge">Sin confirmar</span>' ?></dd>
        <dt>Último acceso</dt><dd><?= e(local_time($a['last_login_at'])) ?: 'Nunca' ?></dd>
        <dt>Aplicaciones</dt><dd><?= $access ? e(implode(', ', array_map(fn ($id) => zero_apps()[$id]['name'] ?? $id, array_keys($access)))) : 'Aún no abre ninguna' ?></dd>
      </dl>
      <div class="admin-actions">
        <?php if (!$a['email_verified_at']): ?>
          <form method="post" action="/admin/cuentas/<?= (int) $a['id'] ?>/confirmar"><?= csrf_field() ?><button class="btn btn-secondary btn-sm"><?= icon('mail-check', 15) ?> Confirmar correo</button></form>
        <?php endif; ?>
        <form method="post" action="/admin/cuentas/<?= (int) $a['id'] ?>/cerrar-sesiones" data-confirm="¿Cerrar todas las sesiones de <?= e($a['email']) ?> en ZERO?"><?= csrf_field() ?><button class="btn btn-secondary btn-sm"><?= icon('log-out', 15) ?> Cerrar sesiones</button></form>
      </div>
    </div></div>
  </section>

  <section class="acct-section">
    <h2>Regalar o extender un plan</h2>
    <div class="panel"><div class="panel-body">
      <form method="post" action="/admin/cuentas/<?= (int) $a['id'] ?>/plan" class="admin-grant">
        <?= csrf_field() ?>
        <div class="field"><label for="g-plan">Plan</label>
          <select id="g-plan" name="plan" class="input" required>
            <?php foreach (zero_plans() as $key => $plan): ?><option value="<?= e($key) ?>"><?= e($plan['name']) ?></option><?php endforeach; ?>
          </select>
        </div>
        <div class="field"><label for="g-days">Días</label>
          <input id="g-days" name="days" type="number" min="1" max="3650" value="30" class="input" required>
        </div>
        <button class="btn btn-primary btn-sm"><?= icon('gift', 15) ?> Activar</button>
      </form>
      <p class="hint">Se suma al tiempo que le quede. No genera cobro ni aparece como pago, y las aplicaciones lo reciben al instante.</p>
    </div></div>
  </section>
</div>

<section class="acct-section">
  <h2>Planes</h2>
  <div class="panel"><div class="table-wrap">
    <?php if (!$subscriptions): ?><p class="admin-empty">Nunca ha tenido un plan.</p><?php else: ?>
    <table class="table">
      <thead><tr><th>Plan</th><th>Estado</th><th>Desde</th><th>Hasta</th><th>Origen</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($subscriptions as $s): $active = $s['ends_at'] > now_utc(); ?>
          <tr>
            <td><b><?= e(zero_plan($s['plan'])['name'] ?? $s['plan']) ?></b></td>
            <td><?= $active ? '<span class="badge badge-live">Activo</span>' : ($s['replaced_by'] ? '<span class="badge">Reemplazado</span>' : '<span class="badge">Vencido</span>') ?></td>
            <td class="admin-muted"><?= e(local_time($s['started_at'], 'j M Y')) ?></td>
            <td><?= e(local_time($s['ends_at'], 'j M Y')) ?></td>
            <td class="admin-muted"><?= (int) $s['amount'] === 0 ? 'Regalado' : e(clp((int) $s['amount'])) ?></td>
            <td class="admin-right"><?php if ($active): ?>
              <form method="post" action="/admin/cuentas/<?= (int) $a['id'] ?>/terminar-plan" data-confirm="¿Terminar <?= e(zero_plan($s['plan'])['name'] ?? $s['plan']) ?> ahora? No se devuelve dinero."><?= csrf_field() ?><input type="hidden" name="plan" value="<?= e($s['plan']) ?>"><button class="btn btn-ghost btn-sm btn-danger">Terminar</button></form>
            <?php endif; ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div></div>
  <p class="hint">Al terminar un plan, Repeat y Venu cambian en el acto. FlowDesk lo mantiene hasta su fecha de término; para quitarlo antes, usa su <a href="<?= e(flowdesk_admin_url()) ?>" target="_blank" rel="noopener">administración</a>.</p>
</section>

<?php if (array_filter($apps)): ?>
<section class="acct-section">
  <h2>En las aplicaciones</h2>
  <div class="admin-apps">
    <?php foreach ($apps as $id => $row): if (!$row) continue; ?>
      <div class="panel admin-app">
        <div class="admin-app-head"><span class="app-icon"><?= app_mark($id, 24) ?></span><div><b><?= e($appNames[$id]) ?></b><small><?= e($row['space'] ?? 'Sin espacio creado') ?></small></div><?php partial('tier_badge', ['plan' => $row['plan'], 'until' => $row['plan_expires_at']]); ?></div>
        <dl class="admin-mini">
          <?php if ($id === 'repeat'): ?><div><dt>Clientes</dt><dd><?= (int) $row['customers'] ?></dd></div><?php else: ?><div><dt>Eventos</dt><dd><?= (int) $row['events'] ?></dd></div><?php endif; ?>
          <div><dt>Último acceso</dt><dd><?= e(local_time($row['last_login_at'], 'j M')) ?: '—' ?></dd></div>
        </dl>
        <?php if ($row['slug']): ?><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="<?= e($id === 'repeat' ? repeat_card_url($row['slug']) : venu_org_url($row['slug'])) ?>">Ver página pública <?= icon('external-link', 14) ?></a><?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<?php if ($payments): ?>
<section class="acct-section">
  <h2>Pagos</h2>
  <div class="panel"><div class="table-wrap">
    <table class="table">
      <thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Estado</th><th>Medio</th><th>Orden</th></tr></thead>
      <tbody>
        <?php foreach ($payments as $p): [$label, $cls] = $statusLabel[$p['status']] ?? [$p['status'], '']; ?>
          <tr>
            <td><?= e(local_time($p['paid_at'] ?: $p['created_at'])) ?></td>
            <td><?= e(zero_plan($p['plan'])['name'] ?? $p['plan']) ?></td>
            <td><?= e(clp((int) $p['amount'])) ?></td>
            <td><span class="badge <?= $cls ?>"><?= e($label) ?></span></td>
            <td class="admin-muted"><?= e($p['media'] ?? '') ?></td>
            <td class="mono"><?= e($p['commerce_order']) ?><?= $p['mp_payment'] ? ' · MP ' . e($p['mp_payment']) : '' ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div></div>
</section>
<?php endif; ?>

<?php if ($log): ?>
<section class="acct-section">
  <h2>Acciones de administración</h2>
  <div class="panel"><ul class="admin-log">
    <?php foreach ($log as $l): ?><li><span><?= e($l['detail']) ?></span><small><?= e($l['admin_name'] ?? 'Admin') ?> · <?= e(local_time($l['created_at'])) ?></small></li><?php endforeach; ?>
  </ul></div>
</section>
<?php endif; ?>
