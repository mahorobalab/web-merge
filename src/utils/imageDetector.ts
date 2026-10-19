/**
 * List of recognized image file extensions.
 */
const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'ico',
  'bmp',
  'avif',
]);

/**
 * Checks whether a given filename or path is an image file.
 */
export function isImageFileName(filename: string): boolean {
  if (!filename) return false;
  const parts = filename.toLowerCase().split('.');
  if (parts.length < 2) return false;
  const ext = parts[parts.length - 1];
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Returns the MIME type corresponding to the given file extension.
 */
export function getImageMimeType(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1] : '';

  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'bmp':
      return 'image/bmp';
    case 'avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}
