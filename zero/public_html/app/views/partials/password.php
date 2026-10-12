<div class="input-wrap">
  <input class="input" type="password" id="<?= e($id) ?>" name="<?= e($name) ?>" autocomplete="<?= e($autocomplete) ?>" required minlength="<?= (int) ($minlength ?? 1) ?>" placeholder="<?= e($placeholder ?? '') ?>">
  <button type="button" class="reveal-pass" data-reveal-pass aria-label="Mostrar contraseña">
    <span class="when-hidden"><?= icon('eye', 18) ?></span><span class="when-shown" hidden><?= icon('eye-off', 18) ?></span>
  </button>
</div>
