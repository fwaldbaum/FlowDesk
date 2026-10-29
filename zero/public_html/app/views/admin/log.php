<?php $labels = ['plan.grant' => 'Plan regalado', 'plan.end' => 'Plan terminado', 'account.verify' => 'Correo confirmado', 'account.signout' => 'Sesiones cerradas', 'venu.unpublish' => 'Evento despublicado']; ?>
<h1>Registro</h1>
<p class="intro">Cada acción hecha desde esta administración, con quién y cuándo.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>
<div class="panel"><div class="table-wrap">
  <?php if (!$rows): ?><p class="admin-empty">Todavía no hay acciones registradas.</p><?php else: ?>
  <table class="table">
    <thead><tr><th>Fecha</th><th>Acción</th><th>Sobre</th><th>Detalle</th><th>Admin</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $r): [$targetLabel, $targetHref] = admin_target($r['target']); ?>
        <tr>
          <td class="admin-muted"><?= e(local_time($r['created_at'])) ?></td>
          <td><b><?= e($labels[$r['action']] ?? $r['action']) ?></b></td>
          <td><?php if ($targetHref): ?><a class="admin-link" href="<?= e($targetHref) ?>"><?= e($targetLabel) ?></a><?php else: ?><?= e($targetLabel) ?><?php endif; ?></td>
          <td><?= e($r['detail']) ?></td>
          <td class="admin-muted"><?= e($r['admin_email'] ?? '') ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div></div>
