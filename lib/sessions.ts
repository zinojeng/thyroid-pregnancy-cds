// Session storage for clinical drafts. Uses idb-keyval (IndexedDB wrapper).
// Stays client-side; no PHI leaves the browser. Auto-save draft + named saves.

import { get, set, del, keys, createStore } from 'idb-keyval';

const store = typeof window !== 'undefined'
  ? createStore('thypreg-cds-db', 'sessions')
  : (undefined as any);

const DRAFT_KEY = '__draft__';

export interface Session {
  id: string;
  label: string;
  createdAt: number;
  updatedAt: number;
  form: any;
  output?: string;
}

export async function saveDraft(form: any): Promise<void> {
  if (!store) return;
  await set(DRAFT_KEY, { id: DRAFT_KEY, label: 'Draft', createdAt: Date.now(), updatedAt: Date.now(), form }, store);
}

export async function loadDraft(): Promise<any | null> {
  if (!store) return null;
  const s = (await get(DRAFT_KEY, store)) as Session | undefined;
  return s?.form ?? null;
}

export async function clearDraft(): Promise<void> {
  if (!store) return;
  await del(DRAFT_KEY, store);
}

export async function saveSession(label: string, form: any, output?: string): Promise<Session> {
  if (!store) throw new Error('No store');
  const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const session: Session = {
    id,
    label: label.trim() || `未命名 ${new Date().toLocaleString('zh-TW')}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    form,
    output,
  };
  await set(id, session, store);
  return session;
}

export async function listSessions(): Promise<Session[]> {
  if (!store) return [];
  const allKeys = await keys(store);
  const sessions = await Promise.all(
    allKeys
      .filter((k) => typeof k === 'string' && k !== DRAFT_KEY)
      .map(async (k) => (await get(k as IDBValidKey, store)) as Session | undefined)
  );
  return sessions
    .filter((s): s is Session => Boolean(s))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadSession(id: string): Promise<Session | null> {
  if (!store) return null;
  return ((await get(id, store)) as Session | undefined) ?? null;
}

export async function deleteSession(id: string): Promise<void> {
  if (!store) return;
  await del(id, store);
}

export function summarize(form: any): string {
  const bits: string[] = [];
  if (form?.gaWeeks) bits.push(`GA ${form.gaWeeks}+${form.gaDays || 0}w`);
  if (form?.labs?.tsh) bits.push(`TSH ${form.labs.tsh}`);
  if (form?.labs?.ft4) bits.push(`fT4 ${form.labs.ft4}`);
  if (form?.history?.length) bits.push(form.history.join(','));
  return bits.join(' · ') || '(empty)';
}
