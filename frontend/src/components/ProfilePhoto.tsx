import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './feedback';
import api from '../lib/api';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export function Avatar({ user, className = '' }: { user: any; className?: string }) {
  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';
  return user?.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className={`rounded-full object-cover ${className}`} />
  ) : (
    <div className={`rounded-full bg-qore-medium flex items-center justify-center font-bold text-white ${className}`}>{initials}</div>
  );
}

/** Upload / remove the signed-in user's own profile photo. */
export function useProfilePhoto() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const upload = async (file?: File | null) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast({ message: 'Upload a JPG, PNG or WebP image', variant: 'error' });
    if (file.size > MAX_BYTES) return toast({ message: 'The photo must be 2 MB or smaller', variant: 'error' });
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      await api.post('/users/me/avatar', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast({ message: 'Profile photo updated', variant: 'success' });
    } catch (err: any) {
      toast({ message: err.response?.status === 413 ? 'The photo must be 2 MB or smaller' : err.response?.data?.message || 'Could not upload the photo', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete('/users/me/avatar');
      await refreshUser();
      toast({ message: 'Profile photo removed', variant: 'success' });
    } catch (err: any) {
      toast({ message: err.response?.data?.message || 'Could not remove the photo', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return { upload, remove, busy };
}

/** Avatar that opens a file picker when clicked. */
export function EditableAvatar({ user, className = '' }: { user: any; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy } = useProfilePhoto();
  return (
    <button type="button" onClick={() => input.current?.click()} disabled={busy} title="Change profile photo"
      className={`group relative shrink-0 rounded-full ${busy ? 'opacity-60' : ''}`}>
      <Avatar user={user} className={className} />
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Camera size={16} className="text-white" />
      </span>
      <input ref={input} type="file" accept={TYPES.join(',')} className="hidden"
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </button>
  );
}
