import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteInfo } from '../../lib/siteInfo';

// Terms of Service / Privacy Policy, as pasted into Settings → Site & Contact.
export function PublicLegal({ kind }: { kind: 'terms' | 'privacy' }) {
  const info = useSiteInfo();
  const title = kind === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  const text = info ? (kind === 'terms' ? info.termsText : info.privacyText) : '';

  useEffect(() => {
    document.title = `${title} · NetraNova`;
    return () => { document.title = 'NetraNova Live Learning Platform'; };
  }, [title]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-qore-dark">{title}</h1>
      {info === null ? (
        <p className="mt-8 text-gray-400">Loading…</p>
      ) : text ? (
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-gray-700">
          {text.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      ) : (
        <p className="mt-8 text-gray-500">
          This page hasn't been published yet. Questions? <Link to="/public/contact" className="font-semibold text-qore-medium hover:underline">Contact us</Link>.
        </p>
      )}
    </div>
  );
}
