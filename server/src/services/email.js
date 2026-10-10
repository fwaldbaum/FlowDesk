import nodemailer from 'nodemailer';

/**
 * Transactional email, first configured option wins:
 *  - SMTP_HOST (+ SMTP_USER / SMTP_PASS): any SMTP server — Gmail, Brevo, Outlook, Zoho…
 *  - RESEND_API_KEY: Resend's HTTP API.
 *  - EMAIL_TRANSPORT=console: print emails to the server log (local development).
 * With none, email features are off: verification isn't required and password reset
 * reports that email isn't configured.
 */
const SMTP_HOST = process.env.SMTP_HOST;
const RESEND_KEY = process.env.RESEND_API_KEY;
const CONSOLE = process.env.EMAIL_TRANSPORT === 'console';
const FROM =
  process.env.EMAIL_FROM ||
  (SMTP_HOST && process.env.SMTP_USER ? `FlowDesk <${process.env.SMTP_USER}>` : 'FlowDesk <onboarding@resend.dev>');

export const emailEnabled = Boolean(SMTP_HOST) || Boolean(RESEND_KEY) || CONSOLE;

/** Which transport is active, for the admin panel (no secrets). */
export const emailProvider = CONSOLE
  ? { type: 'console', detail: 'Log del servidor' }
  : SMTP_HOST
    ? { type: 'smtp', detail: `${SMTP_HOST} · ${process.env.SMTP_USER ?? 'sin usuario'}` }
    : RESEND_KEY
      ? { type: 'resend', detail: 'Resend' }
      : null;

// Google shows app passwords as "abcd efgh ijkl mnop"; the spaces aren't part of it.
const smtpPass = () =>
  /gmail\.com$/i.test(SMTP_HOST ?? '') ? process.env.SMTP_PASS?.replace(/\s+/g, '') : process.env.SMTP_PASS;

let smtp = null;
function smtpTransport() {
  if (!smtp) {
    const port = Number(process.env.SMTP_PORT) || 587;
    smtp = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      // 465 is implicit TLS; other ports upgrade with STARTTLS.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER.trim(), pass: smtpPass() } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    });
  }
  return smtp;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function sendEmail({ to, subject, html, text }) {
  if (SMTP_HOST && !CONSOLE) {
    try {
      await smtpTransport().sendMail({ from: FROM, to, subject, html, text });
    } catch (err) {
      throw Object.assign(new Error(`SMTP: ${err.message}`), { code: 'EMAIL_SEND_FAILED' });
    }
    return;
  }
  if (CONSOLE || !RESEND_KEY) {
    console.log(`[email] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`Resend ${res.status}: ${body.slice(0, 300)}`), { code: 'EMAIL_SEND_FAILED' });
  }
}

const FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/**
 * Email layout mirroring the app's auth screens: logo header, card with an indigo top
 * bar, round status icon, pill, full-width button and a code-style fallback link.
 * Tables + inline styles only (Gmail/Outlook); icons are PNGs served from the app.
 */
function layout({ preheader, icon, heading, body, pill, cta, link, footnote }) {
  const base = new URL(link).origin;
  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#0B0F17;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0B0F17">${preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0B0F17" style="background:#0B0F17">
<tr><td align="center" style="padding:40px 16px 48px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:460px">

    <!-- Logo -->
    <tr><td align="center" style="padding:0 0 28px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;padding-right:10px"><img src="${base}/email/logo.png" width="28" height="28" alt="" style="display:block;border:0"></td>
        <td style="vertical-align:middle;font-family:${FONT};font-size:18px;letter-spacing:-0.2px;color:#F3F4F6"><b>Flow</b>Desk</td>
      </tr></table>
    </td></tr>

    <!-- Card -->
    <tr><td bgcolor="#161B26" style="background:#161B26;border:1px solid #262D3D;border-radius:16px;overflow:hidden">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="3" bgcolor="#4F46E5" style="height:3px;line-height:3px;font-size:0;background:#4F46E5;background-image:linear-gradient(90deg,#3B82F6,#6366F1);border-radius:16px 16px 0 0">&nbsp;</td></tr>
        <tr><td align="center" style="padding:36px 32px 0">
          <img src="${base}/email/${icon}.png" width="56" height="56" alt="" style="display:block;border:0">
        </td></tr>
        <tr><td align="center" style="padding:20px 32px 0;font-family:${FONT}">
          <h1 style="margin:0;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-0.3px;color:#F3F4F6">${heading}</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:22px;color:#9AA3B2">${body}</p>
        </td></tr>
        ${pill ? `<tr><td align="center" style="padding:16px 32px 0">
          <span style="display:inline-block;padding:4px 12px;border:1px solid #343C50;border-radius:999px;background:#1C2230;font-family:${FONT};font-size:12px;line-height:18px;color:#9AA3B2">${pill}</span>
        </td></tr>` : ''}
        <tr><td style="padding:28px 32px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" bgcolor="#4F46E5" style="border-radius:10px;background:#4F46E5">
              <a href="${link}" target="_blank" style="display:block;padding:13px 20px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:#FFFFFF;text-decoration:none;border-radius:10px">${cta}</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 32px 0"><div style="height:1px;line-height:1px;font-size:0;background:#262D3D">&nbsp;</div></td></tr>
        <tr><td style="padding:20px 32px 0;font-family:${FONT}">
          <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#687185">¿El botón no funciona? Copia este enlace en tu navegador:</p>
          <div style="padding:10px 12px;border:1px solid #262D3D;border-radius:8px;background:#0B0F17;font-family:${MONO};font-size:12px;line-height:18px;word-break:break-all">
            <a href="${link}" target="_blank" style="color:#818CF8;text-decoration:none">${link}</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px 32px;font-family:${FONT}">
          <p style="margin:0;font-size:12px;line-height:18px;color:#687185">${footnote}</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:24px 16px 0;font-family:${FONT}">
      <p style="margin:0;font-size:12px;line-height:18px;color:#687185"><b style="color:#9AA3B2">Flow</b><span style="color:#9AA3B2">Desk</span> · CRM para emprendedores y pequeñas empresas</p>
      <p style="margin:6px 0 0;font-size:11px;line-height:16px;color:#4B5263">Este es un correo automático, no hace falta responderlo.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;
}

export function verifyEmailMessage({ name, link }) {
  const first = escapeHtml(name.split(' ')[0]);
  return {
    subject: 'Confirma tu correo en FlowDesk',
    html: layout({
      preheader: 'Un último paso para activar tu cuenta de FlowDesk.',
      icon: 'icon-mail',
      heading: `Hola ${first}, confirma tu correo`,
      body: 'Para proteger tu cuenta necesitamos confirmar que este correo es tuyo. Es un solo clic.',
      pill: 'Válido por 24 horas',
      cta: 'Confirmar mi correo',
      link,
      footnote: 'Si no creaste una cuenta en FlowDesk, puedes ignorar este mensaje.',
    }),
    text: `Hola ${name.split(' ')[0]}, confirma tu correo en FlowDesk (válido por 24 horas):\n${link}\n\nSi no creaste una cuenta, ignora este mensaje.`,
  };
}

export function testEmailMessage({ name, link }) {
  const first = escapeHtml(name.split(' ')[0]);
  return {
    subject: 'Correo de prueba de FlowDesk',
    html: layout({
      preheader: 'La configuración de correo de FlowDesk funciona.',
      icon: 'icon-check',
      heading: `Hola ${first}, el correo funciona`,
      body: 'FlowDesk ya puede enviar los correos de verificación y de recuperación de contraseña.',
      pill: null,
      cta: 'Abrir FlowDesk',
      link,
      footnote: 'Enviado desde el panel de administración.',
    }),
    text: `Hola ${name.split(' ')[0]}, el correo de FlowDesk funciona. ${link}`,
  };
}

export function resetPasswordMessage({ name, link }) {
  const first = escapeHtml(name.split(' ')[0]);
  return {
    subject: 'Restablece tu contraseña de FlowDesk',
    html: layout({
      preheader: 'Elige una nueva contraseña para tu cuenta de FlowDesk.',
      icon: 'icon-key',
      heading: `Hola ${first}, restablece tu contraseña`,
      body: 'Recibimos una solicitud para cambiar la contraseña de tu cuenta. Por seguridad, al cambiarla cerraremos tus otras sesiones.',
      pill: 'Válido por 1 hora · un solo uso',
      cta: 'Elegir nueva contraseña',
      link,
      footnote: 'Si no lo pediste tú, ignora este mensaje: tu contraseña actual sigue funcionando.',
    }),
    text: `Hola ${name.split(' ')[0]}, restablece tu contraseña de FlowDesk (válido por 1 hora, un solo uso):\n${link}\n\nSi no lo pediste, ignora este mensaje.`,
  };
}
