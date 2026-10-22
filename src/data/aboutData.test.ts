import { describe, it, expect } from 'vitest';
import { APP_INFO, OPEN_SOURCE_LIBRARIES, getAboutLabels } from './aboutData';

describe('aboutData', () => {
  it('should have valid application information', () => {
    expect(APP_INFO.name).toBe('WebMerge');
    expect(APP_INFO.version).toBeTruthy();
    expect(APP_INFO.githubUrl).toMatch(/^https:\/\/github\.com\//);
    expect(APP_INFO.features.length).toBeGreaterThanOrEqual(3);
    for (const f of APP_INFO.features) {
      expect(f.title.en).toBeTruthy();
      expect(f.title.ja).toBeTruthy();
      expect(f.desc.en).toBeTruthy();
      expect(f.desc.ja).toBeTruthy();
    }
  });

  it('should include required open source libraries with licenses and URLs', () => {
    expect(OPEN_SOURCE_LIBRARIES.length).toBeGreaterThanOrEqual(5);

    const monaco = OPEN_SOURCE_LIBRARIES.find((lib) => lib.package === 'monaco-editor');
    expect(monaco).toBeDefined();
    expect(monaco?.license).toBe('MIT');
    expect(monaco?.url).toContain('github.com');

    const react = OPEN_SOURCE_LIBRARIES.find((lib) => lib.package === 'react');
    expect(react).toBeDefined();
    expect(react?.license).toBe('MIT');

    const lucide = OPEN_SOURCE_LIBRARIES.find((lib) => lib.package === 'lucide-react');
    expect(lucide).toBeDefined();

    for (const lib of OPEN_SOURCE_LIBRARIES) {
      expect(lib.name).toBeTruthy();
      expect(lib.license).toBeTruthy();
      expect(lib.url).toMatch(/^https?:\/\//);
      expect(lib.description.en).toBeTruthy();
      expect(lib.description.ja).toBeTruthy();
    }
  });

  it('should return Japanese labels when locale is ja', () => {
    const labels = getAboutLabels('ja');
    expect(labels.title).toContain('WebMerge について');
    expect(labels.tabOverview).toContain('概要');
    expect(labels.tabLicenses).toContain('オープンソース');
    expect(labels.totalLibraries(5)).toContain('全 5 個のライブラリ');
  });

  it('should return English labels when locale is not ja', () => {
    const labels = getAboutLabels('en');
    expect(labels.title).toContain('About WebMerge');
    expect(labels.tabOverview).toContain('Overview');
    expect(labels.tabLicenses).toContain('Open Source');
    expect(labels.totalLibraries(5)).toContain('5 libraries used');
  });
});
