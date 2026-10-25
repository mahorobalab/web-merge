import { describe, it, expect } from 'vitest';
import { getMobileNoticeLabels } from './mobileNoticeData';

describe('mobileNoticeData', () => {
  it('returns Japanese labels when locale is ja', () => {
    const labels = getMobileNoticeLabels('ja');
    expect(labels.badge).toContain('PC');
    expect(labels.title).toContain('PC（デスクトップブラウザ）');
    expect(labels.copyUrl).toBe('URLをコピーしてPCで開く');
    expect(labels.reasons.length).toBeGreaterThan(0);
  });

  it('returns English labels when locale is en or other', () => {
    const labelsEn = getMobileNoticeLabels('en');
    expect(labelsEn.badge).toBe('Desktop Optimized');
    expect(labelsEn.title).toContain('Desktop Browser');
    expect(labelsEn.copyUrl).toBe('Copy Link to Open on PC');

    const labelsFr = getMobileNoticeLabels('fr');
    expect(labelsFr.title).toBe(labelsEn.title); // fallback to English
  });
});
