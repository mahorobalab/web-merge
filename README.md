# WebMerge 🔀

> A high-performance, browser-native, local-first file & folder diff/merge tool.

WebMerge is an open-source web application designed to bring the power of WinMerge to any platform (macOS, Linux, ChromeOS, Windows) with zero installation, zero server communication, and direct local file saving via the File System Access API.

[日本語ドキュメント (Japanese Document)](./README_ja.md)

---

## ✨ Features

- 🔒 **100% Local-First & Zero-Server**: No code or file data ever leaves your machine. Completely private and safe for proprietary code.
- 💾 **Direct In-Place Saving**: Directly edit and save changes back to your local files using the File System Access API.
- 📁 **Folder & Directory Diff**: Recursively compare directories with real-time status indicators (Identical, Modified, Left Only, Right Only).
- ⚡ **Background Worker Scanning**: Keeps the UI responsive at 60 FPS even when scanning large directory structures.
- 🧠 **Monaco Diff Editor Core**: Powered by VS Code's diff editor with syntax highlighting, inline/side-by-side view, and bi-directional editing.
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
git clone https://github.com/your-username/web-merge.git
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
