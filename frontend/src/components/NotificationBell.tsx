import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bell, BellOff, CalendarClock, CheckCircle2, Info } from 'lucide-react';
import api from '../lib/api';

interface Item {
  id: string;
  kind: 'action' | 'info' | 'success' | 'reminder';
  title: string;
  detail: string;
  link: string;
  at: string;
  unread?: boolean;
}

const POLL_MS = 60 * 1000;

const KIND = {
  action: { icon: AlertCircle, tone: 'bg-orange-50 text-[#FF6A00]' },
  info: { icon: Info, tone: 'bg-qore-light text-qore-medium' },
  success: { icon: CheckCircle2, tone: 'bg-green-50 text-green-600' },
  reminder: { icon: CalendarClock, tone: 'bg-sky-50 text-sky-600' },
} as const;

function timeAgo(at: string) {
  const s = Math.max(0, (Date.now() - +new Date(at)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Portal bell: live, role-aware feed from GET /notifications. Opening it marks everything seen. */
export function NotificationBell({ align = 'right' }: { align?: 'right' | 'left' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.get('/notifications')
      .then(({ data }) => { setItems(data.items); setUnread(data.unread); })
      .catch(() => setItems((cur) => cur ?? []));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => { setOpen(false); load(); }, [location.pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      // Keep the "new" highlight visible while the panel is open; clear the badge now.
      setUnread(0);
      api.post('/notifications/seen').catch(() => {});
    }
    if (!next) setItems((cur) => cur?.map((i) => ({ ...i, unread: false })) ?? cur);
  };

  const go = (item: Item) => {
    setOpen(false);
    navigate(item.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF6A00] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-qore-dark/15 ${align === 'right' ? 'right-0' : 'left-0'}`}
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <p className="font-bold text-qore-text">Notifications</p>
              <button onClick={load} className="text-xs font-semibold text-qore-medium hover:underline">Refresh</button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items === null && <p className="p-6 text-center text-sm text-gray-400">Loading…</p>}
              {items?.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <BellOff size={26} className="text-gray-300" />
                  <p className="text-sm font-semibold text-gray-500">You're all caught up</p>
                  <p className="text-xs text-gray-400">New activity will show up here.</p>
                </div>
              )}
              {items?.map((item) => {
                const { icon: Icon, tone } = KIND[item.kind] ?? KIND.info;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    className={`flex w-full gap-3 border-b border-gray-50 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-gray-50 ${item.unread ? 'bg-qore-light/40' : ''}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-qore-text">{item.title}</span>
                        <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(item.at)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">{item.detail}</span>
                    </span>
                    {item.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#FF6A00]" aria-label="new" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
