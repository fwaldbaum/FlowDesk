<form class="admin-search" method="get">
  <?= icon('search', 16) ?>
  <input class="input" type="search" name="q" value="<?= e($search) ?>" placeholder="<?= e($placeholder) ?>" aria-label="Buscar">
  <?php if ($search !== ''): ?><a href="?" class="btn btn-ghost btn-sm">Limpiar</a><?php endif; ?>
</form>
