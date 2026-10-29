<h1>Repeat</h1>
<p class="intro">Negocios con tarjetas de sellos. Los planes se manejan desde la cuenta ZERO del dueño.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>
<?php if (!$installed): ?>
  <div class="panel"><p class="admin-empty">Repeat aún no está instalado en esta base de datos.</p></div>
<?php else: ?>
<?php partial('admin_search', ['search' => $search, 'placeholder' => 'Buscar negocio, dirección o correo del dueño']); ?>
<div class="panel"><div class="table-wrap">
  <?php if (!$rows): ?><p class="admin-empty">No hay negocios<?= $search !== '' ? ' que coincidan' : ' todavía' ?>.</p><?php else: ?>
  <table class="table">
    <thead><tr><th>Negocio</th><th>Dueño</th><th>Plan</th><th>Clientes</th><th>Sellos 30 días</th><th>Última actividad</th><th></th></tr></thead>
    <tbody>
      <?php foreach ($rows as $r): ?>
        <tr>
          <td><b><?= e($r['name']) ?></b><small class="admin-sub"><?= e($r['category'] ?: 'Sin categoría') ?> · desde <?= e(local_time($r['created_at'], 'j M Y')) ?></small></td>
          <td><?php if ($r['zero_id']): ?><a class="admin-link" href="/admin/cuentas/<?= (int) $r['zero_id'] ?>"><?= e($r['email']) ?></a><?php else: ?><?= e($r['email']) ?><?php endif; ?></td>
          <td><?php partial('tier_badge', ['plan' => $r['plan'], 'until' => $r['plan_expires_at']]); ?></td>
          <td><?= number_format((int) $r['customers'], 0, ',', '.') ?></td>
          <td><?= number_format((int) $r['stamps_30d'], 0, ',', '.') ?></td>
          <td class="admin-muted"><?= e(local_time($r['last_activity'], 'j M Y')) ?: 'Sin actividad' ?></td>
          <td class="admin-right"><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="<?= e(repeat_card_url($r['slug'])) ?>" title="Página para unirse"><?= icon('external-link', 15) ?></a></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div></div>
<?php endif; ?>
