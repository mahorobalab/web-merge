export const ABOUT_SHOWN_STORAGE_KEY = 'webmerge_about_shown';

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Checks whether the About modal should be shown automatically on startup.
 * Returns true only on first access (when the localStorage flag is not 'true').
 */
export function shouldShowAboutOnStartup(customStorage?: Storage | null): boolean {
  try {
    const storage = customStorage !== undefined ? customStorage : getLocalStorage();
    if (!storage) return false;
    return storage.getItem(ABOUT_SHOWN_STORAGE_KEY) !== 'true';
  } catch {
    return false;
  }
}

/**
 * Marks the About modal as shown in localStorage so it will not appear on subsequent visits.
 */
export function markAboutAsShown(customStorage?: Storage | null): void {
  try {
    const storage = customStorage !== undefined ? customStorage : getLocalStorage();
    if (!storage) return;
    storage.setItem(ABOUT_SHOWN_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors (e.g. private browsing restrictions)
  }
}

/**
 * Resets the About shown flag in localStorage (useful for testing or resetting preferences).
 */
export function resetAboutShown(customStorage?: Storage | null): void {
  try {
    const storage = customStorage !== undefined ? customStorage : getLocalStorage();
    if (!storage) return;
    storage.removeItem(ABOUT_SHOWN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
