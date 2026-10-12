<div class="auth-card">
  <h1>Elige una nueva contraseña</h1>
  <p class="intro">Al cambiarla cerraremos tu sesión en los demás dispositivos.</p>
  <?php if (!empty($error)): ?><div class="alert alert-error" role="alert"><?= icon('alert-circle', 18) ?><span><?= e($error) ?></span></div><?php endif; ?>
  <?php if ($token === ''): ?>
    <a href="/recuperar" class="btn btn-primary btn-block" style="margin-top:24px">Pedir un enlace nuevo</a>
  <?php else: ?>
    <form class="form" method="post" action="/restablecer">
      <?= csrf_field() ?>
      <input type="hidden" name="token" value="<?= e($token) ?>">
      <div class="field">
        <label for="password">Nueva contraseña</label>
        <?php partial('password', ['id' => 'password', 'name' => 'password', 'autocomplete' => 'new-password', 'minlength' => 8, 'placeholder' => 'Mínimo 8 caracteres']); ?>
      </div>
      <button class="btn btn-primary btn-block btn-lg">Guardar contraseña</button>
    </form>
  <?php endif; ?>
</div>
