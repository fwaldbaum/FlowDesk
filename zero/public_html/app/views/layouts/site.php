<?php $user = current_user(); $nav = $nav ?? ''; ?>
<!doctype html>
<html lang="es" class="no-js">
<head><?php partial('head', ['title' => $title ?? null, 'description' => $description ?? null]); ?></head>
<body>
<header class="nav">
  <div class="container nav-inner">
    <?php partial('logo'); ?>
    <nav class="nav-links" aria-label="Principal">
      <a href="/productos" class="<?= $nav === 'productos' ? 'active' : '' ?>">Productos</a>
      <a href="/flowdesk/">FlowDesk</a>
      <a href="/precios" class="<?= $nav === 'precios' ? 'active' : '' ?>">Precios</a>
      <a href="/nosotros" class="<?= $nav === 'nosotros' ? 'active' : '' ?>">Nosotros</a>
    </nav>
    <div class="nav-actions">
      <?php if ($user): ?>
        <a href="/cuenta" class="btn btn-primary btn-sm"><?= icon('layout-grid', 16) ?> Mi cuenta</a>
      <?php else: ?>
        <a href="/entrar" class="btn btn-ghost btn-sm">Entrar</a>
        <a href="/registro" class="btn btn-primary btn-sm">Crear cuenta</a>
      <?php endif; ?>
    </div>
    <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false"><?= icon('menu', 24) ?></button>
  </div>
  <div class="mobile-menu">
    <a href="/productos">Productos</a>
    <a href="/flowdesk/">FlowDesk</a>
    <a href="/precios">Precios</a>
    <a href="/nosotros">Nosotros</a>
    <?php if ($user): ?>
      <a href="/cuenta" class="btn btn-primary btn-block">Mi cuenta</a>
    <?php else: ?>
      <a href="/entrar">Entrar</a>
      <a href="/registro" class="btn btn-primary btn-block">Crear cuenta ZERO</a>
    <?php endif; ?>
  </div>
</header>

<main><?= $content ?></main>

<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <?php partial('logo'); ?>
        <p class="blurb">Software simple para emprendedores y pymes. Una cuenta para todas tus aplicaciones.</p>
      </div>
      <div>
        <h4>Productos</h4>
        <ul>
          <li><a href="/productos/flowdesk">FlowDesk</a></li>
          <li><a href="/productos">Todos los productos</a></li>
          <li><a href="/precios">Precios</a></li>
        </ul>
      </div>
      <div>
        <h4>Empresa</h4>
        <ul>
          <li><a href="/nosotros">Nosotros</a></li>
          <li><a href="mailto:<?= e(config('contact_email')) ?>">Contacto</a></li>
        </ul>
      </div>
      <div>
        <h4>Cuenta</h4>
        <ul>
          <li><a href="/entrar">Entrar</a></li>
          <li><a href="/registro">Crear cuenta</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <?= date('Y') ?> ZERO Solutions. Hecho en Chile.</span>
      <a href="mailto:<?= e(config('contact_email')) ?>"><?= e(config('contact_email')) ?></a>
    </div>
  </div>
</footer>
</body>
</html>
