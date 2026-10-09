/**
 * Digits for https://wa.me/<number>. Numbers written with "+" or "00" are already
 * international; national numbers get the workspace's country code (and lose a trunk 0).
 */
export function whatsappNumber(phone: string | null | undefined, countryCode: string): string | null {
  if (!phone) return null;
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return null;
  if (raw.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 8) return digits;
  digits = digits.replace(/^0+/, '');
  return `${countryCode}${digits}`;
}

/** Replaces {nombre}, {empresa}, {vendedor} and {empresa_cliente} in a message template. */
export function fillTemplate(
  template: string,
  vars: { nombre: string; empresa: string; vendedor: string; empresa_cliente: string },
) {
  return template.replace(/\{(nombre|empresa|vendedor|empresa_cliente)\}/g, (_, key: keyof typeof vars) => vars[key]);
}

export const TEMPLATE_VARIABLES = [
  { key: '{nombre}', label: 'Nombre del lead' },
  { key: '{empresa_cliente}', label: 'Empresa del lead' },
  { key: '{vendedor}', label: 'Tu nombre' },
  { key: '{empresa}', label: 'Tu empresa' },
];
