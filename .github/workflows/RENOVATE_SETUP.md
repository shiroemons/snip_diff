# 自己ホスト型Renovate セットアップ手順

このプロジェクトでは、GitHub ActionsでRenovateを自己ホストしています。

## 初回セットアップ

### 方法1: 自動セットアップ（推奨）

セットアップスクリプトを実行：

```bash
./.github/workflows/setup-renovate.sh
```

このスクリプトは以下を自動で行います：
- GitHub CLI認証の確認
- Personal Access Token (PAT) の作成支援
- GitHub Secretsへの `RENOVATE_TOKEN` 登録
- GitHub App Renovate無効化の案内

### 方法2: 手動セットアップ

#### 1. GitHub Personal Access Token (PAT) を作成

1. https://github.com/settings/tokens/new にアクセス
2. Note: `Renovate Self-hosted`
3. 以下のスコープを選択：
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. "Generate token" をクリックしてトークンをコピー

#### 2. GitHub Secretsに登録

```bash
# ghコマンドを使用
echo "YOUR_PERSONAL_ACCESS_TOKEN" | gh secret set RENOVATE_TOKEN
```

または、GitHubのWeb UIから：
1. リポジトリの Settings → Secrets and variables → Actions
2. "New repository secret" をクリック
3. Name: `RENOVATE_TOKEN`
4. Secret: 上記で生成したPAT

#### 3. GitHub App Renovateを無効化

1. https://github.com/settings/installations にアクセス
2. "Renovate" アプリを見つける
3. "Configure" をクリック
4. "Repository access" で `snip_diff` のチェックを外す
5. "Save" をクリック

## 動作確認

### 手動実行

1. GitHub リポジトリの "Actions" タブを開く
2. "Renovate" ワークフローを選択
3. "Run workflow" をクリック
4. Log level を選択（デフォルトは "debug"）
5. "Run workflow" を実行

### スケジュール実行

- 毎日午前9時（UTC）= 日本時間18時に自動実行されます
- cronの設定: `.github/workflows/renovate.yml` の `schedule` を変更

## トラブルシューティング

### Renovateが実行されない

1. `RENOVATE_TOKEN` が正しく設定されているか確認
2. PATの権限が適切か確認（`repo`, `workflow`）
3. GitHub App Renovateが無効化されているか確認

### PRが作成されない

1. Actionsタブでログを確認
2. Log levelを "debug" に変更して再実行
3. `renovate.json` の設定を確認

### postUpgradeTasksが実行されない

1. `allowedPostUpgradeCommands` にコマンドが登録されているか確認
2. コマンドが正規表現にマッチするか確認
3. `fileFilters` にファイルが含まれているか確認

## 参考資料

- [Renovate GitHub Action](https://github.com/renovatebot/github-action)
- [Renovate Configuration Options](https://docs.renovatebot.com/configuration-options/)
- [Post-upgrade tasks](https://docs.renovatebot.com/configuration-options/#postupgradetasks)
