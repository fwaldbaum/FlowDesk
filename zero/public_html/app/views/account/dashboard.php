<h1>Hola, <?= e(first_name($user['name'])) ?></h1>
<p class="intro">Desde aquí abres y administras tus aplicaciones ZERO.</p>

<?php if (!$user['email_verified_at']): ?>
  <div class="alert alert-info" style="margin-top:24px">
    <?= icon('mail', 18) ?>
    <span style="flex:1">Confirma tu correo <b><?= e($user['email']) ?></b> para abrir tus aplicaciones. Te enviamos un enlace al crear la cuenta.</span>
    <form method="post" action="/verificar/reenviar"><?= csrf_field() ?><button class="btn btn-secondary btn-sm">Reenviar correo</button></form>
  </div>
<?php endif; ?>

<section class="acct-section">
  <h2>Tus aplicaciones</h2>
  <div class="apps-grid">
    <?php foreach (zero_apps() as $id => $app): $used = $access[$id] ?? null; ?>
      <div class="card app-card">
        <div class="top">
          <span class="app-icon"><?= app_mark($id, 28) ?></span>
          <div>
            <h3><?= e($app['name']) ?></h3>
            <div class="cat"><?= e($app['category']) ?></div>
          </div>
        </div>
        <p class="desc"><?= e($app['summary']) ?></p>
        <div class="status">
          <?php if ($used): ?>
            <span class="badge badge-live">Activa</span> Último acceso: <?= e(local_time($used['last_opened_at'])) ?>
          <?php else: ?>
            <span class="badge">Lista para usar</span> Aún no la abres
          <?php endif; ?>
        </div>
        <div class="foot">
          <a href="/abrir/<?= e($id) ?>" class="btn btn-primary btn-sm">Abrir <?= e($app['name']) ?> <?= icon('external-link', 15) ?></a>
          <?php if (!empty($app['page'])): ?><a href="<?= e($app['page']) ?>" class="btn btn-ghost btn-sm">Ver detalles</a><?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
    <div class="card app-card soon">
      <div class="top">
        <span class="app-icon"><?= icon('hourglass', 22) ?></span>
        <div><h3>Próximamente</h3><div class="cat">Nuevas aplicaciones</div></div>
      </div>
      <p class="desc">Cuando lancemos nuevas aplicaciones aparecerán aquí, listas para abrir con esta misma cuenta.</p>
    </div>
  </div>
</section>

<section class="acct-section">
  <h2>Tu cuenta</h2>
  <div class="panel">
    <div class="panel-body">
      <dl class="kv">
        <dt>Nombre</dt><dd><?= e($user['name']) ?></dd>
        <dt>Correo</dt><dd><?= e($user['email']) ?> <?= $user['email_verified_at'] ? '<span class="badge badge-live" style="margin-left:6px">Confirmado</span>' : '<span class="badge" style="margin-left:6px">Sin confirmar</span>' ?></dd>
        <dt>Miembro desde</dt><dd><?= e(local_time($user['created_at'], 'j M Y')) ?></dd>
      </dl>
      <p style="margin-top:18px"><a href="/cuenta/ajustes" class="link">Editar perfil y contraseña <?= icon('arrow-right', 16) ?></a></p>
    </div>
  </div>
</section>
