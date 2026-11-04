import { useEffect, useState } from 'react';
import api from './api';

export interface SiteInfo {
  contactEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  socials: Partial<Record<'instagram' | 'x' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok', string>>;
  termsText: string;
  privacyText: string;
  acceptsMessages: boolean;
}

// Site & contact details from Settings → Site & Contact. Fetched once per page load and shared.
let pending: Promise<SiteInfo | null> | null = null;
export function loadSiteInfo(fresh = false) {
  if (!pending || fresh) pending = api.get('/settings/site').then(({ data }) => data as SiteInfo).catch(() => null);
  return pending;
}

export function useSiteInfo() {
  const [info, setInfo] = useState<SiteInfo | null>(null);
  useEffect(() => { loadSiteInfo().then(setInfo); }, []);
  return info;
}

/** wa.me link from a phone number like "+234 801 234 5678". */
export const whatsappLink = (n: string) => `https://wa.me/${n.replace(/[^\d]/g, '')}`;
