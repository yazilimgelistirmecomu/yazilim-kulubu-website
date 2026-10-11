import { motion } from 'motion/react';
import type { KeyboardEvent } from 'react';
import type { PublicTeamMember } from '@/api/services/team';
import { memberFullName } from '@/utils/teamHierarchy';

interface CardProps {
  member: PublicTeamMember;
  onSelect: (member: PublicTeamMember) => void;
  delay?: number;
}

function activationProps(member: PublicTeamMember, onSelect: (m: PublicTeamMember) => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-haspopup': 'dialog' as const,
    'aria-label': `${memberFullName(member)} - iletişim bilgilerini göster`,
    onClick: () => onSelect(member),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(member);
      }
    },
  };
}

function Photo({ member, aspect }: { member: PublicTeamMember; aspect: string }) {
  return (
    <div className={`w-full ${aspect} relative overflow-hidden bg-page flex items-center justify-center`}>
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={memberFullName(member)}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="text-4xl font-bold text-muted opacity-50">
          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
        </div>
      )}
    </div>
  );
}

/**
 * Büyük kart. `tree` ağaçtaki (organizasyon şeması) daha dar/alçak sürümdür,
 * varsayılan sürüm ana sayfa önizlemesinde kullanılır.
 */
export function TeamMemberCard({ member, onSelect, delay = 0, variant = 'default' }: CardProps & { variant?: 'default' | 'tree' }) {
  const isTree = variant === 'tree';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      {...activationProps(member, onSelect)}
      className={`w-full ${isTree ? 'max-w-[300px] md:w-64' : 'max-w-[380px]'} flex flex-col bg-surface border border-default rounded-xl overflow-hidden shadow-sm group cursor-pointer transition-[border-color,box-shadow,transform] duration-200 hover:border-[var(--brand-primary)] hover:shadow-md hover:-translate-y-0.5 focus-ring`}
    >
      <Photo member={member} aspect={isTree ? 'aspect-[4/3]' : 'aspect-square'} />
      <div className={`w-full ${isTree ? 'p-4' : 'p-6'} flex flex-col bg-surface flex-1`}>
        <h3 className={`${isTree ? 'text-lg' : 'text-xl'} font-bold mb-1 font-mono tracking-tight text-primary`}>{memberFullName(member)}</h3>
        <p className="text-sm font-mono font-bold text-[var(--brand-primary)]">{member.position || 'Üye'}</p>
      </div>
    </motion.div>
  );
}

/** Kol/ekip bölümlerindeki yatay, kompakt kart. */
export function TeamMemberCompactCard({ member, onSelect, delay = 0 }: CardProps) {
  const name = memberFullName(member);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      {...activationProps(member, onSelect)}
      className="w-full flex items-center gap-4 p-4 bg-surface border border-default rounded-xl shadow-sm group cursor-pointer transition-[border-color,box-shadow,transform] duration-200 hover:border-[var(--brand-primary)] hover:shadow-md hover:-translate-y-0.5 focus-ring"
    >
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={name} className="w-14 h-14 rounded-full object-cover border border-default shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-black flex items-center justify-center border border-default shrink-0">
          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="font-bold font-mono tracking-tight text-primary truncate">{name}</h3>
        <p className="text-sm font-mono font-bold text-[var(--brand-primary)] truncate">{member.position || 'Üye'}</p>
      </div>
    </motion.div>
  );
}
