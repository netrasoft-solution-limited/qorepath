import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Share2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { openCertificateFile } from '../admin/AdminCertificates';

export function LearnerCertificate() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates/my').then(({ data }) => setCertificates(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Loading certificates…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-qore-text">My Certificates</h1>
        <p className="text-gray-500">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No certificates yet</p>
          <p className="text-gray-400 text-sm mt-1">Complete your cohort to earn your certificate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-qore-dark text-white rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Award size={32} className="text-qore-highlight" />
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-widest">Certificate of Completion</p>
                      <p className="font-bold text-xl">{c.enrollment?.program?.track ?? c.cohort?.name}</p>
                      {c.enrollment?.program?.track && <p className="text-white/60 text-sm">{c.cohort?.name}</p>}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">
                    Awarded to <span className="font-semibold text-white">{(user as any)?.firstName} {(user as any)?.lastName}</span>
                  </p>
                  <p className="text-white/60 text-xs mt-1">Issued: {c.issuedDate?.slice(0, 10)}</p>
                  <p className="font-mono text-xs text-qore-highlight mt-2">{c.certificateNumber}</p>
                </div>
                <div className="flex gap-2">
                  {c.fileName && (
                    <button onClick={() => openCertificateFile(c)}
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                    >
                      <Download size={13} /> Download
                    </button>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/public/verify/${c.certificateNumber}`)}
                    title="Copy the public verification link"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
