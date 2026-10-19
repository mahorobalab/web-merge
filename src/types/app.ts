import type { SupportedEncoding } from '../utils/encodingDetector';
import type { TabItem } from '../components/TabBar';

export interface FileState {
  name: string;
  path?: string;
  content: string;
  encoding?: SupportedEncoding;
  imageUrl?: string;
  handle?: FileSystemFileHandle;
  lastModified?: number;
  isDirty: boolean;
  size: number;
  readOnly?: boolean;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  side: 'left' | 'right';
  lineNumber: number;
  hasSelection: boolean;
  selection?: {
    startLineNumber: number;
    endLineNumber: number;
  };
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface AppTab extends TabItem {
  path?: string;
  leftFile?: FileState;
  rightFile?: FileState;
}
