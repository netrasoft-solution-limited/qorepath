import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Award, Upload, FileText, Trash2, GraduationCap, Eye } from 'lucide-react';
import api from '../../lib/api';

const ACCEPT = 'application/pdf,image/png,image/jpeg';
const MAX_BYTES = 5 * 1024 * 1024;
const kb = (n?: number) => (n ? (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`) : '');
const errText = (err: any, fallback: string) =>
  err.response?.status === 413 ? 'The file must be 5 MB or smaller' : err.response?.data?.message || fallback;

// Opens an uploaded certificate file. Files on Publitio open directly; files kept in the
// database need the user's token, so they're fetched first.
export async function openCertificateFile(cert: { id: string; fileUrl?: string | null }) {
  if (cert.fileUrl) {
    window.open(cert.fileUrl, '_blank', 'noopener');
    return;
  }
  const tab = window.open('', '_blank');
  try {
    const { data } = await api.get(`/certificates/${cert.id}/file`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    if (tab) tab.location.href = url; else window.location.href = url;
  } catch {
    tab?.close();
    alert('Could not open the certificate file');
  }
}

function checkFile(f?: File | null) {
  if (!f) return '';
  if (!ACCEPT.split(',').includes(f.type)) return 'Upload a PDF, PNG or JPG file';
  if (f.size > MAX_BYTES) return 'The file must be 5 MB or smaller';
  return '';
}

export function AdminCertificates() {
  const [params] = useSearchParams();
  const focus = params.get('graduation');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [ready, setReady] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const [certRes, gradRes] = await Promise.all([api.get('/certificates'), api.get('/graduation/all')]);
      setCertificates(certRes.data);
      setReady(gradRes.data.filter((g: any) => g.status === 'approved' && !g.certificate));
    } catch {
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (key: string, fn: () => Promise<void>, fallback: string) => {
    setBusy((b) => ({ ...b, [key]: true }));
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
    } catch (err: any) {
      setError(errText(err, fallback));
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const issue = (g: any) => run(g.id, async () => {
    const file = files[g.id];
    const problem = checkFile(file);
    if (problem) throw { response: { data: { message: problem } } };
    const body = new FormData();
    body.append('graduationId', g.id);
    if (file) body.append('file', file);
    const { data } = await api.post('/certificates', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    setFiles((f) => ({ ...f, [g.id]: null }));
    setNotice(`Issued ${data.certificateNumber} to ${g.enrollment?.learner?.firstName}. They've been emailed.`);
  }, 'Failed to issue certificate');

  const upload = (c: any, file?: File | null) => run(c.id, async () => {
    const problem = checkFile(file);
    if (problem || !file) throw { response: { data: { message: problem || 'Choose a file' } } };
    const body = new FormData();
    body.append('file', file);
    await api.post(`/certificates/${c.id}/file`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
    setNotice(`Uploaded ${file.name} to ${c.certificateNumber}.`);
  }, 'Failed to upload the file');

  const removeFile = (c: any) => {
    if (!confirm(`Remove the uploaded file from ${c.certificateNumber}? The certificate stays valid.`)) return;
    run(c.id, () => api.delete(`/certificates/${c.id}/file`).then(() => undefined), 'Failed to remove the file');
  };

  const revoke = (c: any) => {
    if (!confirm(`Revoke ${c.certificateNumber} for ${c.user?.firstName} ${c.user?.lastName}?\n\nIt will no longer verify, and the learner loses it from their dashboard. This can't be undone, but you can issue a new one.`)) return;
    run(c.id, () => api.delete(`/certificates/${c.id}`).then(() => undefined), 'Failed to revoke the certificate');
  };

  const filtered = certificates.filter((c) =>
    `${c.user?.firstName} ${c.user?.lastName} ${c.certificateNumber} ${c.enrollment?.program?.track ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">Certificates</h1>
        <p className="text-gray-500">{certificates.length} issued · certificates are issued from approved graduations</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {notice && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{notice}</div>}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-qore-highlight">
        <h2 className="font-bold text-qore-text flex items-center gap-2"><GraduationCap size={18} /> Ready to issue</h2>
        <p className="text-sm text-gray-500 mt-1">
          Learners whose graduation is approved. You can attach your own certificate file (PDF, PNG or JPG, up to 5 MB) now or later.
        </p>
        {loading ? (
          <p className="text-sm text-gray-400 mt-4">Loading…</p>
        ) : ready.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">
            Nobody is waiting for a certificate. Approve learners in the <Link to="/admin/graduation" className="text-qore-medium font-medium hover:underline">Graduation queue</Link> first.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {ready.map((g) => (
              <div key={g.id} className={`py-3 flex flex-col md:flex-row md:items-center gap-3 ${focus === g.id ? 'bg-qore-light/40 -mx-3 px-3 rounded-lg' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-qore-text">{g.enrollment?.learner?.firstName} {g.enrollment?.learner?.lastName}</p>
                  <p className="text-xs text-gray-500">{g.enrollment?.program?.track} · {g.enrollment?.program?.cohort?.name}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 max-w-xs">
                  <Upload size={14} className="shrink-0" />
                  <span className="truncate">{files[g.id]?.name ?? 'Attach file (optional)'}</span>
                  <input type="file" accept={ACCEPT} className="hidden"
                    onChange={(e) => setFiles((f) => ({ ...f, [g.id]: e.target.files?.[0] ?? null }))} />
                </label>
                <button onClick={() => issue(g)} disabled={busy[g.id]}
                  className="flex items-center justify-center gap-2 bg-qore-dark text-white px-4 py-2 rounded-lg hover:bg-qore-medium transition-colors text-sm font-medium disabled:opacity-60"
                >
                  <Award size={15} /> {busy[g.id] ? 'Issuing…' : 'Issue certificate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, track or certificate number…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-qore-medium"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No certificates issued yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Certificate #</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Learner</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Track · Cohort</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">Issued</th>
                <th className="text-left px-6 py-4 font-medium text-gray-500">File</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-qore-medium font-medium">
                      <Award size={14} />
                      {c.certificateNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-qore-text">
                    {c.user?.firstName} {c.user?.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {c.enrollment?.program?.track ? `${c.enrollment.program.track} · ` : ''}{c.cohort?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{c.issuedDate?.slice(0, 10)}</td>
                  <td className="px-6 py-4">
                    {c.fileName ? (
                      <div className="flex items-center gap-2 text-xs">
                        <button onClick={() => openCertificateFile(c)} className="flex items-center gap-1 text-qore-medium font-medium hover:underline" title={c.fileName}>
                          <FileText size={14} /> <span className="max-w-[10rem] truncate">{c.fileName}</span>
                        </button>
                        <span className="text-gray-400">{kb(c.fileSize)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <label className={`flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-50 ${busy[c.id] ? 'opacity-60 pointer-events-none' : ''}`}>
                        <Upload size={13} /> {busy[c.id] ? 'Saving…' : c.fileName ? 'Replace' : 'Upload'}
                        <input type="file" accept={ACCEPT} className="hidden"
                          onChange={(e) => { upload(c, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                      {c.fileName && (
                        <button onClick={() => removeFile(c)} disabled={busy[c.id]} title="Remove file"
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 text-gray-500">
                          Remove file
                        </button>
                      )}
                      <a href={`/public/verify/${c.certificateNumber}`} target="_blank" rel="noreferrer" title="Public verification page"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-qore-medium hover:bg-gray-100"><Eye size={15} /></a>
                      <button onClick={() => revoke(c)} disabled={busy[c.id]} title="Revoke certificate"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
