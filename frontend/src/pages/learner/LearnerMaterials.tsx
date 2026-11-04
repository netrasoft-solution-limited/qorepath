import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, FileText, Link as LinkIcon, Video, ExternalLink, Search } from 'lucide-react';
import api from '../../lib/api';
import { pickCurrentEnrollment } from '../../lib/enrollments';

const TYPE_ICONS: Record<string, any> = { pdf: FileText, link: LinkIcon, video: Video, doc: FileText };
const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-50 text-red-500',
  link: 'bg-blue-50 text-blue-500',
  video: 'bg-purple-50 text-purple-500',
  doc: 'bg-orange-50 text-orange-500',
};
const TYPE_LABEL: Record<string, string> = { pdf: 'PDF', link: 'Link', video: 'Video', doc: 'Document' };

/** Only open plain web links, whatever was saved. */
const safeUrl = (url: string) => (/^https?:\/\//i.test(url ?? '') ? url : null);

export function LearnerMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [trackName, setTrackName] = useState('');
  const [hasEnrollment, setHasEnrollment] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: enrollments } = await api.get('/enrollments/my');
        const current = pickCurrentEnrollment(enrollments);
        if (current?.status !== 'approved' || !current.program?.id) {
          setHasEnrollment(false);
          return;
        }
        setTrackName(`${current.program.track}${current.program.cohort?.name ? ` · ${current.program.cohort.name}` : ''}`);
        const { data } = await api.get(`/materials/program/${current.program.id}`);
        setMaterials(data);
      } catch {
        setError('Could not load your materials. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const weeks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const shown = q ? materials.filter((m) => m.title?.toLowerCase().includes(q)) : materials;
    const byWeek = new Map<number, any[]>();
    for (const m of shown) byWeek.set(m.week, [...(byWeek.get(m.week) ?? []), m]);
    return [...byWeek.entries()].sort(([a], [b]) => a - b);
  }, [materials, search]);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading materials…</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-qore-text">Materials</h1>
          <p className="text-gray-500">
            {hasEnrollment ? <>Slides, readings and links from your instructors{trackName ? ` · ${trackName}` : ''}.</> : 'Learning resources for your track.'}
          </p>
        </div>
        {materials.length > 0 && (
          <label className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium" />
          </label>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!hasEnrollment ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          Materials appear here once you're enrolled in a track.
        </div>
      ) : materials.length === 0 && !error ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          Your instructors haven't shared any materials yet. Check back after your first session.
        </div>
      ) : weeks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          No materials match "{search}".
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map(([week, items], i) => (
            <motion.section key={week} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-50">
                <Folder className="text-qore-medium" size={20} />
                <h2 className="font-bold text-qore-text">Week {week}</h2>
                <span className="px-2 py-0.5 bg-qore-light text-qore-medium text-xs rounded-full font-semibold">{items.length}</span>
              </div>
              <div className="p-4 space-y-2">
                {items.map((m) => {
                  const Icon = TYPE_ICONS[m.type] ?? LinkIcon;
                  const url = safeUrl(m.url);
                  return (
                    <a key={m.id} href={url ?? undefined} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-xl transition-colors ${url ? 'hover:border-qore-highlight hover:bg-qore-light/30' : 'opacity-60 pointer-events-none'}`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[m.type] ?? 'bg-gray-50 text-gray-500'}`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-sm text-qore-text truncate">{m.title}</span>
                          <span className="block text-xs text-gray-400">
                            {TYPE_LABEL[m.type] ?? 'Link'}
                            {m.uploadedBy?.firstName ? ` · shared by ${m.uploadedBy.firstName}` : ''}
                            {m.createdAt ? ` · ${new Date(m.createdAt).toLocaleDateString()}` : ''}
                          </span>
                        </span>
                      </span>
                      <ExternalLink size={16} className="text-gray-400 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
