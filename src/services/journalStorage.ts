import type { JournalEntry } from '../types/route';

const DB = 'chuyou-journal';
const STORE = 'photos';
const META = 'chuyou-journal-entries';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhoto(file: File) {
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return id;
}

export async function loadPhoto(id: string) {
  const db = await openDb();
  const result = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function deletePhoto(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function readEntries(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(META) ?? '[]'); } catch { return []; }
}

export function writeEntries(entries: JournalEntry[]) {
  localStorage.setItem(META, JSON.stringify(entries));
  window.dispatchEvent(new Event('journal-change'));
}

export async function clearJournal(entries: JournalEntry[]) {
  await Promise.all(entries.flatMap((entry) => entry.photoIds).map(deletePhoto));
  writeEntries([]);
}
