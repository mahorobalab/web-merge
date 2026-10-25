import { describe, it, expect, beforeEach } from 'vitest';
import {
  isMobileUserAgent,
  isMobileEnvironment,
  hasDismissedMobileNotice,
  setDismissedMobileNotice,
  MOBILE_SCREEN_BREAKPOINT,
} from './deviceDetector';

describe('deviceDetector', () => {
  describe('isMobileUserAgent', () => {
    it('detects iPhone user agent', () => {
      const iphoneUA =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
      expect(isMobileUserAgent(iphoneUA)).toBe(true);
    });

    it('detects Android Mobile user agent', () => {
      const androidMobileUA =
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36';
      expect(isMobileUserAgent(androidMobileUA)).toBe(true);
    });

    it('does not flag desktop Chrome or Safari user agent', () => {
      const desktopChrome =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const macSafari =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
      expect(isMobileUserAgent(desktopChrome)).toBe(false);
      expect(isMobileUserAgent(macSafari)).toBe(false);
    });

    it('handles empty or undefined user agent safely', () => {
      expect(isMobileUserAgent('')).toBe(false);
    });
  });

  describe('isMobileEnvironment', () => {
    it('returns true when screen width is below breakpoint', () => {
      expect(isMobileEnvironment({ screenWidth: 375, userAgent: '' })).toBe(true);
      expect(isMobileEnvironment({ screenWidth: MOBILE_SCREEN_BREAKPOINT - 1 })).toBe(true);
    });

    it('returns true when screen width is large but user agent is mobile', () => {
      const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Mobile/15E148';
      expect(isMobileEnvironment({ screenWidth: 1024, userAgent: iphoneUA })).toBe(true);
    });

    it('returns false for wide desktop screen with desktop user agent', () => {
      expect(
        isMobileEnvironment({
          screenWidth: 1440,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Safari/537.36',
        })
      ).toBe(false);
    });
  });

  describe('dismissal storage', () => {
    let mockStorage: Record<string, string>;
    let storageAdapter: Storage;

    beforeEach(() => {
      mockStorage = {};
      storageAdapter = {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          mockStorage = {};
        },
        key: () => null,
        length: 0,
      };
    });

    it('starts with not dismissed', () => {
      expect(hasDismissedMobileNotice(storageAdapter)).toBe(false);
    });

    it('sets dismissed and detects it correctly', () => {
      setDismissedMobileNotice(storageAdapter);
      expect(hasDismissedMobileNotice(storageAdapter)).toBe(true);
    });
  });
});
