# WebMerge ブランチ運用 & デプロイガイド (Branch Workflow Guide)

WebMerge プロジェクトのブランチ戦略、品質保証（CI）、および Cloudflare Workers への自動デプロイ運用フローです。

---

## 1. ブランチ運用の基本方針

| ブランチ名 | 役割 | 直接コミット/マージ | 自動デプロイ先 (Cloudflare) |
|---|---|:---:|---|
| **`main`** | 本番稼働ブランチ (Production) | **禁止** ❌ (PR経由のみ) | `https://web-merge.mahorobalab.workers.dev/`<br>*(将来の独自ドメイン)* |
| **`development`** | 常設開発ブランチ (Staging) | **推奨** ⭕ | `https://web-merge-development.mahorobalab.workers.dev/` |
| **`feature/*` / `fix/*`** | トピック・作業用ブランチ | **作業用** ⭕ | なし (ローカル作業) |

---

## 2. ローカルでの安全ガード (.githooks)

ローカル環境で誤って `main` ブランチにコミットやマージしてしまうのを防ぐため、Gitフックが組み込まれています。

- **`pre-commit`**: カレントブランチが `main` の場合、コミットを即座にブロックします。
- **`pre-merge-commit`**: カレントブランチが `main` の場合、ローカルでのマージコミットをブロックします。

> 初回クローン時やフックの再有効化は以下で自動設定されます:
> ```bash
> npm run prepare
> ```

---

## 3. 日常の開発サイクル

### ① 普段の作業（development ブランチ）
軽微な修正や通常の開発は、常設の `development` ブランチで行います。

```bash
# 開発ブランチに切り替え
git checkout development

# コード修正 & テスト実行
npm test
npx tsc -b

# コミット & プッシュ
git add .
git commit -m "feat: xxx の機能を追加"
git push origin development
```
> 🚀 **自動デプロイ**: `development` に push されると、GitHub Actions が型チェックとテストを実行し、合格すると自動的に **`https://web-merge-development.mahorobalab.workers.dev/`** にデプロイされます！

---

### ② まとまった機能開発（トピックブランチを切る場合）
大きな機能追加や実験的な変更を行う場合は、`development` からトピックブランチを切って作業します。

```bash
# 1. development からトピックブランチを作成
git checkout development
git pull origin development
git checkout -b feature/awesome-feature

# 2. 作業 & テスト
npm test

# 3. 作業完了後、development にマージして push
git checkout development
git merge feature/awesome-feature
git push origin development

# 4. 不要になった作業ブランチを削除
git branch -d feature/awesome-feature
```

---

### ③ 本番リリース（main へのマージ）
テストおよび開発環境（`web-merge-development`）での動作確認が完了したら、GitHub 上で PR を作成して `main` にマージします。

1. GitHub リポジトリ (`https://github.com/mahorobalab/web-merge`) を開きます。
2. **Pull requests** > **New pull request** をクリック。
3. `base: main` ← `compare: development` を選択して PR を作成。
4. GitHub Actions (CI) のテストが全件パスしていることを確認。
5. **Merge pull request** を実行。
6. 自動的に GitHub Actions が走り、本番環境（`https://web-merge.mahorobalab.workers.dev/`）へデプロイされます。

---

## 4. 手動デプロイコマンド (ローカルから緊急デプロイする場合)

ローカルから直接 Cloudflare Workers にデプロイすることも可能です。

```bash
# 開発環境へデプロイ (web-merge-development)
npm run deploy:dev

# 本番環境へデプロイ (web-merge)
npm run deploy
```

---

## 5. GitHub 側の推奨設定

### ① ブランチ保護ルール (Branch Protection Rule)
GitHub の Web 管理画面で `main` ブランチへの誤プッシュを確実に防ぐ設定を行います：
1. GitHub リポジトリの **Settings** > **Branches** を開く。
2. **Add branch protection rule** をクリック。
3. **Branch name pattern**: `main`
4. 以下の項目にチェックを入れる：
   - ☑ **Require a pull request before merging** (マージ前にPR必須)
   - ☑ **Require status checks to pass before merging** (CIテスト通過必須)
     - 検索窓で `Typecheck, Unit Tests & Build` を選択
   - ☑ **Do not allow bypassing the above settings** (管理者も含め直接push禁止)
5. **Create / Save changes** をクリック。

### ② GitHub Actions 用の Secrets 設定
GitHub Actions から Cloudflare Workers へ自動デプロイするために Secrets を登録します：
1. GitHub リポジトリの **Settings** > **Secrets and variables** > **Actions** を開く。
2. **New repository secret** をクリックして以下を登録：
   - `CLOUDFLARE_API_TOKEN`: Cloudflareダッシュボードの「My Profile」>「API Tokens」から「Edit Cloudflare Workers」テンプレートで発行したトークン。
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Workers ダッシュボード右側に表示される Account ID。
