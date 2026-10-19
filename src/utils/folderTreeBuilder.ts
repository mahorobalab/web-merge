import type { DiffItem, DiffStatus } from './diffMatcher';

export interface FolderTreeNode {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  isFolder: boolean;
  depth: number;
  status: DiffStatus;
  leftModified?: number;
  rightModified?: number;
  leftSize?: number;
  rightSize?: number;
  extension?: string;
  item?: DiffItem;
  children: FolderTreeNode[];
}

/**
 * Extracts file extension without the leading dot.
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0 || lastDot === filename.length - 1) {
    if (filename.startsWith('.') && filename.indexOf('.', 1) === -1) {
      return filename.slice(1); // e.g. .gitignore -> gitignore
    }
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Pure function to build a hierarchical folder tree from a flat list of DiffItem items.
 * Intermediate directories are created automatically and their diff status is derived
 * from their descendant files.
 */
export function buildFolderTree(diffItems: DiffItem[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootNodes: FolderTreeNode[] = [];

  // Helper to ensure an intermediate directory node exists
  function getOrCreateFolder(folderPath: string): FolderTreeNode {
    const normalized = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
    if (folderMap.has(normalized)) {
      return folderMap.get(normalized)!;
    }

    const segments = normalized.split('/');
    const name = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join('/');
    const depth = segments.length - 1;

    const folderNode: FolderTreeNode = {
      id: normalized,
      name,
      path: normalized,
      parentPath,
      isFolder: true,
      depth,
      status: 'identical',
      children: [],
    };

    folderMap.set(normalized, folderNode);

    if (parentPath) {
      const parentNode = getOrCreateFolder(parentPath);
      parentNode.children.push(folderNode);
    } else {
      rootNodes.push(folderNode);
    }

    return folderNode;
  }

  // Insert all leaf files
  for (const item of diffItems) {
    const normalizedPath = item.path.replace(/\\/g, '/');
    const segments = normalizedPath.split('/');
    const fileName = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join('/');
    const depth = segments.length - 1;

    const fileNode: FolderTreeNode = {
      id: normalizedPath,
      name: fileName,
      path: normalizedPath,
      parentPath,
      isFolder: false,
      depth,
      status: item.status,
      leftModified: item.left?.lastModified,
      rightModified: item.right?.lastModified,
      leftSize: item.left?.size,
      rightSize: item.right?.size,
      extension: getFileExtension(fileName),
      item,
      children: [],
    };

    if (parentPath) {
      const parentNode = getOrCreateFolder(parentPath);
      parentNode.children.push(fileNode);
    } else {
      rootNodes.push(fileNode);
    }
  }

  // Recursive post-processing: compute folder status & sort children (folders first, then alphabetically)
  function postProcessNode(node: FolderTreeNode): void {
    if (!node.isFolder) return;

    // Process all children first
    for (const child of node.children) {
      postProcessNode(child);
    }

    // Sort: directories first, then alphabetical by name
    node.children.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    // Derive directory status and date bounds from children
    let hasModified = false;
    let hasLeftOnly = false;
    let hasRightOnly = false;
    let hasIdentical = false;

    let maxLeftDate = 0;
    let maxRightDate = 0;
    let totalLeftSize = 0;
    let totalRightSize = 0;

    for (const child of node.children) {
      if (child.status === 'modified') hasModified = true;
      else if (child.status === 'left-only') hasLeftOnly = true;
      else if (child.status === 'right-only') hasRightOnly = true;
      else if (child.status === 'identical') hasIdentical = true;

      if (child.leftModified && child.leftModified > maxLeftDate) {
        maxLeftDate = child.leftModified;
      }
      if (child.rightModified && child.rightModified > maxRightDate) {
        maxRightDate = child.rightModified;
      }

      if (child.leftSize) totalLeftSize += child.leftSize;
      if (child.rightSize) totalRightSize += child.rightSize;
    }

    if (maxLeftDate > 0) node.leftModified = maxLeftDate;
    if (maxRightDate > 0) node.rightModified = maxRightDate;
    node.leftSize = totalLeftSize;
    node.rightSize = totalRightSize;

    // Determine status
    if (hasModified || (hasLeftOnly && hasRightOnly) || ((hasLeftOnly || hasRightOnly) && hasIdentical)) {
      node.status = 'modified';
    } else if (hasLeftOnly && !hasRightOnly && !hasIdentical) {
      node.status = 'left-only';
    } else if (hasRightOnly && !hasLeftOnly && !hasIdentical) {
      node.status = 'right-only';
    } else {
      node.status = 'identical';
    }
  }

  // Post process all root nodes and sort root
  for (const root of rootNodes) {
    postProcessNode(root);
  }

  rootNodes.sort((a, b) => {
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return rootNodes;
}

/**
 * Flattens the hierarchical tree into a linear list based on which directories are currently expanded.
 */
export function flattenFolderTree(
  nodes: FolderTreeNode[],
  expandedPaths: Set<string>
): FolderTreeNode[] {
  const result: FolderTreeNode[] = [];

  function traverse(list: FolderTreeNode[]) {
    for (const node of list) {
      result.push(node);
      if (node.isFolder && expandedPaths.has(node.path) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}
