export interface FileEntry {
  path: string; // 相対パス (例: "src/index.ts")
  name: string; // ファイル名
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
 * 左右のFileEntry一覧から統合差分リストを生成する純粋関数
 */
export function matchFolderEntries(
  leftEntries: FileEntry[],
  rightEntries: FileEntry[]
): { items: DiffItem[]; summary: DiffSummary } {
  const map = new Map<string, { left?: FileEntry; right?: FileEntry }>();

  // 左側のファイルを登録
  for (const entry of leftEntries) {
    map.set(entry.path, { left: entry });
  }

  // 右側のファイルを登録/突合
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

  // 全アイテムのステータスを判定
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
      // 左右両方に存在する場合の比較
      if (left.hash && right.hash) {
        // ハッシュ値が存在する場合はハッシュで厳密比較
        if (left.hash === right.hash) {
          status = 'identical';
          summary.identical++;
        } else {
          status = 'modified';
          summary.modified++;
        }
      } else {
        // ハッシュ計算前の高速比較（サイズと更新日時）
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

  // パス順（アルファベット順・ディレクトリ階層順）にソート
  items.sort((a, b) => a.path.localeCompare(b.path));

  return { items, summary };
}
