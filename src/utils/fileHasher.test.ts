import { describe, it, expect } from 'vitest';
import { computeHash } from './fileHasher';

describe('fileHasher', () => {
  it('computes consistent SHA-256 hash for identical string inputs', async () => {
    const textA = 'Hello, WebMerge!';
    const textB = 'Hello, WebMerge!';
    const hashA = await computeHash(textA);
    const hashB = await computeHash(textB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64); // SHA-256 hex string length
  });

  it('produces completely different hashes for differing inputs', async () => {
    const textA = 'function test() { return 1; }';
    const textB = 'function test() { return 2; }';
    const hashA = await computeHash(textA);
    const hashB = await computeHash(textB);

    expect(hashA).not.toBe(hashB);
  });

  it('returns the standard SHA-256 digest for empty string', async () => {
    const hash = await computeHash('');
    // Standard empty SHA-256
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('computes hash from Uint8Array accurately', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const hash = await computeHash(data);
    expect(hash).toHaveLength(64);
  });
});
