<!doctype html>
<html lang="es" class="no-js">
<head><meta charset="utf-8"><?php partial('head', ['title' => $title ?? null]); ?><meta name="robots" content="noindex"></head>
<body>
<div class="auth-page">
  <?php partial('logo'); ?>
  <?= $content ?>
</div>
</body>
</html>
