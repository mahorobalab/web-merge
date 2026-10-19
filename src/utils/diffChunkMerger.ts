export interface LineChangeInfo {
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
}

/**
 * Finds which diff chunk contains the specified line number on the given side.
 */
export function findLineChangeAtLine(
  changes: LineChangeInfo[],
  side: 'left' | 'right',
  lineNumber: number
): LineChangeInfo | null {
  for (const c of changes) {
    if (side === 'left') {
      if (c.originalEndLineNumber === 0) {
        // Insertion point on left side
        if (c.originalStartLineNumber === lineNumber) return c;
      } else if (lineNumber >= c.originalStartLineNumber && lineNumber <= c.originalEndLineNumber) {
        return c;
      }
    } else {
      if (c.modifiedEndLineNumber === 0) {
        // Insertion point on right side
        if (c.modifiedStartLineNumber === lineNumber) return c;
      } else if (lineNumber >= c.modifiedStartLineNumber && lineNumber <= c.modifiedEndLineNumber) {
        return c;
      }
    }
  }
  return null;
}

/**
 * Copies a single diff chunk from left (original) to right (modified) and returns updated right text.
 */
export function copyChunkLeftToRight(
  leftText: string,
  rightText: string,
  change: LineChangeInfo
): string {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');

  // Extract lines from left
  let linesToCopy: string[] = [];
  if (change.originalEndLineNumber > 0) {
    const startIdx = change.originalStartLineNumber - 1;
    const endIdx = change.originalEndLineNumber;
    linesToCopy = leftLines.slice(startIdx, endIdx);
  }

  // Replace in right
  const rightStartIdx =
    change.modifiedEndLineNumber === 0
      ? change.modifiedStartLineNumber
      : change.modifiedStartLineNumber - 1;
  const deleteCount =
    change.modifiedEndLineNumber === 0
      ? 0
      : change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;

  rightLines.splice(rightStartIdx, deleteCount, ...linesToCopy);
  return rightLines.join('\n');
}

/**
 * Copies a single diff chunk from right (modified) to left (original) and returns updated left text.
 */
export function copyChunkRightToLeft(
  leftText: string,
  rightText: string,
  change: LineChangeInfo
): string {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');

  // Extract lines from right
  let linesToCopy: string[] = [];
  if (change.modifiedEndLineNumber > 0) {
    const startIdx = change.modifiedStartLineNumber - 1;
    const endIdx = change.modifiedEndLineNumber;
    linesToCopy = rightLines.slice(startIdx, endIdx);
  }

  // Replace in left
  const leftStartIdx =
    change.originalEndLineNumber === 0
      ? change.originalStartLineNumber
      : change.originalStartLineNumber - 1;
  const deleteCount =
    change.originalEndLineNumber === 0
      ? 0
      : change.originalEndLineNumber - change.originalStartLineNumber + 1;

  leftLines.splice(leftStartIdx, deleteCount, ...linesToCopy);
  return leftLines.join('\n');
}

/**
 * Replaces a line range in target text with the selected line range from source text.
 */
export function copySelectedLines(
  sourceText: string,
  targetText: string,
  sourceStartLine: number,
  sourceEndLine: number,
  targetStartLine: number,
  targetEndLine: number
): string {
  const sourceLines = sourceText.split('\n');
  const targetLines = targetText.split('\n');

  const linesToCopy = sourceLines.slice(
    Math.max(0, sourceStartLine - 1),
    Math.min(sourceLines.length, sourceEndLine)
  );

  const startIdx = Math.max(0, targetStartLine - 1);
  const deleteCount = Math.max(0, targetEndLine - targetStartLine + 1);

  targetLines.splice(startIdx, deleteCount, ...linesToCopy);
  return targetLines.join('\n');
}
