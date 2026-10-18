/**
 * Computes a SHA-256 hash using the standard Web Crypto API.
 * Supports string, ArrayBuffer, Uint8Array, or File objects.
 */
export async function computeHash(data: string | ArrayBuffer | Uint8Array | File): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(data).buffer as ArrayBuffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer as ArrayBuffer;
  } else if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (typeof File !== 'undefined' && data instanceof File) {
    buffer = await data.arrayBuffer();
  } else {
    throw new Error('Unsupported data type for hash computation.');
  }

  // Use standard Web Crypto API
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : (globalThis as any).crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API is not available in the current environment.');
  }

  const hashBuffer = await subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
