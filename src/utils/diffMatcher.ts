export interface FileEntry {
  path: string; // Relative path (e.g. "src/index.ts")
  name: string; // File name
  size: number;
  lastModified: number;
  handle?: FileSystemFileHandle;
  hash?: string;
}

export type DiffStatus = 'identical' | 'modified' | 'left-only' | 'right-only';

export interface DiffItem {
  path: string;
  name: string;
  status: DiffStatus;
  left?: FileEntry;
  right?: FileEntry;
}

export interface DiffSummary {
  total: number;
  identical: number;
  modified: number;
  leftOnly: number;
  rightOnly: number;
}

/**
 * Pure function that matches file entries from left and right directories,
 * determining diff statuses and generating an aggregated comparison list.
 */
export function matchFolderEntries(
  leftEntries: FileEntry[],
  rightEntries: FileEntry[]
): { items: DiffItem[]; summary: DiffSummary } {
  const map = new Map<string, { left?: FileEntry; right?: FileEntry }>();

  // Register left-side entries
  for (const entry of leftEntries) {
    map.set(entry.path, { left: entry });
  }

  // Register and match right-side entries
  for (const entry of rightEntries) {
    const existing = map.get(entry.path);
    if (existing) {
      existing.right = entry;
    } else {
      map.set(entry.path, { right: entry });
    }
  }

  const items: DiffItem[] = [];
  const summary: DiffSummary = {
    total: map.size,
    identical: 0,
    modified: 0,
    leftOnly: 0,
    rightOnly: 0,
  };

  // Evaluate diff status for each entry
  for (const [path, { left, right }] of map.entries()) {
    let status: DiffStatus;
    const name = (left?.name || right?.name) ?? path.split('/').pop() ?? path;

    if (left && !right) {
      status = 'left-only';
      summary.leftOnly++;
    } else if (!left && right) {
      status = 'right-only';
      summary.rightOnly++;
    } else if (left && right) {
      if (left.hash && right.hash) {
        // Strict comparison via hash values when available
        if (left.hash === right.hash) {
          status = 'identical';
          summary.identical++;
        } else {
          status = 'modified';
          summary.modified++;
        }
      } else {
        // Fast pre-hash comparison via file size and last modified timestamp
        if (left.size === right.size && left.lastModified === right.lastModified) {
          status = 'identical';
          summary.identical++;
        } else {
          status = 'modified';
          summary.modified++;
        }
      }
    } else {
      continue;
    }

    items.push({
      path,
      name,
      status,
      left,
      right,
    });
  }

  // Sort items in alphabetical order by path
  items.sort((a, b) => a.path.localeCompare(b.path));

  return { items, summary };
}
