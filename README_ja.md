# WebMerge 🔀

> ブラウザ完結型・ローカルファーストのファイル＆フォルダ差分比較/マージツール

WebMerge は、WinMerge の強力な比較・マージ機能を、インストール不要・外部通信ゼロでどのOS（macOS, Linux, ChromeOS, Windows）でも利用可能にするオープンソースWebアプリケーションです。

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-web--merge.mahorobalab.workers.dev-6366f1?style=for-the-badge&logo=cloudflare&logoColor=white)](https://web-merge.mahorobalab.workers.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![Zero-Server](https://img.shields.io/badge/完全ローカル-Zero--Server-10B981?style=for-the-badge)](https://web-merge.mahorobalab.workers.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

🚀 **[インストール不要！今すぐライブデモを体験](https://web-merge.mahorobalab.workers.dev/)**

[English Document](./README.md)

---

## 🤖 AIエージェント・Copilot大歓迎！（開発コミットについて）

WebMerge は、高い推論能力を持つ現代のAIアーキテクチャ（Antigravity、Gemini、GitHub Copilotなど）をフル活用し、個人開発でありながら驚異的なスピードで構築されました。私たちは、AIを相棒とした次世代のソフトウェア開発の形を全面的に支持・歓迎しています。

- **AIによる開発コミットを大歓迎します！**
- リポジトリのコード全体やコンポーネント、型定義をご自身の使い慣れたAIアシスタント（Cursor、Copilot、Geminiなど）にそのまま読み込ませて開発を行ってください。
- 「ハッシュ計算のさらなる高速化」「便利なショートカットキーの追加」「ニッチなエッジケースの修正」など、**あなたのAIエージェントにパッチやPull Requestを生成させて、そのまま投げていただくことを強く推奨**しています。

## ✨ 主な機能

- 🔒 **完全ローカル完結（Zero-Server）**: ファイルやソースコードは外部サーバーへ一切送信されず、すべてブラウザ内で安全に処理されます。機密情報や社内コードも安心。
- 💾 **直接ローカル上書き保存 & フォルダ間同期（マージ）**: File System Access API を活用し、ローカルファイルへの直接書き込みとフォルダ同期を実現。
  - **双方向コピー＆同期**: 左から右、右から左へ、ファイルまたはフォルダツリー全体をワンクリックでコピー。
  - **リアルタイムなステータス自動更新**: コピー完了と同時にツリーの該当行が「テキストファイルは異なります」から「同一（テキストファイルは同一です）」に瞬時に切り替わり、差分カウントも自動減少。
  - **安全な削除＆確認ダイアログ**: 片側のみのファイル削除や両側削除に対応。フォルダコピー時や上書き・削除時には件数表示付きのVS Code風ダークテーマ確認ダイアログが表示され、誤操作を防止。
  - **Handle追従**: コピー後のファイルもコピー先の `FileSystemFileHandle` を正確に保持するため、そのままエディタで直接上書き保存が可能。
- 📁 **フォルダ丸ごと比較**: ディレクトリを再帰的に走査し、ファイルの一致・変更・左右の片側存在をリアルタイム判定。
- ⚡ **Web Workerによる非同期スキャン & SHA-256ハッシュ比較**: 大規模フォルダでもUIを60FPSに維持しつつ、タイムスタンプに惑わされず真の内容一致を高速判定。
- 📜 **仮想スクロール（Virtual Scroll）**: 10,000件以上のファイルでもメモリ圧迫なく高速表示。
- 🔤 **文字コード自動判定（Shift-JIS / EUC-JP / UTF-8）**: 日本のレガシー開発環境に多いShift-JISやEUC-JP、UTF-16(BOM)も自動検出・文字化けなしでデコード。
- 🖼️ **画像比較（Image Diff Viewer）**: PNG, JPG, WebP, SVG, GIF等の画像をスワイプスライダー、左右並列、オニオンスキン、差分合成で視覚比較。
- 📄 **差分レポート＆パッチ出力**: 自己完結型のHTML差分レポートや、`git apply` 可能なUnified Diff (`.patch`) ファイルを直接保存。
- 📱 **PWA & 完全オフライン対応**: デスクトップアプリとしてインストール可能、ネット切断時も完全ローカル動作。
- 🧠 **Monaco Diff Editor（VS Codeコア）**: シンタックスハイライト、左右分割/インライン切り替え、差分間ジャンプ（F7 / Shift+F7）、左右双方向の直接編集をサポート。
- 🎛️ **WinMerge互換オプション**: 空白無視、改行コード（CRLF/LF）統一、除外フィルタ（`.git`, `node_modules` 等）。
- 🌐 **多言語対応（i18n）**: 英語（標準）および日本語に対応。

---

## 🚀 使い方・ローカル開発

### 前提条件

- Node.js (v20以上推奨)
- File System Access API 対応ブラウザ（Google Chrome, Microsoft Edge など）

### セットアップ

```bash
# クローン
git clone https://github.com/mahorobalab/web-merge.git
cd web-merge

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# 単体テストの実行
npm test

# プロダクションビルド
npm run build
```

---

## 📜 ライセンス

MIT License
