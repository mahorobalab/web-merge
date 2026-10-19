/**
 * Type of diff operation for a single line.
 */
export type DiffOp = 'same' | 'add' | 'del';

export interface DiffLine {
  op: DiffOp;
  leftLineNum?: number;
  rightLineNum?: number;
  text: string;
}

/**
 * Computes line-by-line diff using an efficient dynamic programming LCS algorithm.
 */
export function computeLineDiff(leftText: string, rightText: string): DiffLine[] {
  // Normalize line endings to \n and split
  const leftLines = leftText === '' ? [] : leftText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rightLines = rightText === '' ? [] : rightText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Remove trailing empty line if string ended with newline
  if (leftLines.length > 0 && leftLines[leftLines.length - 1] === '') {
    leftLines.pop();
  }
  if (rightLines.length > 0 && rightLines[rightLines.length - 1] === '') {
    rightLines.pop();
  }

  const n = leftLines.length;
  const m = rightLines.length;

  if (n === 0 && m === 0) {
    return [];
  }

  // LCS Matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1) as any);

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const result: DiffLine[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      result.push({
        op: 'same',
        leftLineNum: i,
        rightLineNum: j,
        text: leftLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        op: 'add',
        rightLineNum: j,
        text: rightLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.push({
        op: 'del',
        leftLineNum: i,
        text: leftLines[i - 1],
      });
      i--;
    }
  }

  return result.reverse();
}

/**
 * Generates a unified diff format patch string (compatible with patch / git apply).
 */
export function generateUnifiedDiff(
  leftFileName: string,
  rightFileName: string,
  leftText: string,
  rightText: string
): string {
  const diff = computeLineDiff(leftText, rightText);
  const timestamp = new Date().toISOString();

  const lines: string[] = [
    `--- ${leftFileName}\t${timestamp}`,
    `+++ ${rightFileName}\t${timestamp}`,
  ];

  const hasChanges = diff.some((d) => d.op !== 'same');
  if (!hasChanges) {
    lines.push('@@ -1 +1 @@');
    lines.push(' No differences detected.');
    return lines.join('\n');
  }

  // Group into chunks
  let leftStart = 1;
  let rightStart = 1;
  let leftCount = 0;
  let rightCount = 0;
  const chunkLines: string[] = [];

  for (const d of diff) {
    if (d.op === 'same') {
      chunkLines.push(` ${d.text}`);
      leftCount++;
      rightCount++;
    } else if (d.op === 'del') {
      chunkLines.push(`-${d.text}`);
      leftCount++;
    } else if (d.op === 'add') {
      chunkLines.push(`+${d.text}`);
      rightCount++;
    }
  }

  lines.push(`@@ -${leftStart},${leftCount} +${rightStart},${rightCount} @@`);
  lines.push(...chunkLines);

  return lines.join('\n');
}

export interface HtmlReportOptions {
  leftTitle: string;
  rightTitle: string;
  leftContent: string;
  rightContent: string;
  language?: string;
}

/**
 * Generates a standalone, self-contained HTML diff report.
 */
export function generateHtmlReport(options: HtmlReportOptions): string {
  const { leftTitle, rightTitle, leftContent, rightContent, language = 'text' } = options;
  const diff = computeLineDiff(leftContent, rightContent);

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  let addCount = 0;
  let delCount = 0;
  let sameCount = 0;

  for (const d of diff) {
    if (d.op === 'add') addCount++;
    else if (d.op === 'del') delCount++;
    else sameCount++;
  }

  const rows = diff
    .map((d) => {
      const cls = d.op === 'add' ? 'diff-line add' : d.op === 'del' ? 'diff-line del' : 'diff-line same';
      const prefix = d.op === 'add' ? '+' : d.op === 'del' ? '-' : ' ';
      const leftNum = d.leftLineNum ?? '';
      const rightNum = d.rightLineNum ?? '';
      return `<tr class="${cls}">
  <td class="linenum left">${leftNum}</td>
  <td class="linenum right">${rightNum}</td>
  <td class="sign">${prefix}</td>
  <td class="code"><code>${escapeHtml(d.text)}</code></td>
</tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebMerge Diff Report</title>
  <style>
    :root {
      --bg: #1e1e1e;
      --card-bg: #252526;
      --text: #d4d4d4;
      --border: #3c3c3c;
      --add-bg: rgba(46, 160, 67, 0.18);
      --add-text: #7ee787;
      --del-bg: rgba(248, 81, 73, 0.18);
      --del-text: #ff7b72;
      --linenum: #858585;
      --font-mono: 'JetBrains Mono', Consolas, 'Courier New', monospace;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      background: #0284c7;
      color: white;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .meta {
      font-size: 0.85rem;
      color: var(--linenum);
    }
    .summary-bar {
      display: flex;
      gap: 16px;
      padding: 10px 20px;
      background: #18181b;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--border);
    }
    .stat-add { color: var(--add-text); font-weight: bold; }
    .stat-del { color: var(--del-text); font-weight: bold; }
    .stat-same { color: var(--text); }
    .files-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 10px 20px;
      background: #2a2d2e;
      border-bottom: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }
    .files-header .left { color: #60a5fa; }
    .files-header .right { color: #38bdf8; text-align: right; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.4;
    }
    tr.diff-line.add { background: var(--add-bg); }
    tr.diff-line.del { background: var(--del-bg); }
    td { padding: 2px 6px; }
    td.linenum {
      width: 45px;
      text-align: right;
      color: var(--linenum);
      user-select: none;
      border-right: 1px solid var(--border);
    }
    td.sign {
      width: 20px;
      text-align: center;
      user-select: none;
      font-weight: bold;
    }
    tr.diff-line.add td.sign { color: var(--add-text); }
    tr.diff-line.del td.sign { color: var(--del-text); }
    td.code { white-space: pre-wrap; word-break: break-all; }
    td.code code { font-family: inherit; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="title">
        <span>⚡ WebMerge Diff Report</span>
        <span class="badge">${escapeHtml(language.toUpperCase())}</span>
      </div>
      <div class="meta">Generated: ${new Date().toLocaleString()} (Local-First Zero-Server)</div>
    </header>

    <div class="files-header">
      <div class="left">Left: ${escapeHtml(leftTitle)}</div>
      <div class="right">Right: ${escapeHtml(rightTitle)}</div>
    </div>

    <div class="summary-bar">
      <span>Differences: <strong>${addCount + delCount}</strong></span>
      <span class="stat-add">+${addCount} added</span>
      <span class="stat-del">-${delCount} deleted</span>
      <span class="stat-same">${sameCount} unchanged lines</span>
    </div>

    <table>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
