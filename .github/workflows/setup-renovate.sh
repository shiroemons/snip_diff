#!/bin/bash
set -e

echo "🔧 自己ホスト型Renovate セットアップスクリプト"
echo ""

# 1. GitHub CLIのインストール確認
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) がインストールされていません"
    echo "インストール方法: https://cli.github.com/"
    exit 1
fi

# 2. 認証確認
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLIで認証されていません"
    echo "実行してください: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI 認証済み"
echo ""

# 3. Personal Access Tokenの作成
echo "📝 Personal Access Token (PAT) を作成します"
echo ""
echo "必要なスコープ:"
echo "  - repo (Full control of private repositories)"
echo "  - workflow (Update GitHub Action workflows)"
echo ""

# GitHub CLIで新しいトークンを作成
echo "PATを作成中..."
TOKEN=$(gh auth token)

if [ -z "$TOKEN" ]; then
    echo "❌ トークンの取得に失敗しました"
    echo ""
    echo "手動で作成してください:"
    echo "1. https://github.com/settings/tokens/new にアクセス"
    echo "2. Note: 'Renovate Self-hosted'"
    echo "3. Scopes: repo, workflow"
    echo "4. Generate token をクリック"
    echo ""
    read -p "作成したトークンを入力してください: " TOKEN
fi

# 4. GitHub Secretsに登録
echo ""
echo "🔐 RENOVATE_TOKEN をGitHub Secretsに登録中..."
echo "$TOKEN" | gh secret set RENOVATE_TOKEN

if [ $? -eq 0 ]; then
    echo "✅ RENOVATE_TOKEN を登録しました"
else
    echo "❌ RENOVATE_TOKEN の登録に失敗しました"
    exit 1
fi

# 5. GitHub App Renovateの無効化について
echo ""
echo "⚠️  GitHub App Renovateの無効化"
echo ""
echo "以下のURLにアクセスして、Renovate Appを無効化してください:"
echo "https://github.com/settings/installations"
echo ""
echo "手順:"
echo "1. 'Renovate' アプリを見つける"
echo "2. 'Configure' をクリック"
echo "3. 'Repository access' で 'snip_diff' のチェックを外す"
echo "4. 'Save' をクリック"
echo ""

read -p "GitHub App Renovateを無効化しましたか? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo ""
    echo "⚠️  GitHub App Renovateを無効化してから再度実行してください"
    exit 1
fi

# 6. 完了
echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. このブランチをマージ"
echo "2. GitHub Actions の 'Renovate' ワークフローを手動実行して動作確認"
echo "   URL: https://github.com/shiroemons/snip_diff/actions/workflows/renovate.yml"
echo ""
