<?php
$tabs = [
    'overview' => ['Resumen', 'layout-grid', '/admin'],
    'accounts' => ['Cuentas ZERO', 'users', '/admin/cuentas'],
    'repeat' => ['Repeat', null, '/admin/repeat'],
    'venu' => ['Venu', null, '/admin/venu'],
    'log' => ['Registro', 'history', '/admin/registro'],
];
?>
<nav class="admin-nav" aria-label="Administración">
  <?php foreach ($tabs as $key => [$label, $ic, $href]): ?>
    <a href="<?= e($href) ?>" class="<?= $tab === $key ? 'active' : '' ?>"><?= $ic ? icon($ic, 16) : app_mark($key, 16) ?><span><?= e($label) ?></span></a>
  <?php endforeach; ?>
  <a href="<?= e(flowdesk_admin_url()) ?>" target="_blank" rel="noopener" class="admin-nav-out"><?= app_mark('flowdesk', 16) ?><span>FlowDesk</span><?= icon('external-link', 13) ?></a>
</nav>
