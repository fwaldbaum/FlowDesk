<section class="page-head">
  <div class="container">
    <span class="eyebrow">Sobre nosotros</span>
    <h1>Hacemos software que se entiende</h1>
    <p class="lead">ZERO Solutions es una empresa chilena que crea herramientas digitales simples para emprendedores y pymes.</p>
  </div>
</section>

<section class="section" style="padding-top:40px">
  <div class="container narrow prose reveal">
    <p>Muchos negocios todavía venden con planillas, cuadernos y chats perdidos, porque el software que existe es caro, complicado o está pensado para empresas gigantes. Creemos que eso tiene que cambiar.</p>
    <p>Por eso empezamos desde cero, con una idea: herramientas que se aprenden en minutos, que funcionan desde el celular o el computador y que acompañan a tu negocio mientras crece. FlowDesk, nuestro CRM, es el primer paso. Vienen más.</p>
  </div>
</section>

<section class="section section-soft">
  <div class="container center">
    <span class="eyebrow">Lo que nos guía</span>
    <h2 class="h2">Nuestros principios</h2>
    <div class="values" style="text-align:left">
      <div class="card reveal"><span class="feature-icon"><?= icon('zap', 22) ?></span><h3>Simple primero</h3><p>Si algo necesita un manual, lo rediseñamos hasta que no lo necesite.</p></div>
      <div class="card reveal"><span class="feature-icon"><?= icon('users', 22) ?></span><h3>Cerca de quien lo usa</h3><p>Construimos escuchando a emprendedores y pymes reales.</p></div>
      <div class="card reveal"><span class="feature-icon"><?= icon('shield-check', 22) ?></span><h3>Tus datos, protegidos</h3><p>La seguridad y la privacidad vienen incluidas, no se cobran aparte.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container center">
    <span class="eyebrow">Fundadores</span>
    <h2 class="h2">Las personas detrás de ZERO</h2>
    <?php partial('founders'); ?>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band reveal">
      <h2>¿Hablamos?</h2>
      <p>Escríbenos para dudas, ideas o alianzas.</p>
      <div class="hero-ctas">
        <a href="mailto:<?= e(config('contact_email')) ?>" class="btn btn-white btn-lg"><?= icon('mail', 18) ?> <?= e(config('contact_email')) ?></a>
      </div>
    </div>
  </div>
</section>
