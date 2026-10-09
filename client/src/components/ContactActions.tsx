import clsx from 'clsx';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { fillTemplate, whatsappNumber } from '../lib/contact';
import type { ContactChannel, Lead } from '../lib/types';
import { useStore } from '../store/AppStore';

type ContactLead = Pick<Lead, 'id' | 'name' | 'phone' | 'email' | 'company'>;

/**
 * WhatsApp / call / email shortcuts. Each opens the native app and records the contact
 * on the lead (last contact date + a history entry).
 */
export function ContactActions({ lead, compact = false, className }: {
  lead: ContactLead;
  compact?: boolean;
  className?: string;
}) {
  const { workspace, dispatch } = useStore();
  const { user } = useAuth();
  const wa = whatsappNumber(lead.phone, workspace?.country_code ?? '56');
  const text = fillTemplate(workspace?.whatsapp_template ?? 'Hola {nombre}', {
    nombre: lead.name.split(' ')[0] ?? lead.name,
    empresa: workspace?.name ?? '',
    vendedor: user?.name.split(' ')[0] ?? '',
    empresa_cliente: lead.company ?? '',
  });

  const log = (channel: ContactChannel) => {
    api
      .logContact(lead.id, channel)
      .then((updated) => dispatch({ type: 'lead/upsert', lead: updated }))
      .catch(() => {});
  };

  const actions = [
    {
      channel: 'whatsapp' as const,
      label: 'WhatsApp',
      icon: MessageCircle,
      href: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null,
      external: true,
      tone: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300',
    },
    {
      channel: 'call' as const,
      label: 'Llamar',
      icon: Phone,
      href: lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, '')}` : null,
      external: false,
      tone: 'hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-300',
    },
    {
      channel: 'email' as const,
      label: 'Correo',
      icon: Mail,
      href: lead.email ? `mailto:${lead.email}` : null,
      external: false,
      tone: 'hover:border-accent/50 hover:bg-accent/10 hover:text-accent-soft',
    },
  ];

  return (
    <div className={clsx('flex gap-1.5', className)}>
      {actions.map(({ channel, label, icon: Icon, href, external, tone }) =>
        href ? (
          <a
            key={channel}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              log(channel);
            }}
            title={`${label} · ${channel === 'email' ? lead.email : lead.phone}`}
            aria-label={`${label} a ${lead.name}`}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-canvas font-medium text-muted transition-all active:scale-95',
              compact ? 'h-7 w-7' : 'h-8 flex-1 px-2.5 text-xs',
              tone,
            )}
          >
            <Icon size={compact ? 13 : 14} />
            {!compact && label}
          </a>
        ) : compact ? null : (
          <span
            key={channel}
            title={channel === 'email' ? 'Sin correo registrado' : 'Sin teléfono registrado'}
            className="inline-flex h-8 flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-dashed border-line px-2.5 text-xs text-subtle/70"
          >
            <Icon size={14} />
            {label}
          </span>
        ),
      )}
    </div>
  );
}
