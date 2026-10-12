<?php $next = $_GET['next'] ?? $GLOBALS['zero_old']['next'] ?? ''; ?>
<div class="auth-card">
  <h1>Entra a tu cuenta</h1>
  <p class="intro">Usa tu cuenta ZERO para abrir FlowDesk y nuestras demás aplicaciones.</p>
  <?php partial('flashes'); ?>
  <?php if (!empty($error)): ?><div class="alert alert-error" role="alert"><?= icon('alert-circle', 18) ?><span><?= e($error) ?></span></div><?php endif; ?>
  <form class="form" method="post" action="/entrar" novalidate>
    <?= csrf_field() ?>
    <input type="hidden" name="next" value="<?= e((string) $next) ?>">
    <div class="field">
      <label for="email">Correo</label>
      <input class="input" id="email" name="email" type="email" autocomplete="email" required value="<?= old('email') ?>" placeholder="tu@empresa.cl" autofocus>
    </div>
    <div class="field">
      <label for="password">Contraseña <a href="/recuperar">¿La olvidaste?</a></label>
      <?php partial('password', ['id' => 'password', 'name' => 'password', 'autocomplete' => 'current-password']); ?>
    </div>
    <button class="btn btn-primary btn-block btn-lg">Entrar</button>
  </form>
  <p class="auth-foot">¿No tienes cuenta? <a href="/registro<?= $next ? '?next=' . e(rawurlencode((string) $next)) : '' ?>">Créala gratis</a></p>
</div>
