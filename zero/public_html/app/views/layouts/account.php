<?php $section = $section ?? ''; ?>
<!doctype html>
<html lang="es" class="no-js">
<head><meta charset="utf-8"><?php partial('head', ['title' => $title ?? null]); ?><meta name="robots" content="noindex"></head>
<body class="acct-body">
<header class="acct-top">
  <div class="container nav-inner">
    <?php partial('logo'); ?>
    <nav class="acct-tabs" aria-label="Cuenta">
      <a href="/cuenta" class="<?= $section === 'apps' ? 'active' : '' ?>"><?= icon('layout-grid', 17) ?><span>Aplicaciones</span></a>
      <a href="/cuenta/plan" class="<?= $section === 'plan' ? 'active' : '' ?>"><?= icon('credit-card', 17) ?><span>Plan</span></a>
      <a href="/cuenta/ajustes" class="<?= $section === 'ajustes' ? 'active' : '' ?>"><?= icon('settings', 17) ?><span>Ajustes</span></a>
      <?php if (is_admin($user)): ?><a href="/admin" class="<?= $section === 'admin' ? 'active' : '' ?>"><?= icon('shield-check', 17) ?><span>Admin</span></a><?php endif; ?>
    </nav>
    <div class="user-chip">
      <div class="avatar"><?= e(initials($user['name'])) ?></div>
      <div class="who"><?= e($user['name']) ?><small><?= e($user['email']) ?></small></div>
      <form method="post" action="/salir">
        <?= csrf_field() ?>
        <button class="btn btn-ghost btn-sm" aria-label="Salir"><?= icon('log-out', 17) ?></button>
      </form>
    </div>
  </div>
</header>
<main class="acct-main">
  <div class="container">
    <?php partial('flashes'); ?>
    <?= $content ?>
  </div>
</main>
</body>
</html>
