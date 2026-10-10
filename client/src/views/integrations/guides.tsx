import type { ReactNode } from 'react';
import {
  Bot, CalendarCheck, ClipboardList, FileSpreadsheet, Gamepad2, Hash, LayoutTemplate, Mail, Megaphone, MessageCircle,
  Music2, Newspaper, PanelsTopLeft, Send, ShoppingBag, Smartphone, SquareMousePointer, Target,
  type LucideIcon,
} from 'lucide-react';
import { CodeBlock } from '../../components/copy';
import { AppLink, B, CopyField, Ext, MakeHttp, MakeRun, ManyChatRequest, Note, Ui, ZapierPost } from './parts';

export type Category = 'ads' | 'messaging' | 'web' | 'data' | 'alerts';

export const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'ads', label: 'Anuncios' },
  { id: 'messaging', label: 'Mensajería' },
  { id: 'web', label: 'Sitio web y formularios' },
  { id: 'data', label: 'Correo y planillas' },
  { id: 'alerts', label: 'Avisos al equipo' },
];

export type Guide = {
  id: string;
  name: string;
  category: Category;
  icon: LucideIcon;
  /** Brand tint for the icon tile. */
  color: string;
  via: string;
  minutes: number;
  summary: string;
  /** Value sent as `source`; also used to detect the integration in the webhook log. */
  source?: string;
  requirements: ReactNode[];
  steps: { title: string; body: ReactNode }[];
  tips?: [string, string][];
};

const TIKTOK_CALLBACK = 'https://www.integromat.com/oauth/cb/tiktok-lead-forms';

/** Steps shared by Facebook and Instagram, which both use Meta instant forms. */
function metaLeadSteps(source: string, placement: string): Guide['steps'] {
  return [
    {
      title: 'Crea el escenario en Make con Facebook Lead Ads',
      body: (
        <>
          <p>
            En Make, haz clic en <Ui>Create a new scenario</Ui>, agrega la app <Ui>Facebook Lead Ads</Ui> y elige el
            disparador <Ui>Watch Leads</Ui>.
          </p>
          <p>
            Crea la conexión iniciando sesión con la cuenta de Facebook que administra la página y acepta todos los
            permisos que pide (sin ellos Make no puede leer los leads).
          </p>
          <p>
            Elige la <B>página</B> y el <B>formulario instantáneo</B> que usas en {placement}.
          </p>
        </>
      ),
    },
    {
      title: 'Envía el lead a FlowDesk con el módulo HTTP',
      body: (
        <MakeHttp
          from="Facebook Lead Ads"
          source={source}
          fields={{ name: '{{Nombre completo}}', email: '{{Correo electrónico}}', phone: '{{Número de teléfono}}', notes: `Lead de ${source} · {{Nombre del formulario}}` }}
        />
      ),
    },
    {
      title: 'Prueba y activa',
      body: (
        <>
          <MakeRun test="crea un lead de prueba con la herramienta oficial de Meta (elige tu página y formulario, y pulsa «Crear lead»)" />
          <Ext href="https://developers.facebook.com/tools/lead-ads-testing">Abrir la herramienta de prueba de anuncios para clientes potenciales</Ext>
        </>
      ),
    },
  ];
}

/** Steps shared by the website builders: paste the FlowDesk form snippet. */
function embedIntro() {
  return (
    <>
      <p>
        En FlowDesk abre <AppLink to="/app/configuracion">Configuración</AppLink> → <B>Formulario para tu web</B>, ajusta el
        título y el texto del botón, y copia el código de la pestaña <Ui>Código para tu web</Ui>.
      </p>
      <p>Los envíos de ese formulario llegan directo a «Nuevo Lead», con protección antispam incluida.</p>
    </>
  );
}

function makeTrigger(app: string, module: string, rest: ReactNode) {
  return (
    <>
      <p>
        En Make, haz clic en <Ui>Create a new scenario</Ui>, agrega la app <Ui>{app}</Ui> y elige <Ui>{module}</Ui>.
      </p>
      {rest}
    </>
  );
}

/** Notification guides: branch the Make scenario that already sends leads to FlowDesk. */
function routerStep(target: string) {
  return {
    title: 'Agrega una ruta a tu escenario de Make',
    body: (
      <>
        <p>
          Abre el escenario que envía leads a FlowDesk (por ejemplo el de TikTok o Facebook). Haz clic derecho sobre la
          conexión entre el disparador y el módulo HTTP y elige <Ui>Add a router</Ui>.
        </p>
        <p>
          La primera ruta sigue enviando el lead a FlowDesk; en la segunda agregarás el aviso a {target}. Así los dos
          pasos usan los mismos datos.
        </p>
      </>
    ),
  };
}

const ALERT_REQUIREMENTS = [
  <>Un escenario de Make que ya envíe leads a FlowDesk (cualquiera de las guías de anuncios o formularios).</>,
];

const ALERT_TIP: [string, string] = [
  '¿Avisa también los leads que creo a mano?',
  'No: el aviso sale desde Make, así que solo cubre los leads que pasan por ese escenario. Los creados a mano o con el formulario de FlowDesk no generan aviso.',
];

export const GUIDES: Guide[] = [
  // ---- Anuncios -----------------------------------------------------------------
  {
    id: 'tiktok',
    name: 'TikTok Lead Ads',
    category: 'ads',
    icon: Music2,
    color: '#FF0050',
    via: 'Make',
    minutes: 15,
    summary: 'Los formularios instantáneos de tus anuncios en TikTok llegan solos al tablero.',
    source: 'TikTok Ads',
    requirements: [
      <>Una cuenta de <B>Make</B> (el plan gratuito sirve para empezar).</>,
      <>Una cuenta de <B>TikTok for Business</B> con al menos un formulario instantáneo en TikTok Ads Manager.</>,
      <>Acceso a la <B>API de TikTok for Business</B> (se solicita en el portal para desarrolladores; la aprobación puede tardar).</>,
    ],
    steps: [
      {
        title: 'Crea la app en TikTok for Business Developers',
        body: (
          <>
            <p>
              Entra al portal para desarrolladores con tu cuenta. En el ícono de tu perfil elige <Ui>Manage apps</Ui> y
              luego <Ui>Connect an app</Ui> (o abre una app que ya tengas).
            </p>
            <p>Si te pide una URL de redirección (callback), pega esta:</p>
            <CopyField label="Callback URL" value={TIKTOK_CALLBACK} />
            <p>
              En <Ui>App details</Ui> → <Ui>Credentials</Ui> copia el <B>Client ID</B> y el <B>Client secret</B>.
            </p>
            <Ext href="https://business-api.tiktok.com/portal">Abrir portal de TikTok for Business Developers</Ext>
          </>
        ),
      },
      {
        title: 'Crea el escenario en Make con TikTok Lead Forms',
        body: makeTrigger(
          'TikTok Lead Forms',
          'Watch Leads',
          <>
            <p>
              Pulsa <Ui>Create a webhook</Ui> y después <Ui>Create a connection</Ui>. Pega el Client ID y el Client secret
              y autoriza a Make con tu cuenta de TikTok.
            </p>
            <p>Selecciona tu cuenta publicitaria (Advertiser) y el formulario instantáneo que quieres conectar.</p>
          </>,
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="TikTok"
            source="TikTok Ads"
            fields={{ name: '{{Nombre}}', email: '{{Correo}}', phone: '{{Teléfono}}', notes: 'Lead de TikTok · {{Nombre del formulario}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="completa tu formulario de TikTok (o espera el primer lead real)" /> },
    ],
    tips: [
      ['TikTok rechaza la URL de redirección', 'Usa exactamente la que muestra Make al crear la conexión si es distinta a la de esta guía.'],
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Lead Ads',
    category: 'ads',
    icon: Target,
    color: '#1877F2',
    via: 'Make',
    minutes: 10,
    summary: 'Cada persona que completa el formulario de tu anuncio en Facebook entra como lead.',
    source: 'Facebook Ads',
    requirements: [
      <>Una cuenta de <B>Make</B>.</>,
      <>Ser <B>administrador</B> de la página de Facebook que publica los anuncios.</>,
      <>Un <B>formulario instantáneo</B> creado en el Administrador de anuncios de Meta.</>,
    ],
    steps: metaLeadSteps('Facebook Ads', 'tus anuncios de Facebook'),
  },
  {
    id: 'instagram',
    name: 'Instagram Lead Ads',
    category: 'ads',
    icon: SquareMousePointer,
    color: '#E1306C',
    via: 'Make',
    minutes: 10,
    summary: 'Los formularios de tus anuncios en Instagram, directo a «Nuevo Lead».',
    source: 'Instagram Ads',
    requirements: [
      <>Una cuenta de <B>Make</B>.</>,
      <>Tu cuenta de Instagram <B>vinculada a una página de Facebook</B> (los formularios de Instagram viven en esa página).</>,
      <>Un <B>formulario instantáneo</B> usado en una campaña con ubicación en Instagram.</>,
    ],
    steps: metaLeadSteps('Instagram Ads', 'tu campaña de Instagram'),
    tips: [
      ['No veo mi formulario en Make', 'Los formularios de Instagram pertenecen a la página de Facebook vinculada: elige esa página en Watch Leads.'],
    ],
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'ads',
    icon: Megaphone,
    color: '#FBBC04',
    via: 'Zapier',
    minutes: 10,
    summary: 'Recibe los formularios de clientes potenciales de tus campañas de Google.',
    source: 'Google Ads',
    requirements: [
      <>Una cuenta de <B>Zapier</B> con plan pago (para Webhooks by Zapier).</>,
      <>Una campaña de Google Ads con un <B>formulario de clientes potenciales</B> (recurso de formulario).</>,
    ],
    steps: [
      {
        title: 'Crea el Zap con el disparador de Google Ads',
        body: (
          <>
            <p>
              En Zapier pulsa <Ui>Create</Ui> → <Ui>Zaps</Ui>. Como disparador elige la app <Ui>Google Ads</Ui> y el evento{' '}
              <Ui>New Lead Form Entry</Ui>.
            </p>
            <p>Conecta tu cuenta de Google Ads y elige la cuenta y el formulario. Pulsa <Ui>Test trigger</Ui> para traer un ejemplo.</p>
          </>
        ),
      },
      {
        title: 'Envía el lead a FlowDesk',
        body: <ZapierPost source="Google Ads" fields={{ name: '{{Full Name}}', email: '{{Email}}', phone: '{{Phone Number}}' }} />,
      },
      {
        title: 'Prueba y publica',
        body: (
          <p>
            Pulsa <Ui>Test step</Ui>: el lead de ejemplo aparecerá en tu tablero. Luego pulsa <Ui>Publish</Ui> para dejar el
            Zap activo.
          </p>
        ),
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Lead Gen Forms',
    category: 'ads',
    icon: Newspaper,
    color: '#0A66C2',
    via: 'Zapier',
    minutes: 10,
    summary: 'Ideal para B2B: los formularios de tus anuncios en LinkedIn entran al pipeline.',
    source: 'LinkedIn Ads',
    requirements: [
      <>Una cuenta de <B>Zapier</B> con plan pago.</>,
      <>Acceso a la cuenta publicitaria en <B>LinkedIn Campaign Manager</B> y un formulario de generación de contactos.</>,
    ],
    steps: [
      {
        title: 'Crea el Zap con el disparador de LinkedIn',
        body: (
          <>
            <p>
              En Zapier crea un Zap con la app <Ui>LinkedIn Ads</Ui> y el evento <Ui>New Lead Gen Form Response</Ui>.
            </p>
            <p>Conecta tu cuenta, elige la cuenta publicitaria y el formulario, y pulsa <Ui>Test trigger</Ui>.</p>
          </>
        ),
      },
      {
        title: 'Envía el lead a FlowDesk',
        body: (
          <ZapierPost
            source="LinkedIn Ads"
            fields={{ name: '{{First Name}} {{Last Name}}', email: '{{Email}}', phone: '{{Phone}}', company: '{{Company Name}}' }}
          />
        ),
      },
      { title: 'Prueba y publica', body: <p>Pulsa <Ui>Test step</Ui> y luego <Ui>Publish</Ui>.</p> },
    ],
  },

  // ---- Mensajería ---------------------------------------------------------------
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business (mensajes entrantes)',
    category: 'messaging',
    icon: MessageCircle,
    color: '#25D366',
    via: 'Make',
    minutes: 25,
    summary: 'Cada persona que te escribe por primera vez a tu WhatsApp Business se crea como lead.',
    source: 'WhatsApp',
    requirements: [
      <>Una cuenta de <B>Make</B>.</>,
      <>Un número en la <B>plataforma de WhatsApp Business de Meta (Cloud API)</B>, administrado desde Meta Business.</>,
    ],
    steps: [
      {
        title: 'Conecta WhatsApp Business Cloud en Make',
        body: makeTrigger(
          'WhatsApp Business Cloud',
          'Watch Events',
          <>
            <p>Crea la conexión con tu cuenta de Meta y elige el número. En el webhook, marca el evento de <B>mensajes</B>.</p>
            <Note>
              Si tu número también usa la app de WhatsApp Business (modo coexistencia), Make puede no recibir los mensajes
              entrantes. Funciona mejor con un número dedicado a la Cloud API.
            </Note>
          </>,
        ),
      },
      {
        title: 'Evita duplicados con un Data store',
        body: (
          <>
            <p>
              Sin este paso, cada mensaje crearía un lead nuevo. Agrega <Ui>Data store</Ui> → <Ui>Get a record</Ui> con el
              número del remitente como clave. Entre ese módulo y el siguiente, pon un filtro: «el registro no existe».
            </p>
            <p>
              Al final del escenario agrega <Ui>Data store</Ui> → <Ui>Add/replace a record</Ui> con la misma clave, para
              recordar ese número.
            </p>
          </>
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="WhatsApp"
            source="WhatsApp"
            fields={{ name: '{{Nombre del perfil}}', phone: '{{Número del remitente}}', notes: 'Primer mensaje: {{Texto del mensaje}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="envía un mensaje a tu número desde otro teléfono" /> },
    ],
  },
  {
    id: 'whatsapp-flowdesk',
    name: 'WhatsApp en un clic',
    category: 'messaging',
    icon: Smartphone,
    color: '#25D366',
    via: 'Nativo',
    minutes: 3,
    summary: 'Escríbele a cada lead desde FlowDesk con un mensaje listo y el contacto registrado.',
    requirements: [<>Leads con número de teléfono.</>],
    steps: [
      {
        title: 'Configura tu país y tu mensaje',
        body: (
          <>
            <p>
              En <AppLink to="/app/configuracion">Configuración</AppLink> → <B>WhatsApp</B>, elige el <B>código de país</B> que se
              antepone a los números sin prefijo (por ejemplo 56 para Chile).
            </p>
            <p>
              Escribe tu plantilla. Puedes usar <code className="text-fg">{'{nombre}'}</code>,{' '}
              <code className="text-fg">{'{empresa_cliente}'}</code>, <code className="text-fg">{'{vendedor}'}</code> y{' '}
              <code className="text-fg">{'{empresa}'}</code>: FlowDesk los completa con los datos de cada lead.
            </p>
          </>
        ),
      },
      {
        title: 'Escríbele desde el lead o desde Hoy',
        body: (
          <p>
            Abre un lead en el <AppLink to="/app">Tablero</AppLink> o ve a <AppLink to="/app/hoy">Hoy</AppLink> y pulsa el botón de
            WhatsApp. Se abre el chat con el mensaje listo y el contacto queda registrado en el historial del lead.
          </p>
        ),
      },
    ],
  },
  {
    id: 'manychat',
    name: 'Instagram y Messenger (DM)',
    category: 'messaging',
    icon: Bot,
    color: '#0084FF',
    via: 'ManyChat',
    minutes: 15,
    summary: 'Convierte en lead a quien te escribe por mensaje directo en Instagram o Facebook.',
    source: 'Instagram DM',
    requirements: [
      <>Una cuenta de <B>ManyChat Pro</B> (la acción External Request es parte del plan Pro).</>,
      <>Tu Instagram profesional o tu página de Facebook conectados a ManyChat.</>,
    ],
    steps: [
      {
        title: 'Agrega una External Request a tu flujo',
        body: (
          <>
            <p>
              En ManyChat abre el flujo que responde los mensajes (por ejemplo, el que pide el correo o el teléfono). Después
              del paso donde la persona entrega sus datos, agrega una acción y elige <Ui>External Request</Ui>.
            </p>
            <p>En <Ui>Request type</Ui> elige <Ui>POST</Ui>, pega la URL y agrega la cabecera en la pestaña <Ui>Headers</Ui>:</p>
          </>
        ),
      },
      {
        title: 'Configura la solicitud',
        body: <ManyChatRequest />,
      },
      {
        title: 'Prueba',
        body: (
          <p>
            Pulsa <Ui>Test the request</Ui> (o escríbele a tu cuenta desde otro perfil y recorre el flujo). La respuesta debe
            ser <code className="text-fg">201</code> y el lead aparecerá en tu tablero.
          </p>
        ),
      },
    ],
    tips: [['Messenger', 'Para Facebook Messenger el paso es idéntico: cambia «Instagram DM» por «Messenger» en source.']],
  },

  // ---- Sitio web y formularios ----------------------------------------------------
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'web',
    icon: Newspaper,
    color: '#21759B',
    via: 'Nativo',
    minutes: 5,
    summary: 'Pega el formulario de FlowDesk en cualquier página de tu sitio WordPress.',
    requirements: [<>Acceso de editor o administrador a tu WordPress.</>],
    steps: [
      { title: 'Copia el código del formulario', body: embedIntro() },
      {
        title: 'Pégalo en tu página',
        body: (
          <>
            <p>
              Edita la página, pulsa <Ui>+</Ui> para agregar un bloque, busca <Ui>HTML personalizado</Ui> (Custom HTML) y pega
              el código. Pulsa <Ui>Actualizar</Ui>.
            </p>
            <p>Si usas Elementor, arrastra el widget <Ui>HTML</Ui> y pega el mismo código.</p>
          </>
        ),
      },
      { title: 'Prueba', body: <p>Abre la página publicada, envía el formulario y revisa la columna Nuevo Lead.</p> },
    ],
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'web',
    icon: PanelsTopLeft,
    color: '#FAAD4D',
    via: 'Nativo',
    minutes: 5,
    summary: 'Agrega el formulario de FlowDesk a tu sitio Wix con un elemento HTML.',
    requirements: [<>Acceso al editor de tu sitio Wix.</>],
    steps: [
      { title: 'Copia el código del formulario', body: embedIntro() },
      {
        title: 'Insértalo en Wix',
        body: (
          <p>
            En el editor pulsa <Ui>Agregar elementos</Ui> → <Ui>Insertar código</Ui> → <Ui>Insertar HTML</Ui>. En el elemento,
            elige <Ui>Código</Ui>, pega el código y pulsa <Ui>Actualizar</Ui>. Ajusta el tamaño del recuadro y publica.
          </p>
        ),
      },
      { title: 'Prueba', body: <p>Abre tu sitio publicado, envía el formulario y revisa la columna Nuevo Lead.</p> },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'web',
    icon: ShoppingBag,
    color: '#95BF47',
    via: 'Nativo',
    minutes: 5,
    summary: 'Capta cotizaciones o consultas mayoristas desde tu tienda Shopify.',
    requirements: [<>Acceso al editor de temas de tu tienda.</>],
    steps: [
      { title: 'Copia el código del formulario', body: embedIntro() },
      {
        title: 'Agrega una sección de Liquid personalizado',
        body: (
          <p>
            Ve a <Ui>Tienda online</Ui> → <Ui>Temas</Ui> → <Ui>Personalizar</Ui>. En la página donde lo quieras, pulsa{' '}
            <Ui>Agregar sección</Ui> → <Ui>Liquid personalizado</Ui>, pega el código y pulsa <Ui>Guardar</Ui>.
          </p>
        ),
      },
      { title: 'Prueba', body: <p>Abre la página en tu tienda, envía el formulario y revisa la columna Nuevo Lead.</p> },
    ],
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'web',
    icon: LayoutTemplate,
    color: '#4353FF',
    via: 'Nativo',
    minutes: 5,
    summary: 'Inserta el formulario de FlowDesk con un elemento Code Embed.',
    requirements: [<>Un sitio en Webflow. Publicar código personalizado puede requerir un plan pago de Webflow.</>],
    steps: [
      { title: 'Copia el código del formulario', body: embedIntro() },
      {
        title: 'Agrega un Code Embed',
        body: (
          <p>
            En el Designer abre el panel <Ui>Add</Ui> (+), arrastra <Ui>Code Embed</Ui> a la página, pega el código y pulsa{' '}
            <Ui>Save & Close</Ui>. Luego <Ui>Publish</Ui>.
          </p>
        ),
      },
      { title: 'Prueba', body: <p>El formulario no se ve dentro del Designer: pruébalo en el sitio publicado.</p> },
    ],
  },
  {
    id: 'typeform',
    name: 'Typeform',
    category: 'web',
    icon: ClipboardList,
    color: '#A78BFA',
    via: 'Make',
    minutes: 10,
    summary: 'Cada respuesta de tu Typeform se convierte en lead al instante.',
    source: 'Typeform',
    requirements: [<>Una cuenta de <B>Make</B> y un formulario de Typeform que pida al menos nombre o correo.</>],
    steps: [
      {
        title: 'Crea el escenario con Typeform',
        body: makeTrigger(
          'Typeform',
          'Watch Responses',
          <p>Conecta tu cuenta de Typeform y elige el formulario. Make crea el webhook en Typeform por ti.</p>,
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="Typeform"
            source="Typeform"
            fields={{ name: '{{Respuesta: nombre}}', email: '{{Respuesta: correo}}', phone: '{{Respuesta: teléfono}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="responde tu Typeform" /> },
    ],
  },
  {
    id: 'google-forms',
    name: 'Google Forms',
    category: 'web',
    icon: ClipboardList,
    color: '#7248B9',
    via: 'Make',
    minutes: 10,
    summary: 'Las respuestas de tu formulario de Google llegan al tablero cada pocos minutos.',
    source: 'Google Forms',
    requirements: [<>Una cuenta de <B>Make</B> y un formulario de Google que pida nombre y correo o teléfono.</>],
    steps: [
      {
        title: 'Vincula el formulario a una hoja de cálculo',
        body: (
          <p>
            En Google Forms abre la pestaña <Ui>Respuestas</Ui> y pulsa <Ui>Vincular con Hojas de cálculo</Ui>. Cada respuesta
            quedará como una fila nueva.
          </p>
        ),
      },
      {
        title: 'Crea el escenario con Google Sheets',
        body: makeTrigger(
          'Google Sheets',
          'Watch New Rows',
          <>
            <p>Elige la hoja de respuestas y la pestaña. En «Table contains headers» deja <Ui>Yes</Ui>.</p>
            <Note>
              Este disparador no es instantáneo: Make revisa la hoja según la programación del escenario (por ejemplo, cada 15
              minutos).
            </Note>
          </>,
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="Google Sheets"
            source="Google Forms"
            fields={{ name: '{{Columna: nombre}}', email: '{{Columna: correo}}', phone: '{{Columna: teléfono}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="responde tu formulario" /> },
    ],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'web',
    icon: CalendarCheck,
    color: '#006BFF',
    via: 'Make',
    minutes: 10,
    summary: 'Quien agenda una reunión contigo entra como lead, con la fecha en las notas.',
    source: 'Calendly',
    requirements: [
      <>Una cuenta de <B>Make</B>.</>,
      <>Un plan pago de <B>Calendly</B> (los webhooks no están en el plan gratuito).</>,
    ],
    steps: [
      {
        title: 'Crea el escenario con Calendly',
        body: makeTrigger(
          'Calendly',
          'Watch Events',
          <p>Conecta tu cuenta y elige el evento de <B>nueva reserva</B> (invitee created).</p>,
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="Calendly"
            source="Calendly"
            fields={{ name: '{{Nombre del invitado}}', email: '{{Correo del invitado}}', notes: 'Reunión agendada: {{Fecha de inicio}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="agenda una reunión de prueba en tu enlace de Calendly" /> },
    ],
  },

  // ---- Correo y planillas ----------------------------------------------------------
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'data',
    icon: Mail,
    color: '#EA4335',
    via: 'Make',
    minutes: 10,
    summary: 'Los correos con una etiqueta (por ejemplo «Leads») se convierten en leads.',
    source: 'Correo',
    requirements: [<>Una cuenta de <B>Make</B> y tu Gmail.</>],
    steps: [
      {
        title: 'Crea una etiqueta en Gmail',
        body: (
          <p>
            Crea la etiqueta <B>Leads</B> y, si quieres, un filtro de Gmail que la ponga sola (por ejemplo, a los correos que
            llegan a ventas@tuempresa.com).
          </p>
        ),
      },
      {
        title: 'Crea el escenario con Gmail',
        body: makeTrigger(
          'Gmail',
          'Watch Emails',
          <p>Conecta tu cuenta y en la carpeta o etiqueta elige <B>Leads</B>. Make revisará según la programación del escenario.</p>,
        ),
      },
      {
        title: 'Envía el lead a FlowDesk con el módulo HTTP',
        body: (
          <MakeHttp
            from="Gmail"
            source="Correo"
            fields={{ name: '{{Nombre del remitente}}', email: '{{Correo del remitente}}', notes: '{{Asunto}}: {{Texto del correo}}' }}
          />
        ),
      },
      { title: 'Prueba y activa', body: <MakeRun test="ponle la etiqueta Leads a un correo" /> },
    ],
  },
  {
    id: 'sheets',
    name: 'Excel y Google Sheets',
    category: 'data',
    icon: FileSpreadsheet,
    color: '#0F9D58',
    via: 'Nativo + Make',
    minutes: 5,
    summary: 'Importa tu planilla actual en segundos o sincroniza filas nuevas automáticamente.',
    source: 'Google Sheets',
    requirements: [<>Tu planilla con una fila de encabezados (nombre, correo, teléfono…).</>],
    steps: [
      {
        title: 'Importa lo que ya tienes',
        body: (
          <>
            <p>
              Descarga tu planilla como CSV (en Google Sheets: <Ui>Archivo</Ui> → <Ui>Descargar</Ui> →{' '}
              <Ui>Valores separados por comas</Ui>; en Excel: <Ui>Guardar como</Ui> → <Ui>CSV</Ui>).
            </p>
            <p>
              En <AppLink to="/app/contactos">Contactos</AppLink> pulsa <B>Importar</B>, sube el archivo y revisa qué columna
              corresponde a cada campo. Los contactos repetidos por correo o teléfono se omiten.
            </p>
          </>
        ),
      },
      {
        title: 'Opcional: sincroniza filas nuevas con Make',
        body: makeTrigger(
          'Google Sheets',
          'Watch New Rows',
          <>
            <p>Elige tu hoja y luego agrega el módulo HTTP como en las demás guías, con source «Google Sheets»:</p>
            <CodeBlock label="Body (JSON)" code={JSON.stringify({ name: '{{Columna: nombre}}', email: '{{Columna: correo}}', phone: '{{Columna: teléfono}}', source: 'Google Sheets' }, null, 2)} />
          </>,
        ),
      },
    ],
  },

  // ---- Avisos al equipo -------------------------------------------------------------
  {
    id: 'discord',
    name: 'Discord',
    category: 'alerts',
    icon: Gamepad2,
    color: '#5865F2',
    via: 'Make',
    minutes: 5,
    summary: 'Avisa en un canal de Discord cada vez que entra un lead por Make.',
    requirements: [...ALERT_REQUIREMENTS, <>Permiso para administrar webhooks en tu servidor de Discord.</>],
    steps: [
      {
        title: 'Crea un webhook en Discord',
        body: (
          <p>
            En tu servidor ve a <Ui>Ajustes del servidor</Ui> → <Ui>Integraciones</Ui> → <Ui>Webhooks</Ui> →{' '}
            <Ui>Nuevo webhook</Ui>. Elige el canal (por ejemplo #ventas) y pulsa <Ui>Copiar URL del webhook</Ui>.
          </p>
        ),
      },
      routerStep('Discord'),
      {
        title: 'Envía el aviso',
        body: (
          <>
            <p>
              En la segunda ruta agrega <Ui>HTTP</Ui> → <Ui>Make a request</Ui> con la URL de Discord, método <Ui>POST</Ui>,{' '}
              <Ui>application/json</Ui> y este contenido:
            </p>
            <CodeBlock label="Body (JSON)" code={JSON.stringify({ content: 'Nuevo lead: {{Nombre}} · {{Teléfono}} · {{Correo}}' }, null, 2)} />
            <p>Mapea los campos como en el módulo de FlowDesk, guarda y prueba con <Ui>Run once</Ui>.</p>
          </>
        ),
      },
    ],
    tips: [ALERT_TIP],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'alerts',
    icon: Hash,
    color: '#E01E5A',
    via: 'Make',
    minutes: 10,
    summary: 'Publica cada lead nuevo en un canal de Slack para que el equipo reaccione rápido.',
    requirements: [...ALERT_REQUIREMENTS, <>Permiso para instalar apps en tu workspace de Slack.</>],
    steps: [
      {
        title: 'Crea un Incoming Webhook en Slack',
        body: (
          <>
            <p>
              En api.slack.com/apps pulsa <Ui>Create New App</Ui> → <Ui>From scratch</Ui> y elige tu workspace. En{' '}
              <Ui>Incoming Webhooks</Ui> actívalos, pulsa <Ui>Add New Webhook to Workspace</Ui>, elige el canal y copia la URL.
            </p>
            <Ext href="https://api.slack.com/apps">Abrir Slack API</Ext>
          </>
        ),
      },
      routerStep('Slack'),
      {
        title: 'Envía el aviso',
        body: (
          <>
            <p>
              En la segunda ruta agrega <Ui>HTTP</Ui> → <Ui>Make a request</Ui> con la URL de Slack, método <Ui>POST</Ui>,{' '}
              <Ui>application/json</Ui> y este contenido:
            </p>
            <CodeBlock label="Body (JSON)" code={JSON.stringify({ text: 'Nuevo lead: {{Nombre}} · {{Teléfono}} · {{Correo}}' }, null, 2)} />
          </>
        ),
      },
    ],
    tips: [ALERT_TIP],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'alerts',
    icon: Send,
    color: '#26A5E4',
    via: 'Make',
    minutes: 10,
    summary: 'Recibe un mensaje de un bot de Telegram (a ti o a un grupo) por cada lead.',
    requirements: [...ALERT_REQUIREMENTS, <>Telegram en tu teléfono o computador.</>],
    steps: [
      {
        title: 'Crea tu bot',
        body: (
          <p>
            Abre un chat con <B>@BotFather</B>, envía <code className="text-fg">/newbot</code>, elige nombre y usuario, y copia
            el <B>token</B> que te entrega.
          </p>
        ),
      },
      {
        title: 'Averigua el Chat ID',
        body: (
          <>
            <p>
              Agrega el bot a tu grupo (o escríbele directamente) y envía cualquier mensaje. Luego abre en el navegador esta
              dirección, reemplazando TOKEN por el tuyo:
            </p>
            <CopyField label="URL" value="https://api.telegram.org/botTOKEN/getUpdates" />
            <p>
              Busca <code className="text-fg">"chat":{'{'}"id": …</code>: ese número es el Chat ID (en grupos empieza con un
              signo menos).
            </p>
          </>
        ),
      },
      routerStep('Telegram'),
      {
        title: 'Envía el aviso',
        body: (
          <p>
            En la segunda ruta agrega <Ui>Telegram Bot</Ui> → <Ui>Send a Text Message or a Reply</Ui>. Crea la conexión con el
            token, pega el Chat ID y escribe el texto mapeando los campos, por ejemplo: «Nuevo lead: Nombre · Teléfono».
          </p>
        ),
      },
    ],
    tips: [ALERT_TIP],
  },
];

export const GUIDE_BY_ID = Object.fromEntries(GUIDES.map((g) => [g.id, g])) as Record<string, Guide>;
