# AGENTS.md - WebMerge Development Guidelines

This document outlines the guidelines, architecture principles, testing standards, and operational rules for AI agents and human contributors developing WebMerge (a browser-native, local-first file/folder diff and merge tool).

---

## 1. Project Overview & Core Mission

- **Product Name**: WebMerge
- **Purpose**:
  - Provide an installation-free, WinMerge-like file and folder diff/merge tool that runs instantly in modern browsers.
  - Solve the lack of free, high-performance, GUI-based folder diff tools, especially for macOS, Linux, and ChromeOS users.
- **Core Values**:
  - **Local-First & Zero-Server**: Zero external server transmissions. All processing stays entirely in the client browser.
  - **Direct In-Place Saving**: Leverage the File System Access API to directly edit and overwrite local files.
  - **High Performance & Low Memory**: Prevent UI freezing on thousands of files using Web Workers and WebAssembly (Rust).

---

## 2. Technology Stack

- **Core Runtime**: TypeScript, React, Vite
- **Internationalization (i18n)**: English (default) and Japanese built-in support
- **Styling**: CSS Modules / Vanilla CSS (refined modern UI, VS Code-like dark theme by default)
- **Editor / Diff Engine**: Monaco Editor
- **Testing**:
  - Unit & Integration Testing: **Vitest**
  - E2E Testing: **Playwright** (from Phase 2 onwards)
- **High-Performance Core (Phase 3+)**: Rust + `wasm-bindgen` (xxHash3 / Fast Myers diff)
- **I/O API**: File System Access API (`showOpenFilePicker`, `showDirectoryPicker`, `FileSystemFileHandle`)

---

## 3. Architecture Principles

### ① Defend the Main Thread (UI)
- Never perform heavy tasks (directory traversal, file hashing, large diff calculations) on the main thread.
- Delegate all heavy operations to **Web Workers**, reporting progress (`progress: number`, scanned count) to the main thread via `postMessage`.

### ② On-Demand Loading (Lazy Loading) & Memory Guard
- Never read all file contents into memory at once during folder comparison (to prevent exceeding the ~2GB browser tab memory limit).
- Store only metadata (path, file size, last modified, file handle, hash) during scans. Read full file contents only when the user selects a file pair from the tree/list.

### ③ Pure Functions for Core Logic
- Isolate all core algorithms ("ignore whitespace", "normalize line endings (CRLF/LF)", "character encoding detection", "line/word diff calculation") into pure functions separated from UI components and the editor.
- Pure functions ensure 100% headless unit testability with Vitest and ease future Rust/Wasm migrations.

---

## 4. Testing Strategy (TDD & Quality Assurance)

Contributors and agents must always create and update tests alongside new features and logic changes.

1. **Test-First / Parallel Tests (Vitest)**:
   - Always create a corresponding `.test.ts` for any utility in `src/utils/` or `src/core/`.
   - Cover boundary conditions (empty strings, trailing newlines only, mixed Windows/Unix line endings, whitespaces).
2. **Verify Clean Test Run Before Commits**:
   - Ensure all tests pass (`npm test`) and type checking succeeds (`tsc --noEmit`) before committing.

---

## 5. Git & Commit Guidelines

Develop incrementally with small, focused commits.

- **Commit Convention**: Conventional Commits specification
  - `feat:` New features
  - `fix:` Bug fixes
  - `test:` Adding or updating tests
  - `refactor:` Code refactoring without behavior change
  - `docs:` Documentation updates
  - `chore:` Build scripts, dependencies, configuration
- **Commit Unit**:
  - Group one feature + its unit tests or distinct documentation changes per commit.

---

## 6. UI/UX & Code Quality Principles

- Maintain clean, professional, English-based code comments across all source files.
- Deliver a premium, sleek developer tool aesthetic inspired by VS Code.
- Support internationalization: default to English (`en`), with seamless support for Japanese (`ja`).

---

## 7. Code Organization & Proactive Refactoring Rule

- **Proactive Modularization**: Agents must proactively organize and refactor code into clean functional modules, custom hooks, and sub-components without waiting for explicit user instructions.
- **File Size Guideline (~1,000 Lines Threshold)**:
  - When any file approaches or exceeds ~1,000 lines (e.g. `App.tsx` or large complex views), proactively decompose it into custom hooks (`src/hooks/`), focused sub-components (`src/components/`), or dedicated pure utility modules (`src/utils/`).
  - Keep `App.tsx` lightweight (ideally under 300–400 lines) functioning primarily as an orchestration and layout layer.
- **Zero-Regression Guarantee**:
  - Always verify that all existing Vitest unit tests pass (`npm test`) and type checking succeeds (`tsc -b`) before and after refactoring.
