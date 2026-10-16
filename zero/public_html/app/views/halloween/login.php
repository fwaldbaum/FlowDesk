<div class="auth-card">
  <h1>Panel de Halloween</h1>
  <p class="intro">Entra para cambiar la página de zerosolutions.cl/hallowing.</p>
  <?php if (!empty($error)): ?><div class="alert alert-error" role="alert"><?= icon('alert-circle', 18) ?><span><?= e($error) ?></span></div><?php endif; ?>
  <form class="form" method="post" action="/hallowing/config/entrar" novalidate>
    <?= csrf_field() ?>
    <div class="field">
      <label for="email">Correo</label>
      <input class="input" id="email" name="email" type="email" autocomplete="username" required value="<?= old('email') ?>" autofocus>
    </div>
    <div class="field">
      <label for="password">Contraseña</label>
      <?php partial('password', ['id' => 'password', 'name' => 'password', 'autocomplete' => 'current-password']); ?>
    </div>
    <button class="btn btn-primary btn-block btn-lg">Entrar</button>
  </form>
  <p class="auth-foot"><a href="/hallowing">Ver la página de Halloween</a></p>
</div>
