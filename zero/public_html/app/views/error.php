<section class="error-page">
  <div class="container">
    <div class="code">ERROR <?= (int) ($code ?? 500) ?></div>
    <h1><?= e(preg_replace('/ · ZERO$/', '', $title ?? 'Algo salió mal')) ?></h1>
    <p><?= e($message ?? '') ?></p>
    <?php $action = $action ?? ['label' => 'Volver al inicio', 'href' => '/']; ?>
    <a href="<?= e($action['href']) ?>" class="btn btn-primary"><?= e($action['label']) ?></a>
  </div>
</section>
