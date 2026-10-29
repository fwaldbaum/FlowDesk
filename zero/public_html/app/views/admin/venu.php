<h1>Venu</h1>
<p class="intro">Organizadores y eventos. Los planes se manejan desde la cuenta ZERO del dueño.</p>
<?php partial('admin_nav', ['tab' => $tab]); ?>
<?php if (!$installed): ?>
  <div class="panel"><p class="admin-empty">Venu aún no está instalado en esta base de datos.</p></div>
<?php else: ?>
<?php partial('admin_search', ['search' => $search, 'placeholder' => 'Buscar organizador, evento o correo']); ?>
<section>
  <h2 class="admin-h2">Organizadores</h2>
  <div class="panel"><div class="table-wrap">
    <?php if (!$orgs): ?><p class="admin-empty">No hay organizadores<?= $search !== '' ? ' que coincidan' : ' todavía' ?>.</p><?php else: ?>
    <table class="table">
      <thead><tr><th>Organizador</th><th>Dueño</th><th>Plan</th><th>Eventos</th><th>Entradas</th><th>Ventas</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($orgs as $o): ?>
          <tr>
            <td><b><?= e($o['name']) ?></b><small class="admin-sub"><?= e($o['slug']) ?> · desde <?= e(local_time($o['created_at'], 'j M Y')) ?></small></td>
            <td><?php if ($o['zero_id']): ?><a class="admin-link" href="/admin/cuentas/<?= (int) $o['zero_id'] ?>"><?= e($o['email']) ?></a><?php else: ?><?= e($o['email']) ?><?php endif; ?></td>
            <td><?php partial('tier_badge', ['plan' => $o['plan'], 'until' => $o['plan_expires_at']]); ?></td>
            <td><?= (int) $o['published'] ?> publicados de <?= (int) $o['events'] ?></td>
            <td><?= number_format((int) $o['tickets'], 0, ',', '.') ?></td>
            <td><?= e(clp((int) $o['sales'])) ?></td>
            <td class="admin-right"><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="<?= e(venu_org_url($o['slug'])) ?>" title="Página del organizador"><?= icon('external-link', 15) ?></a></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div></div>
</section>
<section class="acct-section">
  <h2>Eventos</h2>
  <div class="panel"><div class="table-wrap">
    <?php if (!$events): ?><p class="admin-empty">No hay eventos<?= $search !== '' ? ' que coincidan' : ' todavía' ?>.</p><?php else: ?>
    <table class="table">
      <thead><tr><th>Evento</th><th>Organizador</th><th>Fecha</th><th>Estado</th><th>Entradas</th><th></th></tr></thead>
      <tbody>
        <?php foreach ($events as $ev): ?>
          <tr>
            <td><b><?= e($ev['title']) ?></b></td>
            <td><?= e($ev['org']) ?></td>
            <td class="admin-muted"><?= e(local_time($ev['starts_at'], 'j M Y, H:i')) ?></td>
            <td><?= $ev['status'] === 'published' ? '<span class="badge badge-live">Publicado</span>' : '<span class="badge">Borrador</span>' ?></td>
            <td><?= (int) $ev['tickets'] ?></td>
            <td class="admin-right">
              <?php if ($ev['status'] === 'published'): ?>
                <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="<?= e(venu_org_url($ev['org_slug']) . '/' . rawurlencode($ev['slug'])) ?>" title="Ver evento"><?= icon('external-link', 15) ?></a>
                <form method="post" action="/admin/venu/eventos/<?= (int) $ev['id'] ?>/despublicar" data-confirm="¿Despublicar «<?= e($ev['title']) ?>»? Las entradas vendidas siguen siendo válidas."><?= csrf_field() ?><button class="btn btn-ghost btn-sm btn-danger">Despublicar</button></form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div></div>
</section>
<?php endif; ?>
