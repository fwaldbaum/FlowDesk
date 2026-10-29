<?php $t = stored_tier($plan ?? null, $until ?? null); ?>
<?php if ($t === 'free'): ?><span class="badge">Gratis</span><?php else: ?><span class="badge badge-tier"><?= e(ucfirst($t)) ?></span><?php endif; ?>
