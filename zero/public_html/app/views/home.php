<?php $repeatUrl = zero_app('repeat')['url'] ?? null; $venuUrl = zero_app('venu')['url'] ?? null; ?>
<section class="hero">
  <div class="container">
    <a href="/productos/flowdesk" class="pill"><span>Conoce <b>FlowDesk</b>, el CRM para pymes</span><span class="pill-tag">Nuevo</span></a>
    <h1>Software simple para <span class="accent hook">hacer crecer</span> tu negocio</h1>
    <p class="lead">ZERO Solutions crea herramientas para emprendedores y pymes. Con una sola cuenta ZERO accedes a todas nuestras aplicaciones: FlowDesk para vender, Repeat para que tus clientes vuelvan y Venu para vender entradas de tus eventos.</p>
    <div class="hero-ctas">
      <a href="/registro" class="btn btn-primary btn-lg">Crear cuenta gratis <?= icon('arrow-right', 18, 'icon-arrow') ?></a>
      <a href="/productos/flowdesk" class="btn btn-secondary btn-lg">Conocer FlowDesk</a>
    </div>
    <p class="hero-note">Gratis para empezar. <span class="hook hook-thin">Sin tarjeta de crédito.</span></p>

    <div class="apps-row" aria-label="Aplicaciones ZERO">
      <a href="/productos/flowdesk" class="app-tile"><span class="app-icon"><?= app_mark('flowdesk', 34) ?></span>FlowDesk</a>
      <?php if ($repeatUrl): ?><a href="#repeat" class="app-tile"><span class="app-icon"><?= app_mark('repeat', 34) ?></span>Repeat</a><?php endif; ?>
      <?php if ($venuUrl): ?><a href="#venu" class="app-tile"><span class="app-icon"><?= app_mark('venu', 34) ?></span>Venu</a><?php endif; ?>
      <?php for ($i = 0; $i < 3 - ($repeatUrl ? 1 : 0) - ($venuUrl ? 1 : 0); $i++): ?>
        <span class="app-tile soon"><span class="app-icon"><?= icon('plus', 26) ?></span>Próximamente</span>
      <?php endfor; ?>
    </div>

    <div class="shot-wrap reveal">
      <?php partial('browser', ['src' => '/assets/img/flowdesk/tablero.webp', 'alt' => 'Tablero de ventas de FlowDesk con leads en cada etapa', 'loading' => 'eager']); ?>
    </div>
  </div>
</section>

<?php partial('clients'); ?>

<section class="section section-soft">
  <div class="container center">
    <span class="eyebrow">Cuenta ZERO</span>
    <h2 class="h2"><span class="hook">Una cuenta</span> para todas tus aplicaciones</h2>
    <p class="sub">Entra una vez y abre cualquier aplicación de ZERO <span class="hook hook-thin">sin volver a escribir tu contraseña</span>.</p>
    <div class="grid-3" style="text-align:left">
      <div class="card card-hover reveal">
        <span class="feature-icon"><?= icon('layout-grid', 22) ?></span>
        <h3>Todo en un lugar</h3>
        <p>Desde tu cuenta ves las aplicaciones que usas y las abres con un clic.</p>
      </div>
      <div class="card card-hover reveal">
        <span class="feature-icon"><?= icon('key', 22) ?></span>
        <h3>Un solo acceso</h3>
        <p>Tu correo y contraseña ZERO sirven para cada producto: los de hoy y los que vienen.</p>
      </div>
      <div class="card card-hover reveal">
        <span class="feature-icon"><?= icon('shield-check', 22) ?></span>
        <h3>Seguridad por defecto</h3>
        <p>Contraseñas cifradas, confirmación de correo y cierre de sesión en todos tus dispositivos.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="reveal">
      <div class="product-head">
        <span class="app-icon"><?= app_mark('flowdesk', 30) ?></span>
        <div><b>FlowDesk</b><div class="tag">CRM y ventas</div></div>
      </div>
      <h2 class="h2" style="margin-top:24px">Tus clientes, <span class="hook">ordenados</span> en un tablero</h2>
      <p class="sub">Cada interesado es una tarjeta. Muévela de etapa, deja notas y recordatorios, y <span class="hook hook-thin">sabe siempre a quién llamar hoy</span>.</p>
      <ul class="checks">
        <li><?= icon('check', 18) ?><span><b>Tablero de ventas</b> que arrastras de etapa en etapa.</span></li>
        <li><?= icon('check', 18) ?><span><b>Vista Hoy</b> con tus pendientes y los clientes que se enfrían.</span></li>
        <li><?= icon('check', 18) ?><span><b>WhatsApp en un clic</b>, con el mensaje ya escrito.</span></li>
        <li><?= icon('check', 18) ?><span><b>Formulario para tu web</b> que crea leads al instante.</span></li>
        <li><?= icon('check', 18) ?><span><b>20 guías de integración</b>: TikTok, Instagram, Facebook, Google y más.</span></li>
      </ul>
      <div class="hero-ctas" style="justify-content:flex-start">
        <a href="/registro?next=/abrir/flowdesk" class="btn btn-primary">Probar FlowDesk gratis <?= icon('arrow-right', 17, 'icon-arrow') ?></a>
        <a href="/productos/flowdesk" class="btn btn-secondary">Ver más</a>
      </div>
    </div>
    <div class="reveal">
      <?php partial('browser', ['src' => '/assets/img/flowdesk/hoy.webp', 'alt' => 'Vista Hoy de FlowDesk con recordatorios y leads nuevos']); ?>
    </div>
  </div>
</section>

<?php if ($repeatUrl): ?>
<section class="section section-soft" id="repeat">
  <div class="container split split-reverse">
    <div class="reveal">
      <div class="product-head">
        <span class="app-icon"><?= app_mark('repeat', 30) ?></span>
        <div><b>Repeat</b><div class="tag">Fidelización</div></div>
      </div>
      <h2 class="h2" style="margin-top:24px">Que tus clientes <span class="hook">vuelvan</span>, una y otra vez</h2>
      <p class="sub">La tarjeta de sellos de cartón, ahora en el celular de tus clientes. <span class="hook hook-thin">Sin apps que descargar</span> y sin tarjetas perdidas.</p>
      <ul class="checks">
        <li><?= icon('check', 18) ?><span><b>Tarjeta digital</b> con tus colores, tu logo y tu premio.</span></li>
        <li><?= icon('check', 18) ?><span><b>Sellos con la cámara</b> de tu celular, o buscando al cliente por su teléfono.</span></li>
        <li><?= icon('check', 18) ?><span><b>Google Wallet</b>: la tarjeta se guarda junto a sus pases y se actualiza sola.</span></li>
        <li><?= icon('check', 18) ?><span><b>Clientes por recuperar</b> con un mensaje de WhatsApp ya escrito.</span></li>
        <li><?= icon('check', 18) ?><span><b>Repeat Pro</b>: cumpleaños, sellos dobles, trae a un amigo y tu marca sin la nuestra.</span></li>
      </ul>
      <div class="hero-ctas" style="justify-content:flex-start">
        <a href="/registro?next=/abrir/repeat" class="btn btn-primary">Probar Repeat gratis <?= icon('arrow-right', 17, 'icon-arrow') ?></a>
        <a href="/precios#repeat" class="btn btn-secondary">Ver Repeat Pro</a>
      </div>
    </div>
    <div class="reveal">
      <?php partial('browser', ['src' => '/assets/img/repeat/panel.webp', 'alt' => 'Panel de Repeat con clientes, sellos del día y actividad reciente', 'url' => 'repeat.zerosolutions.cl']); ?>
    </div>
  </div>
</section>
<?php endif; ?>

<?php if ($venuUrl): ?>
<section class="section" id="venu">
  <div class="container split">
    <div class="reveal">
      <div class="product-head">
        <span class="app-icon"><?= app_mark('venu', 30) ?></span>
        <div><b>Venu</b><div class="tag">Entradas y eventos</div></div>
      </div>
      <h2 class="h2" style="margin-top:24px">Tu evento, tu página, <span class="hook">tus entradas</span></h2>
      <p class="sub">Crea la página de tu evento en minutos y vende entradas con Flow o Stripe. <span class="hook hook-thin">Sin comisión por entrada.</span></p>
      <ul class="checks">
        <li><?= icon('check', 18) ?><span><b>Editor de página</b> con fotos, textos, botones, mapa y tus colores.</span></li>
        <li><?= icon('check', 18) ?><span><b>Cobros con Flow o Stripe</b>: el dinero llega directo a tu cuenta.</span></li>
        <li><?= icon('check', 18) ?><span><b>Entradas con QR</b> por correo, con un mensaje que tú editas.</span></li>
        <li><?= icon('check', 18) ?><span><b>Control de acceso</b> escaneando las entradas con tu celular.</span></li>
        <li><?= icon('check', 18) ?><span><b>Venu Pro</b>: tu propio dominio, sin nuestra marca y hasta 500 correos al día.</span></li>
      </ul>
      <div class="hero-ctas" style="justify-content:flex-start">
        <a href="/registro?next=/abrir/venu" class="btn btn-primary">Probar Venu gratis <?= icon('arrow-right', 17, 'icon-arrow') ?></a>
        <a href="/precios#venu" class="btn btn-secondary">Ver Venu Pro</a>
      </div>
    </div>
    <div class="reveal">
      <?php partial('browser', ['src' => '/assets/img/venu/evento.webp', 'alt' => 'Página de un evento en Venu con entradas a la venta', 'url' => 'tumarca.venu.zerosolutions.cl']); ?>
    </div>
  </div>
</section>
<?php endif; ?>

<section class="section">
  <div class="container center">
    <span class="eyebrow">Cómo funciona</span>
    <h2 class="h2">Empieza en <span class="hook">tres pasos</span></h2>
    <div class="steps" style="text-align:left">
      <div class="step reveal"><span class="step-num">1</span><h3>Crea tu cuenta ZERO</h3><p>Solo tu nombre, tu correo y una contraseña.</p></div>
      <div class="step reveal"><span class="step-num">2</span><h3>Confirma tu correo</h3><p>Te enviamos un enlace para activar tu cuenta.</p></div>
      <div class="step reveal"><span class="step-num">3</span><h3>Abre tus aplicaciones</h3><p>Entra a FlowDesk o Repeat desde tu cuenta, sin otra contraseña.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container center">
    <span class="eyebrow">Quiénes somos</span>
    <h2 class="h2">Una empresa chilena que hace <span class="hook">software que se entiende</span></h2>
    <p class="sub">ZERO Solutions fue fundada por Matías Waldbaum y Facundo Waldbaum para que cualquier negocio, sin importar su tamaño, tenga herramientas simples y bien hechas.</p>
    <?php partial('founders'); ?>
    <p style="margin-top:36px"><a href="/nosotros" class="link">Conoce nuestra historia <?= icon('arrow-right', 16) ?></a></p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band reveal">
      <h2>Empieza <span class="hook hook-light">hoy</span> con ZERO</h2>
      <p>Crea tu cuenta gratis y abre FlowDesk en minutos.</p>
      <div class="hero-ctas">
        <a href="/registro" class="btn btn-white btn-lg">Crear cuenta gratis</a>
        <a href="/entrar" class="btn btn-lg" style="color:#fff;border-color:rgba(255,255,255,.3)">Ya tengo cuenta</a>
      </div>
    </div>
  </div>
</section>
