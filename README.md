# WebMerge 🔀

> A high-performance, browser-native, local-first file & folder diff/merge tool.

WebMerge is an open-source web application designed to bring the power of WinMerge to any platform (macOS, Linux, ChromeOS, Windows) with zero installation, zero server communication, and direct local file saving via the File System Access API.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-webmerge.org-6366f1?style=for-the-badge&logo=cloudflare&logoColor=white)](https://webmerge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Zero-Server](https://img.shields.io/badge/Zero--Server-100%25_Local--First-10B981?style=for-the-badge)](https://webmerge.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

🚀 **[Experience Live Demo Instantly!](https://webmerge.org/)** _(Zero installation required)_

[日本語ドキュメント (Japanese Document)](./README_ja.md)

---

## 🤖 AI-Agent & Copilot Friendly (Contributions Welcome!)

WebMerge was built from scratch in record time, heavily leveraging high-reasoning AI architectures. We fully embrace the future of AI-assisted software development.

- **AI Contributions are highly welcomed!**
- Feel free to feed this entire codebase, components, or types into your favorite AI assistants (Cursor, GitHub Copilot, Antigravity, Gemini, etc.).
- We highly encourage you to let your AI agents generate Pull Requests for optimizing hashing performance, adding shortcuts, or fixing edge cases.

## ✨ Features

- 🔒 **100% Local-First & Zero-Server**: No code or file data ever leaves your machine. Completely private and safe for proprietary code.
- 💾 **Direct In-Place Saving & Folder Syncing**: Directly edit, save changes, and sync files/folders back to your local storage using the File System Access API with live handle tracking.
  - **Bi-directional Copying**: Copy individual files or entire folder trees from Left to Right or Right to Left with single clicks.
  - **Real-Time Reactive Updates**: Tree item statuses switch instantly from "Modified" to "Identical" upon copy completion without page reload.
  - **Safe Deletion & Warning Modals**: Delete one-sided or matched files with VS Code-styled confirmation modals (displaying file counts) to prevent accidental data loss.
  - **Live Handle Tracking**: Copied files immediately maintain fresh target `FileSystemFileHandle`s for direct in-place editing.
- 📁 **Folder & Directory Diff**: Recursively compare directories with real-time status indicators (Identical, Modified, Left Only, Right Only).
- ⚡ **Background Worker Scanning & SHA-256 Hashing**: Keeps the UI responsive at 60 FPS while computing fast cryptographic hashes to detect true content differences regardless of timestamps.
- 📜 **Virtual Scrolling List**: Seamless 60 FPS rendering of 10,000+ files with low memory footprint.
- 🔤 **Automatic Character Encoding Detection**: Automatically detects and decodes Shift-JIS (CP932), EUC-JP, UTF-8, and UTF-16 with BOM.
- 🖼️ **Image Diff Viewer**: Visual comparison for PNG, JPG, WebP, SVG, and GIF with Swipe slider, Side-by-Side, Onion Skin, and Difference blend modes.
- 📄 **Diff Export**: Export standalone, self-contained HTML diff reports or standard Unified Diff (`.patch`) files.
- 📱 **PWA & Offline Ready**: Installable as a desktop web app with complete offline capability via Service Worker.
- 🧠 **Monaco Diff Editor Core**: Powered by VS Code's diff editor with syntax highlighting, inline/side-by-side view, diff jumping (F7 / Shift+F7), and bi-directional editing.
- 🎛️ **WinMerge Options**: Ignore whitespaces, normalize CRLF/LF line endings, and filter out `.git`, `node_modules`, etc.
- 🌐 **Internationalization (i18n)**: English (default) and Japanese built-in.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- Modern browser with File System Access API support (Google Chrome, Microsoft Edge, Opera, or Chromium-based browsers)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/mahorobalab/web-merge.git
cd web-merge

# Install dependencies
npm install

# Start development server (or press F5 in VS Code to debug launch directly)
npm run dev
```

> **💡 Debugging in VS Code / Antigravity:**
> Simply press **`F5`** to automatically launch the Vite dev server and open a Chrome or Edge debugging session.

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## 🔒 Running Completely Offline (Zero-Server / Local Standalone)

WebMerge is designed from the ground up to run completely isolated from external networks (ideal for corporate intranets, air-gapped environments, or confidential source code reviews).

### Option 1: Standalone Offline Package (No Node.js Required!) 📦

If you don't want to install Node.js, download the pre-built bundle from GitHub Releases:

1. Download `web-merge-offline.zip` from **[Releases](https://github.com/mahorobalab/web-merge/releases)**.
2. Unzip the package to any folder.
3. Launch with Python 3 (standard library only, zero dependencies):
   - **Windows**: Double-click **`start.bat`** (or run `python serve.py`)
   - **macOS / Linux**: Run `./start.sh` (or `python3 serve.py`)
4. Your default browser will automatically open at `http://localhost:8000` with WebMerge running 100% locally.

### Option 2: Local Server from Source (`python serve.py`) 🐍

If you've cloned this repository:

```bash
# 1. Build the production assets once
npm run build

# 2. Run the included zero-dependency Python server
python serve.py
# (or double-click start.bat on Windows, or ./start.sh on macOS/Linux)
```

> **💡 Smart Build Assistant:**
> If `./dist` hasn't been built yet, running `python serve.py` will automatically detect your local `npm` and prompt you to run `npm run build` on the fly!

### Option 3: Install as PWA (Desktop App) 📱

1. Visit **[Live WebMerge](https://webmerge.org/)** in Google Chrome or Microsoft Edge.
2. Click the **Install** icon in the browser address bar.
3. WebMerge is now installed on your desktop and works fully offline even when disconnected from the internet!

---

## 📜 License

MIT License
