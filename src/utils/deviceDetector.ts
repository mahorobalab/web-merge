/**
 * Utilities for detecting mobile devices and screen constraints.
 * Pure functions to allow headless unit testing with Vitest.
 */

export const MOBILE_SCREEN_BREAKPOINT = 768;

/**
 * Checks if a user agent string corresponds to a mobile phone.
 */
export function isMobileUserAgent(ua: string): boolean {
  if (!ua) return false;
  return /Android.*Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Checks if the current environment is considered a mobile/small-screen device.
 * Considers both viewport width and user agent.
 */
export function isMobileEnvironment(options?: {
  userAgent?: string;
  screenWidth?: number;
}): boolean {
  const ua = options?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const width = options?.screenWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1200);

  // If the screen width is smaller than the breakpoint, treat as mobile layout
  if (width < MOBILE_SCREEN_BREAKPOINT) {
    return true;
  }

  // If user agent is explicitly a mobile phone
  if (isMobileUserAgent(ua)) {
    return true;
  }

  return false;
}

const STORAGE_KEY_DISMISSED = 'webmerge_mobile_notice_dismissed';

/**
 * Checks if the user has previously dismissed the mobile notice in the current session.
 */
export function hasDismissedMobileNotice(storage?: Storage): boolean {
  try {
    const s = storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
    return s?.getItem(STORAGE_KEY_DISMISSED) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks the mobile notice as dismissed for the current session.
 */
export function setDismissedMobileNotice(storage?: Storage): void {
  try {
    const s = storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
    s?.setItem(STORAGE_KEY_DISMISSED, 'true');
  } catch {
    // Ignore storage errors (e.g. private browsing mode)
  }
}
