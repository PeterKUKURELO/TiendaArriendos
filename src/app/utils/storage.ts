export const STORAGE_KEYS = {
  locals: 'mallplaza_backoffice_locals_v1',
  payments: 'mallplaza_backoffice_payments_v1',
};

const isBrowser = () => typeof window !== 'undefined';

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = <T>(key: string, value: T) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};
