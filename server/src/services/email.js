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

/** Minimal, client-safe HTML layout (tables + inline styles) in the FlowDesk palette. */
function layout({ heading, body, cta, link, footnote }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#0B0F17;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F17;padding:40px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#161B26;border:1px solid #262D3D;border-radius:12px">
<tr><td style="padding:32px 32px 8px">
<div style="font-size:17px;color:#F3F4F6;letter-spacing:-0.01em"><b>Flow</b>Desk</div>
</td></tr>
<tr><td style="padding:16px 32px 0">
<h1 style="margin:0 0 12px;font-size:20px;line-height:28px;color:#F3F4F6;font-weight:600">${heading}</h1>
<p style="margin:0;font-size:14px;line-height:22px;color:#9AA3B2">${body}</p>
</td></tr>
<tr><td style="padding:24px 32px">
<a href="${link}" style="display:inline-block;background:#4F46E5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px">${cta}</a>
</td></tr>
<tr><td style="padding:0 32px 32px">
<p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#687185">Si el botón no funciona, copia este enlace en tu navegador:</p>
<p style="margin:0 0 16px;font-size:12px;line-height:18px;color:#818CF8;word-break:break-all">${link}</p>
<p style="margin:0;font-size:12px;line-height:18px;color:#687185">${footnote}</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

export function verifyEmailMessage({ name, link }) {
  const first = escapeHtml(name.split(' ')[0]);
  return {
    subject: 'Confirma tu correo en FlowDesk',
    html: layout({
      heading: `Hola ${first}, confirma tu correo`,
      body: 'Para proteger tu cuenta necesitamos confirmar que este correo es tuyo. El enlace es válido por 24 horas.',
      cta: 'Confirmar correo',
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
      heading: `Hola ${first}, el correo funciona`,
      body: 'Si estás leyendo esto, FlowDesk ya puede enviar los correos de verificación y de recuperación de contraseña.',
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
      heading: `Hola ${first}, restablece tu contraseña`,
      body: 'Recibimos una solicitud para cambiar la contraseña de tu cuenta. El enlace es válido por 1 hora y solo se puede usar una vez.',
      cta: 'Elegir nueva contraseña',
      link,
      footnote: 'Si no lo pediste tú, ignora este mensaje: tu contraseña actual sigue funcionando.',
    }),
    text: `Hola ${name.split(' ')[0]}, restablece tu contraseña de FlowDesk (válido por 1 hora, un solo uso):\n${link}\n\nSi no lo pediste, ignora este mensaje.`,
  };
}
