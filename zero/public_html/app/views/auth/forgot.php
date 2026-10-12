<div class="auth-card">
  <h1>Recupera tu contraseña</h1>
  <?php if (!empty($sent)): ?>
    <p class="intro">Si existe una cuenta con <b><?= e($sent) ?></b>, te enviamos un enlace para elegir una nueva contraseña. Revisa también la carpeta de spam.</p>
    <a href="/entrar" class="btn btn-secondary btn-block" style="margin-top:24px">Volver a entrar</a>
  <?php else: ?>
    <p class="intro">Escribe el correo de tu cuenta y te enviaremos un enlace para cambiarla.</p>
    <form class="form" method="post" action="/recuperar">
      <?= csrf_field() ?>
      <div class="field">
        <label for="email">Correo</label>
        <input class="input" id="email" name="email" type="email" autocomplete="email" required placeholder="tu@empresa.cl" autofocus>
      </div>
      <button class="btn btn-primary btn-block btn-lg">Enviar enlace</button>
    </form>
    <p class="auth-foot"><a href="/entrar">Volver a entrar</a></p>
  <?php endif; ?>
</div>
