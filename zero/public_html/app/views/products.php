<section class="page-head">
  <div class="container">
    <span class="eyebrow">Productos</span>
    <h1>Aplicaciones ZERO</h1>
    <p class="lead">Cada producto resuelve una parte de tu negocio, y todos se abren con la misma cuenta ZERO.</p>
  </div>
</section>

<section class="section" style="padding-top:24px">
  <div class="container">
    <div class="catalog">
      <?php foreach (zero_apps() as $id => $app): ?>
        <div class="card card-hover product-card reveal">
          <span class="app-icon"><?= app_mark($id, 30) ?></span>
          <span class="meta"><?= e($app['category']) ?></span>
          <h3><?= e($app['name']) ?> <span class="badge badge-live" style="vertical-align:middle;margin-left:6px">Disponible</span></h3>
          <p><?= e($app['summary']) ?></p>
          <div class="foot">
            <?php if (!empty($app['page'])): ?><a href="<?= e($app['page']) ?>" class="btn btn-secondary btn-sm">Ver producto</a><?php endif; ?>
            <a href="/abrir/<?= e($id) ?>" class="btn btn-primary btn-sm">Abrir <?= icon('arrow-right', 15, 'icon-arrow') ?></a>
          </div>
        </div>
      <?php endforeach; ?>
      <?php for ($i = 0; $i < 2; $i++): ?>
        <div class="card product-card soon">
          <span class="app-icon"><?= icon('hourglass', 24) ?></span>
          <span class="meta" style="color:var(--subtle)">En desarrollo</span>
          <h3>Próximamente</h3>
          <p>Estamos construyendo nuevas aplicaciones. Llegarán a tu cuenta ZERO sin que tengas que crear otra.</p>
        </div>
      <?php endfor; ?>
    </div>
  </div>
</section>
