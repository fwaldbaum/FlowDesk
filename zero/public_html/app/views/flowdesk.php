<section class="hero" style="padding-bottom:24px">
  <div class="container">
    <div class="product-head" style="justify-content:center">
      <span class="app-icon"><?= app_mark('flowdesk', 30) ?></span>
      <div style="text-align:left"><b>FlowDesk</b><div class="tag">CRM y ventas</div></div>
    </div>
    <h1>El CRM para vender <span class="accent">más ordenado</span></h1>
    <p class="lead">Todos tus clientes en un tablero, recordatorios a tiempo y WhatsApp en un clic. Hecho para emprendedores y pymes.</p>
    <div class="hero-ctas">
      <a href="/registro?next=/abrir/flowdesk" class="btn btn-primary btn-lg">Probar gratis <?= icon('arrow-right', 18, 'icon-arrow') ?></a>
      <a href="/abrir/flowdesk" class="btn btn-secondary btn-lg">Ya tengo cuenta</a>
    </div>
    <div class="shot-wrap reveal">
      <?php partial('browser', ['src' => '/assets/img/flowdesk/tablero.webp', 'alt' => 'Tablero de ventas de FlowDesk', 'loading' => 'eager']); ?>
    </div>
  </div>
</section>

<section class="section">
  <div class="container center">
    <span class="eyebrow">Funciones</span>
    <h2 class="h2">Lo que puedes hacer con FlowDesk</h2>
    <div class="grid-3" style="text-align:left">
      <?php
      $features = [
          ['kanban', 'Tablero de ventas', 'Arrastra cada lead a su etapa y ve cuánto dinero tienes en juego.'],
          ['sun', 'Vista Hoy', 'Tus recordatorios, los leads nuevos sin atender y los que se están enfriando.'],
          ['message-circle', 'WhatsApp en un clic', 'Escribe a cada cliente con un mensaje ya listo y queda registrado.'],
          ['globe', 'Formulario para tu web', 'Pégalo en tu sitio: cada envío aparece al instante en tu tablero.'],
          ['plug', '20 integraciones', 'Guías paso a paso para TikTok, Instagram, Facebook, Google, WhatsApp y más.'],
          ['upload', 'Importa y exporta', 'Trae tu lista de clientes desde Excel en CSV y llévatela cuando quieras.'],
      ];
      foreach ($features as [$ic, $t, $d]): ?>
        <div class="card card-hover reveal">
          <span class="feature-icon"><?= icon($ic, 22) ?></span>
          <h3><?= e($t) ?></h3>
          <p><?= e($d) ?></p>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<section class="section section-soft">
  <div class="container">
    <div class="center">
      <span class="eyebrow">Por dentro</span>
      <h2 class="h2">Así se ve FlowDesk</h2>
    </div>
    <div class="gallery">
      <figure class="reveal">
        <?php partial('browser', ['src' => '/assets/img/flowdesk/ficha.webp', 'alt' => 'Ficha de un lead en FlowDesk']); ?>
        <figcaption><b>Ficha de cada cliente</b><span>Historial, notas, recordatorios y contacto directo.</span></figcaption>
      </figure>
      <figure class="reveal">
        <?php partial('browser', ['src' => '/assets/img/flowdesk/integraciones.webp', 'alt' => 'Catálogo de integraciones de FlowDesk']); ?>
        <figcaption><b>Integraciones</b><span>Conecta tus anuncios y canales para que los leads lleguen solos.</span></figcaption>
      </figure>
      <figure class="reveal">
        <?php partial('browser', ['src' => '/assets/img/flowdesk/formulario.webp', 'alt' => 'Editor del formulario web de FlowDesk']); ?>
        <figcaption><b>Formulario web</b><span>Personaliza colores, campos y textos, y pégalo en tu sitio.</span></figcaption>
      </figure>
      <figure class="reveal">
        <?php partial('browser', ['src' => '/assets/img/flowdesk/contactos.webp', 'alt' => 'Lista de contactos de FlowDesk']); ?>
        <figcaption><b>Contactos</b><span>Busca, filtra, importa y exporta toda tu base de clientes.</span></figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="cta-band reveal">
      <h2>Prueba FlowDesk hoy</h2>
      <p>Crea tu cuenta ZERO y entra a FlowDesk con un clic.</p>
      <div class="hero-ctas">
        <a href="/registro?next=/abrir/flowdesk" class="btn btn-white btn-lg">Empezar gratis</a>
      </div>
    </div>
  </div>
</section>
