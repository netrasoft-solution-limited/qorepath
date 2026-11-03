import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Video, Calendar, Clock, CheckCircle, Link as LinkIcon, Save, Users, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// Loads the JaaS (8x8) external_api.js for this tenant, once.
function loadJaasScript(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve();
    const script = document.createElement('script');
    script.src = `https://8x8.vc/${appId}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the video library. Check your connection.'));
    document.body.appendChild(script);
  });
}

export function VirtualClassroom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [started, setStarted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [ended, setEnded] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';
  const canModerate = isInstructor || isAdmin;

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/sessions/${sessionId}/access`)
      .then(({ data }) => {
        setSession(data.session);
        setRecordingUrl(data.session?.recordingUrl ?? '');
      })
      .catch((err) =>
        setError(
          err.response?.status === 403
            ? 'You do not have access to this classroom.'
            : 'Session not found',
        ),
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  const joinRoom = async () => {
    if (!containerRef.current || !session) return;
    setJoining(true);
    setError('');

    let jaas: { jwt: string; appId: string; room: string };
    try {
      const { data } = await api.get(`/sessions/${session.id}/jaas-token`);
      jaas = data;
      await loadJaasScript(jaas.appId);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not start the classroom.');
      setJoining(false);
      return;
    }

    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      setError('Video library not ready. Please try again.');
      setJoining(false);
      return;
    }

    const displayName = `${(user as any)?.firstName ?? ''} ${(user as any)?.lastName ?? ''}`.trim() || user?.email || 'Participant';

    // NOTE: named `jitsi` (not `api`) to avoid shadowing the axios client `api`.
    const jitsi = new window.JitsiMeetExternalAPI('8x8.vc', {
      roomName: `${jaas.appId}/${jaas.room}`,
      jwt: jaas.jwt,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName,
        email: user?.email ?? '',
      },
      configOverwrite: {
        subject: session.title,
        prejoinPageEnabled: true,
        disableDeepLinking: true,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableNoisyMicDetection: true,
        startAudioOnly: false,
        disableInviteFunctions: false,
        enableLobbyChat: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE: false,
        DEFAULT_BACKGROUND: '#1B4332',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: false,
      },
    });

    jitsi.addEventListener('videoConferenceJoined', () => {
      setInCall(true);
      // Auto-attendance: a learner who actually joins is marked present.
      if (user?.role === 'learner') {
        api.post(`/sessions/${sessionId}/attend`).catch(() => {});
      }
    });
    jitsi.addEventListener('participantJoined', () => setParticipantCount((p) => p + 1));
    jitsi.addEventListener('participantLeft', () => setParticipantCount((p) => Math.max(0, p - 1)));
    jitsi.addEventListener('videoConferenceLeft', () => {
      setInCall(false);
      setEnded(true);
      jitsiRef.current?.dispose();
    });
    jitsi.addEventListener('readyToClose', () => {
      setInCall(false);
      setEnded(true);
      jitsiRef.current?.dispose();
    });

    jitsiRef.current = jitsi;
    setStarted(true); // reveal the Jitsi iframe (hides the join overlay)
    setJoining(false);
  };

  const handleEndSession = async () => {
    jitsiRef.current?.executeCommand('hangup');
    setInCall(false);
    setEnded(true);
    if (canModerate) {
      try {
        await api.patch(`/sessions/${sessionId}`, { isCompleted: true });
        setSession((prev: any) => ({ ...prev, isCompleted: true }));
      } catch {}
    }
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingUrl.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/sessions/${sessionId}`, { recordingUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save recording URL');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    jitsiRef.current?.dispose();
    navigate(isInstructor ? '/instructor/sessions' : isAdmin ? '/admin/dashboard' : '/learner/sessions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-qore-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-qore-medium border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-qore-dark flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={goBack} className="bg-qore-medium px-5 py-2.5 rounded-xl text-sm font-medium">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-qore-dark flex items-center justify-between px-5 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="w-px h-5 bg-white/20" />
          <div className="flex items-center gap-2">
            <Video size={16} className="text-qore-highlight" />
            <span className="text-white font-semibold text-sm">{session?.title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {session && new Date(session.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {session && new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {session?.durationMinutes && (
              <span>{session.durationMinutes} min</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {inCall && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
              Live
            </div>
          )}
          {participantCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Users size={12} /> {participantCount + 1}
            </div>
          )}
          {inCall && canModerate && (
            <button
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Jitsi container */}
        <div className="flex-1 relative">
          {!started && !ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-qore-dark rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-qore-medium/20 flex items-center justify-center mx-auto mb-4">
                  <Video size={28} className="text-qore-highlight" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">{session?.title}</h2>
                <p className="text-white/50 text-sm mb-1">
                  {session && new Date(session.scheduledAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' · '}
                  {session && new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {session?.durationMinutes && (
                  <p className="text-white/40 text-xs mb-6">{session.durationMinutes} minutes · Powered by Jitsi Meet</p>
                )}

                {session?.isCompleted ? (
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <CheckCircle size={20} className="text-green-400 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">This session has ended.</p>
                    {session.recordingUrl && (
                      <a href={session.recordingUrl} target="_blank" rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-qore-highlight text-sm hover:underline"
                      >
                        <LinkIcon size={14} /> Watch Recording
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Before you join</p>
                      {[
                        'Allow camera and microphone access when prompted',
                        canModerate ? 'You are joining as moderator — join first to start the room' : 'Your instructor will admit you once they start',
                        'Use the recording button in Jitsi to record the session',
                        '2–3 hour sessions are fully supported',
                      ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <span className="w-4 h-4 rounded-full bg-qore-medium/30 text-qore-highlight flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                          {tip}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { joinRoom(); }}
                      disabled={joining}
                      className="w-full bg-qore-medium hover:bg-qore-dark text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Video size={18} />
                      {joining ? 'Connecting…' : canModerate ? 'Start Classroom' : 'Join Classroom'}
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}

          <div ref={containerRef} className="w-full h-full" style={{ minHeight: 'calc(100vh - 56px)' }} />
        </div>

        {/* Post-session panel for instructors */}
        <AnimatePresence>
          {ended && canModerate && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 bg-qore-dark border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto"
            >
              <div>
                <h3 className="text-white font-bold text-base mb-1">Session Ended</h3>
                <p className="text-white/50 text-xs">If you recorded, the link saves here automatically once 8x8 finishes processing.</p>
              </div>

              <div className="bg-green-900/30 border border-green-700/30 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400 shrink-0" />
                <p className="text-green-300 text-xs">Session marked as completed.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs">
                  {recordingUrl
                    ? '✓ A recording link is attached to this session — learners can watch it from Sessions.'
                    : 'Recordings are processed by 8x8 and attached automatically (this can take a few minutes after the call ends). You can also paste a link manually below.'}
                </p>
              </div>

              <form onSubmit={handleSaveRecording} className="space-y-3">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Recording URL <span className="font-normal lowercase text-white/30">(manual override)</span>
                </label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-qore-medium"
                />
                <button
                  type="submit"
                  disabled={saving || !recordingUrl.trim()}
                  className="w-full bg-qore-medium hover:bg-qore-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={15} /> {saving ? 'Saving…' : 'Save Recording'}
                </button>
                {saved && (
                  <p className="text-green-400 text-xs text-center flex items-center justify-center gap-1">
                    <CheckCircle size={13} /> Recording URL saved.
                  </p>
                )}
              </form>

              <div className="pt-3 border-t border-white/10">
                <button onClick={goBack}
                  className="w-full border border-white/20 text-white/60 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
                >
                  Back to Sessions
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post-session for learners */}
        {ended && !canModerate && (
          <div className="absolute inset-0 bg-[#0d1117] flex items-center justify-center z-20">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-qore-dark rounded-2xl p-8 max-w-sm w-full mx-4 text-center border border-white/10"
            >
              <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">Class Ended</h3>
              <p className="text-white/50 text-sm mb-6">Great work today! The recording will be available in your sessions once the instructor saves it.</p>
              <button onClick={goBack}
                className="w-full bg-qore-medium hover:bg-qore-dark text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Back to Sessions
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
