<?php
$founders = [
    ['name' => 'Matías Waldbaum', 'role' => 'Cofundador', 'photo' => '/assets/img/team/matias.webp'],
    ['name' => 'Facundo Waldbaum', 'role' => 'Cofundador', 'photo' => '/assets/img/team/facundo.webp'],
];
?>
<div class="founders">
  <?php foreach ($founders as $f): ?>
    <div class="card founder reveal">
      <img class="avatar-photo" src="<?= e($f['photo']) ?>" alt="<?= e($f['name']) ?>" width="120" height="120" loading="lazy">
      <h3><?= e($f['name']) ?></h3>
      <p class="role"><?= e($f['role']) ?> de ZERO Solutions</p>
    </div>
  <?php endforeach; ?>
</div>
