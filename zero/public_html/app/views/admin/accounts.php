<?php $apps = zero_apps(); ?>
<h1>Cuentas ZERO</h1>
<p class="intro"><?= number_format($total, 0, ',', '.') ?> <?= $total === 1 ? 'cuenta' : 'cuentas' ?><?= $search !== '' ? ' coinciden con «' . e($search) . '»' : '' ?>.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>
<?php partial('admin_search', ['search' => $search, 'placeholder' => 'Buscar por nombre o correo']); ?>

<div class="panel"><div class="table-wrap">
  <?php if (!$rows): ?><p class="admin-empty">No hay cuentas que coincidan.</p><?php else: ?>
  <table class="table">
    <thead><tr><th>Cuenta</th><th>Correo</th><th>Aplicaciones</th><th>Planes</th><th>Último acceso</th><th>Creada</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $r): ?>
        <tr>
          <td><a class="admin-link" href="/admin/cuentas/<?= (int) $r['id'] ?>"><?= e($r['name']) ?></a><?php if (is_admin($r)): ?> <span class="badge badge-tier">Admin</span><?php endif; ?></td>
          <td><?= e($r['email']) ?><?php if (!$r['email_verified_at']): ?> <span class="badge">Sin confirmar</span><?php endif; ?></td>
          <td><span class="admin-marks"><?php foreach (array_filter(explode(',', (string) $r['apps'])) as $a): ?><span title="<?= e($apps[$a]['name'] ?? $a) ?>"><?= app_mark($a, 18) ?></span><?php endforeach; ?></span></td>
          <td><?php foreach (array_filter(explode(',', (string) $r['plans'])) as $pl): ?><span class="badge badge-tier"><?= e(zero_plan($pl)['name'] ?? $pl) ?></span> <?php endforeach; ?></td>
          <td class="admin-muted"><?= e(local_time($r['last_login_at'], 'j M Y')) ?: '—' ?></td>
          <td class="admin-muted"><?= e(local_time($r['created_at'], 'j M Y')) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div></div>
<?php if ($pages > 1): ?>
  <div class="admin-pages">
    <?php if ($page > 1): ?><a class="btn btn-secondary btn-sm" href="?<?= e(http_build_query(['q' => $search, 'p' => $page - 1])) ?>"><?= icon('arrow-left', 14) ?> Anterior</a><?php endif; ?>
    <span>Página <?= $page ?> de <?= $pages ?></span>
    <?php if ($page < $pages): ?><a class="btn btn-secondary btn-sm" href="?<?= e(http_build_query(['q' => $search, 'p' => $page + 1])) ?>">Siguiente <?= icon('arrow-right', 14) ?></a><?php endif; ?>
  </div>
<?php endif; ?>
