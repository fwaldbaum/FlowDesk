<h1>Pido</h1>
<p class="intro">Restaurantes con tótem de autoservicio. Los planes se manejan desde la cuenta ZERO del dueño.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>
<?php if (!$installed): ?>
  <div class="panel"><p class="admin-empty">Pido aún no está instalado en esta base de datos.</p></div>
<?php else: ?>
<?php partial('admin_search', ['search' => $search, 'placeholder' => 'Buscar restaurante o correo del dueño']); ?>
<div class="panel"><div class="table-wrap">
  <?php if (!$rows): ?><p class="admin-empty">No hay restaurantes<?= $search !== '' ? ' que coincidan' : ' todavía' ?>.</p><?php else: ?>
  <table class="table">
    <thead><tr><th>Restaurante</th><th>Dueño</th><th>Plan</th><th>Tótems</th><th>Productos</th><th>Pedidos 30 días</th><th>Ventas</th><th>Tótem visto</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $r): ?>
        <tr>
          <td><b><?= e($r['name']) ?></b><small class="admin-sub">desde <?= e(local_time($r['created_at'], 'j M Y')) ?></small></td>
          <td><?php if ($r['zero_id']): ?><a class="admin-link" href="/admin/cuentas/<?= (int) $r['zero_id'] ?>"><?= e($r['email']) ?></a><?php else: ?><?= e($r['email']) ?><?php endif; ?></td>
          <td><?php partial('tier_badge', ['plan' => $r['plan'], 'until' => $r['plan_expires_at']]); ?></td>
          <td><?= (int) $r['kiosks'] ?></td>
          <td><?= (int) $r['products'] ?></td>
          <td><?= number_format((int) $r['orders_30d'], 0, ',', '.') ?></td>
          <td><?= e(clp((int) $r['sales'])) ?></td>
          <td class="admin-muted"><?= e(local_time($r['last_seen'], 'j M, H:i')) ?: 'Nunca' ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div></div>
<?php endif; ?>
