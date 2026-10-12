<?php
declare(strict_types=1);

/** Sends a multipart (text + HTML) email with the hosting's mail(), or logs it when transport is 'log'. */
function send_mail(string $to, string $subject, string $html, string $text): bool
{
    $mail = config('mail', []);
    $from = $mail['from'] ?? 'ZERO Solutions <noreply@zerosolutions.cl>';

    if (($mail['transport'] ?? 'mail') === 'log') {
        $entry = sprintf("[%s] to=%s subject=\"%s\"\n%s\n\n", gmdate('c'), $to, $subject, $text);
        file_put_contents(APP_DIR . '/storage/mail.log', $entry, FILE_APPEND | LOCK_EX);
        return true;
    }

    $boundary = 'zero_' . bin2hex(random_bytes(12));
    $headers = [
        'From: ' . $from,
        'Reply-To: ' . config('contact_email', 'hola@zerosolutions.cl'),
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    $body = "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text))
        . "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--{$boundary}--";

    // The envelope sender must be the hosting mailbox, or many providers mark it as spam.
    preg_match('/<([^>]+)>/', $from, $m);
    $envelope = $m[1] ?? $from;
    $ok = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . $envelope);
    if (!$ok) {
        error_log("[zero] mail() failed for {$to}");
    }
    return $ok;
}

/** Light email layout in the site's white and blue, tables and inline styles only. */
function email_layout(string $preheader, string $heading, string $body, string $cta, string $link, string $footnote): string
{
    $font = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    $h = e($heading);
    $l = e($link);
    $logo = e(url('/assets/img/zero-logo-email.png'));
    return <<<HTML
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{$h}</title></head>
<body style="margin:0;padding:0;background:#F4F7FC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{$preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F7FC">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px">
    <tr><td style="padding:0 0 24px"><img src="{$logo}" width="160" height="48" alt="ZERO" style="display:block;border:0"></td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid #E3E9F3;border-radius:16px;padding:36px 32px;font-family:{$font}">
      <h1 style="margin:0;font-size:22px;line-height:30px;font-weight:700;color:#0B1B3F">{$h}</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:24px;color:#4A5875">{$body}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0"><tr>
        <td bgcolor="#2563EB" style="border-radius:10px"><a href="{$l}" target="_blank" style="display:inline-block;padding:13px 22px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none">{$cta}</a></td>
      </tr></table>
      <p style="margin:28px 0 0;font-size:12px;line-height:18px;color:#7A869E">Si el botón no funciona, copia este enlace:<br><a href="{$l}" style="color:#2563EB;word-break:break-all">{$l}</a></p>
      <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#7A869E">{$footnote}</p>
    </td></tr>
    <tr><td style="padding:20px 4px 0;font-family:{$font};font-size:12px;color:#7A869E">ZERO Solutions · zerosolutions.cl</td></tr>
  </table>
</td></tr>
</table>
</body></html>
HTML;
}

function verify_email_message(string $name, string $link): array
{
    $first = e(first_name($name));
    return [
        'subject' => 'Confirma tu correo en ZERO',
        'html' => email_layout(
            'Un clic para activar tu cuenta ZERO.',
            "Hola {$first}, confirma tu correo",
            'Confirma que este correo es tuyo para activar tu cuenta ZERO y abrir tus aplicaciones.',
            'Confirmar mi correo',
            $link,
            'El enlace vale 24 horas. Si no creaste esta cuenta, ignora este mensaje.',
        ),
        'text' => "Hola " . first_name($name) . ", confirma tu correo en ZERO (válido por 24 horas):\n{$link}\n\nSi no creaste esta cuenta, ignora este mensaje.",
    ];
}

function reset_password_message(string $name, string $link): array
{
    $first = e(first_name($name));
    return [
        'subject' => 'Restablece tu contraseña de ZERO',
        'html' => email_layout(
            'Elige una nueva contraseña para tu cuenta ZERO.',
            "Hola {$first}, restablece tu contraseña",
            'Recibimos una solicitud para cambiar la contraseña de tu cuenta ZERO. Al cambiarla cerraremos tus otras sesiones.',
            'Elegir nueva contraseña',
            $link,
            'El enlace vale 1 hora y sirve una sola vez. Si no lo pediste, ignora este mensaje.',
        ),
        'text' => "Hola " . first_name($name) . ", restablece tu contraseña de ZERO (válido por 1 hora):\n{$link}\n\nSi no lo pediste, ignora este mensaje.",
    ];
}
