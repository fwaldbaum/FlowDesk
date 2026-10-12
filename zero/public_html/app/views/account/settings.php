<h1>Ajustes</h1>
<p class="intro">Tu perfil y la seguridad de tu cuenta ZERO.</p>

<section class="acct-section">
  <div class="panel">
    <div class="panel-head"><h3>Perfil</h3><p>Así te verán en las aplicaciones de ZERO.</p></div>
    <div class="panel-body">
      <form class="form" method="post" action="/cuenta/perfil">
        <?= csrf_field() ?>
        <div class="field">
          <label for="name">Nombre y apellido</label>
          <input class="input" id="name" name="name" required value="<?= e($user['name']) ?>" autocomplete="name">
        </div>
        <div class="field">
          <label for="email">Correo</label>
          <input class="input" id="email" value="<?= e($user['email']) ?>" readonly>
          <p class="hint">Para cambiar tu correo escríbenos a <?= e(config('contact_email')) ?>.</p>
        </div>
        <div><button class="btn btn-primary">Guardar</button></div>
      </form>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Contraseña</h3><p>Al cambiarla cerraremos tu sesión en los demás dispositivos.</p></div>
    <div class="panel-body">
      <form class="form" method="post" action="/cuenta/contrasena">
        <?= csrf_field() ?>
        <div class="field">
          <label for="current">Contraseña actual</label>
          <?php partial('password', ['id' => 'current', 'name' => 'current', 'autocomplete' => 'current-password']); ?>
        </div>
        <div class="field">
          <label for="password">Nueva contraseña</label>
          <?php partial('password', ['id' => 'password', 'name' => 'password', 'autocomplete' => 'new-password', 'minlength' => 8, 'placeholder' => 'Mínimo 8 caracteres']); ?>
        </div>
        <div><button class="btn btn-primary">Cambiar contraseña</button></div>
      </form>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Sesiones</h3><p>¿Entraste desde un computador ajeno? Cierra la sesión en todos los demás dispositivos.</p></div>
    <div class="panel-body">
      <form method="post" action="/cuenta/cerrar-sesiones">
        <?= csrf_field() ?>
        <button class="btn btn-secondary"><?= icon('log-out', 17) ?> Cerrar las demás sesiones</button>
      </form>
    </div>
  </div>
</section>
