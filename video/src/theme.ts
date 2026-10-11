import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Bundled locally (public/fonts) so renders never depend on network access.
export const fontFamily = 'Inter';
loadFont({ family: fontFamily, url: staticFile('fonts/Inter-Variable.woff2'), weight: '100 900' });

/** Same tokens as client/tailwind.config.js so the video matches the app. */
export const colors = {
  canvas: '#0B0F17',
  surface: '#161B26',
  raised: '#1C2230',
  line: '#262D3D',
  lineStrong: '#343C50',
  fg: '#F3F4F6',
  muted: '#9AA3B2',
  subtle: '#687185',
  accent: '#4F46E5',
  accentSoft: '#818CF8',
};

export const stages = [
  { id: 'new', label: 'Nuevo Lead', color: '#3B82F6' },
  { id: 'contacted', label: 'En Contacto', color: '#8B5CF6' },
  { id: 'proposal', label: 'Propuesta Enviada', color: '#F59E0B' },
  { id: 'won', label: 'Ganado', color: '#10B981' },
] as const;
