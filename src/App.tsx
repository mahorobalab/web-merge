import React, { useState, useRef, useCallback } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { DiffEditorProps } from '@monaco-editor/react';
import {
  FileText,
  Save,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Columns,
  Rows,
  ShieldCheck,
} from 'lucide-react';

import {
  openFileWithPicker,
  readFileObject,
  saveFileWithHandle,
  downloadFileContent,
  isFileSystemAccessSupported,
} from './core/fileStorage';
import type { OpenedFile } from './core/fileStorage';
import { detectLanguage } from './utils/languageDetector';
import { areTextsEqual, type NormalizeOptions } from './utils/textNormalizer';
import './App.css';

interface FileState {
  name: string;
  content: string;
  handle?: FileSystemFileHandle;
  lastModified?: number;
  isDirty: boolean;
  size: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'warning' | 'error';
}

const DEFAULT_LEFT_DEMO = `// WebMerge: 左側ファイル（Original）
// ここにローカルファイルをドラッグ＆ドロップするか、「ファイルを開く」をクリックしてください。

function calculateTotal(price: number, taxRate: number): number {
  const tax = price * taxRate;
  return price + tax;
}

const config = {
  appName: "WebMerge",
  version: "0.1.0",
  mode: "development",
  enableLogging: true,
};
`;

const DEFAULT_RIGHT_DEMO = `// WebMerge: 右側ファイル（Modified）
// 直接エディタを編集して「上書き保存」を押すと、ローカルファイルを直接更新できます。

function calculateTotal(price: number, taxRate: number, discount: number = 0): number {
  const discountedPrice = price - discount;
  const tax = discountedPrice * taxRate;
  return discountedPrice + tax;
}

const config = {
  appName: "WebMerge",
  version: "0.1.0",
  mode: "production",
  enableLogging: false,
};
`;

export const App: React.FC = () => {
  const [leftFile, setLeftFile] = useState<FileState>({
    name: 'left_sample.ts',
    content: DEFAULT_LEFT_DEMO,
    isDirty: false,
    size: DEFAULT_LEFT_DEMO.length,
  });

  const [rightFile, setRightFile] = useState<FileState>({
    name: 'right_sample.ts',
    content: DEFAULT_RIGHT_DEMO,
    isDirty: false,
    size: DEFAULT_RIGHT_DEMO.length,
  });

  // Diff Options
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState(true);
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>({
    ignoreLineEndings: true,
    ignoreLeadingTrailingWhitespace: false,
    ignoreBlankLines: false,
  });

  // UI States
  const [dragSide, setDragSide] = useState<'left' | 'right' | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Hidden inputs for fallback file selection
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  // Diff Editor instance ref
  const diffEditorRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 言語の自動検出（左または右のファイル名から判定）
  const language = detectLanguage(rightFile.name || leftFile.name);

  // 差分が一致しているかどうかの判定
  const isMatch = areTextsEqual(leftFile.content, rightFile.content, {
    ignoreLineEndings: normalizeOptions.ignoreLineEndings,
    ignoreLeadingTrailingWhitespace: ignoreTrimWhitespace,
    ignoreBlankLines: normalizeOptions.ignoreBlankLines,
  });

  // ファイルオープン処理
  const handleOpenFile = async (side: 'left' | 'right') => {
    if (isFileSystemAccessSupported()) {
      try {
        const opened = await openFileWithPicker();
        if (opened) {
          updateFileState(side, opened);
          showToast(`${side === 'left' ? '左' : '右'}のファイル「${opened.name}」を開きました`);
        }
      } catch (err: any) {
        showToast(`ファイル読み込みエラー: ${err.message}`, 'error');
      }
    } else {
      // フォールバック
      if (side === 'left') {
        leftInputRef.current?.click();
      } else {
        rightInputRef.current?.click();
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const opened = await readFileObject(file);
      updateFileState(side, opened);
      showToast(`${side === 'left' ? '左' : '右'}のファイル「${opened.name}」を開きました`);
    }
    e.target.value = '';
  };

  const updateFileState = (side: 'left' | 'right', opened: OpenedFile) => {
    const nextState: FileState = {
      name: opened.name,
      content: opened.content,
      handle: opened.handle,
      lastModified: opened.lastModified,
      isDirty: false,
      size: opened.size,
    };
    if (side === 'left') {
      setLeftFile(nextState);
    } else {
      setRightFile(nextState);
    }
  };

  // 保存処理
  const handleSave = async (side: 'left' | 'right') => {
    const target = side === 'left' ? leftFile : rightFile;

    // 現在のエディタ最新値を取得
    const currentContent =
      diffEditorRef.current && (side === 'left' ? diffEditorRef.current.getOriginalEditor().getValue() : diffEditorRef.current.getModifiedEditor().getValue());
    const contentToSave = currentContent ?? target.content;

    if (target.handle) {
      try {
        const result = await saveFileWithHandle(target.handle, contentToSave, target.lastModified);
        if (result.conflict) {
          const proceed = window.confirm(
            'ファイルが外部ツール（エディタやGitなど）によって変更されています！\n上書きしますか？'
          );
          if (proceed) {
            const forceResult = await saveFileWithHandle(target.handle, contentToSave);
            updateSavedState(side, contentToSave, forceResult.newLastModified);
            showToast(`${side === 'left' ? '左' : '右'}のファイルを強制上書き保存しました`, 'warning');
          }
        } else {
          updateSavedState(side, contentToSave, result.newLastModified);
          showToast(`${side === 'left' ? '左' : '右'}のローカルファイルを直接上書き保存しました！`, 'success');
        }
      } catch (err: any) {
        showToast(`保存に失敗しました: ${err.message}`, 'error');
      }
    } else {
      // ハンドルがない場合はBlobダウンロード保存
      downloadFileContent(target.name, contentToSave);
      updateSavedState(side, contentToSave);
      showToast(`「${target.name}」をダウンロード保存しました`, 'success');
    }
  };

  const updateSavedState = (side: 'left' | 'right', newContent: string, newLastModified?: number) => {
    if (side === 'left') {
      setLeftFile((prev) => ({
        ...prev,
        content: newContent,
        isDirty: false,
        lastModified: newLastModified ?? prev.lastModified,
      }));
    } else {
      setRightFile((prev) => ({
        ...prev,
        content: newContent,
        isDirty: false,
        lastModified: newLastModified ?? prev.lastModified,
      }));
    }
  };

  // マージ操作（左から右へ、右から左へ）
  const handleMerge = (direction: 'leftToRight' | 'rightToLeft') => {
    if (!diffEditorRef.current) return;
    const originalEditor = diffEditorRef.current.getOriginalEditor();
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();

    if (direction === 'leftToRight') {
      const originalValue = originalEditor.getValue();
      modifiedEditor.setValue(originalValue);
      setRightFile((prev) => ({ ...prev, content: originalValue, isDirty: true }));
      showToast('左側の内容を右側へマージ（コピー）しました');
    } else {
      const modifiedValue = modifiedEditor.getValue();
      originalEditor.setValue(modifiedValue);
      setLeftFile((prev) => ({ ...prev, content: modifiedValue, isDirty: true }));
      showToast('右側の内容を左側へマージ（コピー）しました');
    }
  };

  // ドラッグ＆ドロップハンドラ
  const handleDragOver = (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(side);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(null);
  };

  const handleDrop = async (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setDragSide(null);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const item = items[0];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          // Chromium で FileSystemHandle が取れるか試行
          let handle: FileSystemFileHandle | undefined;
          if ('getAsFileSystemHandle' in item) {
            handle = (await (item as any).getAsFileSystemHandle()) as FileSystemFileHandle;
          }
          const opened = await readFileObject(file, handle);
          updateFileState(side, opened);
          showToast(`${side === 'left' ? '左' : '右'}に「${opened.name}」を読み込みました`);
        }
      }
    }
  };

  // Monaco Editorマウント時
  const handleEditorDidMount: DiffEditorProps['onMount'] = (editor) => {
    diffEditorRef.current = editor;

    // 左（Original）と右（Modified）の両方を編集可能にする
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.onDidChangeModelContent(() => {
      setLeftFile((prev) => ({ ...prev, isDirty: true }));
    });

    modifiedEditor.onDidChangeModelContent(() => {
      setRightFile((prev) => ({ ...prev, isDirty: true }));
    });
  };

  return (
    <div className="app-container">
      {/* 隠しinput */}
      <input
        type="file"
        ref={leftInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileInputChange(e, 'left')}
      />
      <input
        type="file"
        ref={rightInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileInputChange(e, 'right')}
      />

      {/* ヘッダー */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">
            <ArrowRightLeft size={20} />
            <span>WebMerge</span>
          </div>
          <span className="brand-badge">Local-First</span>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <ShieldCheck size={14} color="#10b981" />
            <span>Zero-Server / 完全ローカル処理</span>
          </div>
          <div className="stat-item">
            {isMatch ? (
              <span className="stat-diff-tag equal">
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                差分なし (一致)
              </span>
            ) : (
              <span className="stat-diff-tag different">
                <AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
                差分あり
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ツールバー */}
      <div className="app-toolbar">
        {/* 左側ファイル操作 */}
        <div className="toolbar-group">
          <button className="btn-secondary" onClick={() => handleOpenFile('left')}>
            <FolderOpen size={14} /> 左を開く
          </button>
          <div className="file-pane-info" title={leftFile.name}>
            <FileText size={14} color="#60a5fa" />
            <span className="file-name-text">{leftFile.name}</span>
            {leftFile.isDirty && <span className="file-dirty-dot" title="未保存の変更があります" />}
          </div>
          <button className="btn-success" onClick={() => handleSave('left')} title="ローカルファイルに直接上書き保存">
            <Save size={14} /> 左を保存
          </button>
        </div>

        {/* マージアクション */}
        <div className="toolbar-group">
          <button
            className="btn-secondary"
            onClick={() => handleMerge('rightToLeft')}
            title="右の内容をすべて左へコピー"
          >
            <ArrowLeft size={14} /> 左へマージ
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleMerge('leftToRight')}
            title="左の内容をすべて右へコピー"
          >
            右へマージ <ArrowRight size={14} />
          </button>
        </div>

        {/* 右側ファイル操作 */}
        <div className="toolbar-group">
          <button className="btn-success" onClick={() => handleSave('right')} title="ローカルファイルに直接上書き保存">
            <Save size={14} /> 右を保存
          </button>
          <div className="file-pane-info" title={rightFile.name}>
            <FileText size={14} color="#38bdf8" />
            <span className="file-name-text">{rightFile.name}</span>
            {rightFile.isDirty && <span className="file-dirty-dot" title="未保存の変更があります" />}
          </div>
          <button className="btn-secondary" onClick={() => handleOpenFile('right')}>
            <FolderOpen size={14} /> 右を開く
          </button>
        </div>

        {/* 比較オプション */}
        <div className="toolbar-group">
          <button
            className={`btn-toggle ${ignoreTrimWhitespace ? 'active' : ''}`}
            onClick={() => setIgnoreTrimWhitespace(!ignoreTrimWhitespace)}
            title="行頭・行末の空白の差分を無視"
          >
            空白無視: {ignoreTrimWhitespace ? 'ON' : 'OFF'}
          </button>
          <button
            className={`btn-toggle ${normalizeOptions.ignoreLineEndings ? 'active' : ''}`}
            onClick={() =>
              setNormalizeOptions((prev) => ({ ...prev, ignoreLineEndings: !prev.ignoreLineEndings }))
            }
            title="改行コード(CRLF/LF)の違いを無視"
          >
            改行無視: {normalizeOptions.ignoreLineEndings ? 'ON' : 'OFF'}
          </button>
          <button
            className={`btn-toggle ${renderSideBySide ? 'active' : ''}`}
            onClick={() => setRenderSideBySide(!renderSideBySide)}
            title="サイドバイサイド(横並び) / インライン表示の切り替え"
          >
            {renderSideBySide ? <Columns size={14} /> : <Rows size={14} />}
            {renderSideBySide ? '左右分割' : 'インライン'}
          </button>
        </div>
      </div>

      {/* エディタメイン領域 */}
      <main className="editor-main">
        {/* 左側ドロップゾーン */}
        <div
          className={`drop-side ${dragSide === 'left' ? 'dragover' : ''}`}
          style={{ display: dragSide === 'left' ? 'flex' : 'none', position: 'absolute', left: 0, width: '45%', height: '80%', zIndex: 50 }}
          onDragOver={(e) => handleDragOver(e, 'left')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'left')}
        >
          <FolderOpen size={48} color="#60a5fa" />
          <h3>左側のファイルをここにドロップ</h3>
        </div>

        {/* 右側ドロップゾーン */}
        <div
          className={`drop-side ${dragSide === 'right' ? 'dragover' : ''}`}
          style={{ display: dragSide === 'right' ? 'flex' : 'none', position: 'absolute', right: 0, width: '45%', height: '80%', zIndex: 50 }}
          onDragOver={(e) => handleDragOver(e, 'right')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'right')}
        >
          <FolderOpen size={48} color="#38bdf8" />
          <h3>右側のファイルをここにドロップ</h3>
        </div>

        <div
          className="diff-wrapper"
          onDragOver={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
              setDragSide('left');
            } else {
              setDragSide('right');
            }
          }}
        >
          <DiffEditor
            height="100%"
            language={language}
            original={leftFile.content}
            modified={rightFile.content}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              readOnly: false,
              originalEditable: true,
              renderSideBySide,
              ignoreTrimWhitespace,
              automaticLayout: true,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              diffCodeLens: true,
            }}
          />
        </div>
      </main>

      {/* ステータスバー */}
      <footer className="app-statusbar">
        <div className="statusbar-group">
          <span className="statusbar-item">
            言語: <strong>{language}</strong>
          </span>
          <span className="statusbar-item">
            文字コード: <strong>UTF-8</strong>
          </span>
          <span className="statusbar-item">
            直接上書き: <strong>{isFileSystemAccessSupported() ? '有効 (File System Access)' : 'ダウンロード保存'}</strong>
          </span>
        </div>

        <div className="statusbar-group">
          <span className="statusbar-item">
            左: {leftFile.content.split('\n').length} 行 ({leftFile.size} bytes)
          </span>
          <span className="statusbar-item">
            右: {rightFile.content.split('\n').length} 行 ({rightFile.size} bytes)
          </span>
        </div>
      </footer>

      {/* トースト通知 */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'warning' && <AlertCircle size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
