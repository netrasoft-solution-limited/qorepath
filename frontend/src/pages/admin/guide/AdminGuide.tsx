import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Lightbulb, Search, TriangleAlert, X, Zap, Link as LinkIcon } from 'lucide-react';
import { GUIDE, type GuideSection, type Scenario, type Step } from './content';

// Matches a scenario or menu entry against the search box.
const textOf = (s: Scenario) =>
  [s.title, s.who, s.when, ...s.steps.map((x) => (typeof x === 'string' ? x : x.text)), ...(s.auto ?? []), ...(s.tips ?? [])].join(' ').toLowerCase();

function StepText({ step }: { step: Step }) {
  if (typeof step === 'string') return <>{step}</>;
  return (
    <>
      {step.text}{' '}
      {step.link && (
        <Link to={step.link.to} className="whitespace-nowrap font-semibold text-qore-medium hover:underline">
          {step.link.label} →
        </Link>
      )}
    </>
  );
}

type Shots = NonNullable<Scenario['shots']>;
const shotUrl = (file: string) => `/guide/${file}.webp`;

/** Full-size screenshot viewer: click outside or press Esc to close, arrows to move. */
function Lightbox({ shots, index, onClose, onMove }: { shots: Shots; index: number; onClose: () => void; onMove: (i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove((index + 1) % shots.length);
      if (e.key === 'ArrowLeft') onMove((index - 1 + shots.length) % shots.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, shots.length]);
  const [file, caption] = shots[index];
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close"><X size={20} /></button>
      <img src={shotUrl(file)} alt={caption} className="max-h-[82vh] max-w-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
      <div className="mt-4 flex items-center gap-4 text-sm text-white" onClick={(e) => e.stopPropagation()}>
        {shots.length > 1 && <button onClick={() => onMove((index - 1 + shots.length) % shots.length)} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Previous"><ChevronLeft size={18} /></button>}
        <span>{caption}{shots.length > 1 ? ` · ${index + 1} of ${shots.length}` : ''}</span>
        {shots.length > 1 && <button onClick={() => onMove((index + 1) % shots.length)} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Next"><ChevronRight size={18} /></button>}
      </div>
    </div>
  );
}

function ShotStrip({ shots }: { shots: Shots }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className={`grid gap-3 ${shots.length === 1 ? 'grid-cols-1 sm:max-w-xl' : shots.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {shots.map(([file, caption], i) => (
          <button key={file + i} onClick={() => setOpen(i)} className="group text-left">
            <img src={shotUrl(file)} alt={caption} loading="lazy" className="aspect-[16/10] w-full rounded-xl border border-gray-200 object-cover object-top shadow-sm transition group-hover:shadow-md group-hover:ring-2 group-hover:ring-qore-highlight" />
            <span className="mt-1.5 block text-xs text-gray-500">{caption}</span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox shots={shots} index={open} onClose={() => setOpen(null)} onMove={setOpen} />}
    </>
  );
}

function ScenarioCard({ s, open, onToggle }: { s: Scenario; open: boolean; onToggle: () => void }) {
  const copyLink = () => navigator.clipboard?.writeText(`${window.location.origin}/admin/guide#${s.id}`);
  return (
    <div id={s.id} className={`scroll-mt-24 rounded-2xl border bg-white transition-shadow ${open ? 'border-qore-highlight shadow-md' : 'border-gray-100 shadow-sm'}`}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-qore-text">{s.title}</span>
          <span className="mt-1 block text-xs text-gray-400">{s.who} · {s.when}</span>
        </span>
        <ChevronDown size={18} className={`mt-0.5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-4 text-sm text-gray-700">
          {s.shots?.length ? <ShotStrip shots={s.shots} /> : null}
          <ol className="space-y-2.5">
            {s.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-qore-light text-xs font-bold text-qore-medium">{i + 1}</span>
                <span className="pt-0.5 leading-relaxed"><StepText step={step} /></span>
              </li>
            ))}
          </ol>
          {s.auto?.length ? (
            <div className="rounded-xl bg-blue-50/70 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-qore-medium"><Zap size={13} /> Happens automatically</p>
              <ul className="list-disc space-y-1 pl-5">{s.auto.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          ) : null}
          {s.tips?.length ? (
            <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700"><TriangleAlert size={13} /> Watch out</p>
              <ul className="list-disc space-y-1 pl-5">{s.tips.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          ) : null}
          <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-qore-medium">
            <LinkIcon size={12} /> Copy link to this scenario
          </button>
        </div>
      )}
    </div>
  );
}

function SectionView({ section, query, openId, setOpenId }: { section: GuideSection; query: string; openId: string | null; setOpenId: (id: string | null) => void }) {
  const scenarios = query ? section.scenarios.filter((s) => textOf(s).includes(query)) : section.scenarios;
  const menu = query ? section.menu.filter((m) => `${m.name} ${m.desc}`.toLowerCase().includes(query)) : section.menu;
  if (query && !scenarios.length && !menu.length) return null;
  const Icon = section.icon;
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-qore-dark text-white"><Icon size={20} /></span>
        <div>
          <h2 className="text-xl font-bold text-qore-text">{section.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">{section.intro}</p>
        </div>
      </div>

      {menu.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">{section.menuTitle ?? 'What each menu item is for'}</p>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            {menu.map((m) => (
              <div key={m.name}>
                <dt className="text-sm font-semibold text-qore-text">
                  {m.path ? <Link to={m.path} className="hover:text-qore-medium hover:underline">{m.name}</Link> : m.name}
                </dt>
                <dd className="text-sm text-gray-500">{m.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {scenarios.length > 0 && (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400"><Lightbulb size={13} /> Scenarios</p>
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} s={s} open={openId === s.id || (!!query && scenarios.length <= 3)} onToggle={() => setOpenId(openId === s.id ? null : s.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminGuide() {
  const location = useLocation();
  const [tab, setTab] = useState(GUIDE[0].id);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const query = search.trim().toLowerCase();

  // Deep links (/admin/guide#scenario-id) open the right tab and scenario.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    const section = GUIDE.find((g) => g.scenarios.some((s) => s.id === id));
    if (!section) return;
    setTab(section.id);
    setOpenId(id);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [location.hash]);

  const total = useMemo(() => GUIDE.reduce((n, g) => n + g.scenarios.length, 0), []);
  const visible = query ? GUIDE : GUIDE.filter((g) => g.id === tab);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Platform Guide</h1>
        <p className="text-gray-500">How every portal works, told as real situations. {total} scenarios across the admin, teaching and learner portals and the public site. Screenshots use made-up demo people.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the guide — e.g. refund, certificate, instalment, recording…"
          className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
      </div>

      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GUIDE.map((g) => (
            <button
              key={g.id}
              onClick={() => { setTab(g.id); setOpenId(null); }}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === g.id ? 'bg-qore-dark text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      <motion.div key={query ? 'search' : tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
        {visible.map((g) => <SectionView key={g.id} section={g} query={query} openId={openId} setOpenId={setOpenId} />)}
        {query && !GUIDE.some((g) => g.scenarios.some((s) => textOf(s).includes(query)) || g.menu.some((m) => `${m.name} ${m.desc}`.toLowerCase().includes(query))) && (
          <p className="py-12 text-center text-gray-400">Nothing matches “{search}”. Try a shorter word.</p>
        )}
      </motion.div>
    </div>
  );
}
