import { Facebook, Instagram, Linkedin, Music2, Twitter, Youtube } from 'lucide-react';
import type { SiteInfo } from '../lib/siteInfo';

const ICONS = { instagram: Instagram, x: Twitter, linkedin: Linkedin, facebook: Facebook, youtube: Youtube, tiktok: Music2 };
const NAMES = { instagram: 'Instagram', x: 'X', linkedin: 'LinkedIn', facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok' };

export function SocialLinks({ socials, className = '' }: { socials?: SiteInfo['socials']; className?: string }) {
  const entries = (Object.keys(ICONS) as (keyof typeof ICONS)[]).filter((k) => socials?.[k]);
  if (!entries.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {entries.map((k) => {
        const Icon = ICONS[k];
        return (
          <a key={k} href={socials![k]} target="_blank" rel="noopener noreferrer" aria-label={NAMES[k]} title={NAMES[k]}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white">
            <Icon size={16} />
          </a>
        );
      })}
    </div>
  );
}
