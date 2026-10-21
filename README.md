# WebMerge 🔀

> A high-performance, browser-native, local-first file & folder diff/merge tool.

WebMerge is an open-source web application designed to bring the power of WinMerge to any platform (macOS, Linux, ChromeOS, Windows) with zero installation, zero server communication, and direct local file saving via the File System Access API.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-web--merge.mahorobalab.workers.dev-6366f1?style=for-the-badge&logo=cloudflare&logoColor=white)](https://web-merge.mahorobalab.workers.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Zero-Server](https://img.shields.io/badge/Zero--Server-100%25_Local--First-10B981?style=for-the-badge)](https://web-merge.mahorobalab.workers.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

🚀 **[Experience Live Demo Instantly!](https://web-merge.mahorobalab.workers.dev/)** _(Zero installation required)_

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

# Start development server
npm run dev
```

### Running Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

---

## 📜 License

MIT License
