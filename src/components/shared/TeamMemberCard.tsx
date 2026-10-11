import { motion } from 'motion/react';
import { Github, Linkedin, Instagram } from 'lucide-react';
import type { PublicTeamMember } from '@/api/services/team';

export function TeamMemberCard({ member, delay = 0 }: { member: PublicTeamMember; delay?: number }) {
  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="w-full max-w-[380px] flex flex-col bg-surface border border-default rounded-xl overflow-hidden shadow-sm group"
      >
        {/* Photo Side */}
        <div className="w-full aspect-square relative overflow-hidden bg-page flex items-center justify-center">
          {member.avatar_url ? (
            <img
    src={member.avatar_url}
    alt={`${member.first_name} ${member.last_name}`}
    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="text-4xl font-bold text-muted opacity-50">
    {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
            </div>
          )}
        </div>

        {/* Content Side */}
        <div className="w-full p-6 flex flex-col bg-surface flex-1">
          <h3 className="text-xl font-bold mb-1 font-mono tracking-tight text-primary">{member.first_name} {member.last_name}</h3>
          <p className="text-sm font-mono font-bold text-[var(--brand-primary)] mb-5">{member.position || 'Üye'}</p>

          <div className="h-px w-full bg-[var(--border-default)] mb-5 mt-auto" />

          <div className="flex items-center gap-5">
            {member.linkedin_url && member.linkedin_url.trim() !== '' && (
    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[var(--brand-primary)] icon-interactive">
      <Linkedin className="w-5 h-5" />
    </a>
            )}
            {member.instagram_url && member.instagram_url.trim() !== '' && (
    <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[var(--brand-primary)] icon-interactive">
      <Instagram className="w-5 h-5" />
    </a>
            )}
            {member.github_url && member.github_url.trim() !== '' && (
    <a href={member.github_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-[var(--brand-primary)] icon-interactive">
      <Github className="w-5 h-5" />
    </a>
            )}
          </div>
        </div>
      </motion.div>
  );
}
