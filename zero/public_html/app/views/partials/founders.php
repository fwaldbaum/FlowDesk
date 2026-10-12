<?php $founders = [['name' => 'Matías Waldbaum', 'role' => 'Cofundador'], ['name' => 'Facundo Waldbaum', 'role' => 'Cofundador']]; ?>
<div class="founders">
  <?php foreach ($founders as $f): ?>
    <div class="card founder reveal">
      <div class="avatar"><?= e(initials($f['name'])) ?></div>
      <h3><?= e($f['name']) ?></h3>
      <p class="role"><?= e($f['role']) ?> de ZERO Solutions</p>
    </div>
  <?php endforeach; ?>
</div>
