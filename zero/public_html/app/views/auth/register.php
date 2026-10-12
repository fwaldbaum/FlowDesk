<?php $next = $_GET['next'] ?? $GLOBALS['zero_old']['next'] ?? ''; ?>
<div class="auth-card">
  <h1>Crea tu cuenta ZERO</h1>
  <p class="intro">Una cuenta para todas nuestras aplicaciones<?= str_contains((string) $next, 'flowdesk') ? ', empezando por FlowDesk' : '' ?>.</p>
  <?php if (!empty($error)): ?><div class="alert alert-error" role="alert"><?= icon('alert-circle', 18) ?><span><?= e($error) ?></span></div><?php endif; ?>
  <form class="form" method="post" action="/registro" novalidate>
    <?= csrf_field() ?>
    <input type="hidden" name="next" value="<?= e((string) $next) ?>">
    <div class="field">
      <label for="name">Nombre y apellido</label>
      <input class="input" id="name" name="name" autocomplete="name" required value="<?= old('name') ?>" placeholder="Camila Rojas">
    </div>
    <div class="field">
      <label for="email">Correo</label>
      <input class="input" id="email" name="email" type="email" autocomplete="email" required value="<?= old('email') ?>" placeholder="tu@empresa.cl">
    </div>
    <div class="field">
      <label for="password">Contraseña</label>
      <?php partial('password', ['id' => 'password', 'name' => 'password', 'autocomplete' => 'new-password', 'minlength' => 8, 'placeholder' => 'Mínimo 8 caracteres']); ?>
    </div>
    <button class="btn btn-primary btn-block btn-lg">Crear cuenta</button>
  </form>
  <p class="auth-foot">¿Ya tienes cuenta? <a href="/entrar<?= $next ? '?next=' . e(rawurlencode((string) $next)) : '' ?>">Entra aquí</a></p>
</div>
<p class="auth-apps"><?= icon('lock', 14) ?> Tus datos viajan cifrados y tu contraseña nunca se guarda en texto plano.</p>
