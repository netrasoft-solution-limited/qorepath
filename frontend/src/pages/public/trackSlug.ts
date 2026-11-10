// Track name → URL slug used by /public/tracks/:slug.
const TRACK_SLUGS: Record<string, string> = {
  'Frontend Engineering':   'frontend',
  'Backend Engineering':    'backend',
  'Product Design (UI/UX)': 'product-design',
  'Product Design':         'product-design',
  'Data Analysis':          'data-analysis',
  'Cloud Engineering':      'cloud',
  'Cybersecurity':          'cybersecurity',
  'Quality Assurance (QA)': 'qa',
  'Quality Assurance':      'qa',
};

export function toSlug(track: string) {
  return TRACK_SLUGS[track] ?? track.toLowerCase().replace(/\s+/g, '-');
}
