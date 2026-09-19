# Gyokuto株式会社 コーポレートサイト

Gyokuto株式会社の静的コーポレートサイトです。HTML / CSS / JavaScriptのみで構成しており、GitHub Pagesで公開できます。

## ファイル構成

- `index.html`: トップページ
- `services.html`: 事業内容
- `ai-it-consulting.html`: AIコンサルティング事業
- `bpo.html`: BPO事業
- `web-services.html`: IT戦略・システム開発事業
- `ecommerce.html`: 旧URL向けの事業内容案内
- `company.html`: 会社概要
- `contact.html`: お問い合わせ
- `privacy.html`: プライバシーポリシー
- `thanks.html`: お問い合わせ完了ページ
- `styles.css`: 共通スタイル
- `script.js`: スマートフォン向けメニュー
- `assets/hero-operations.png`: ヒーロー画像

## GitHub Pagesでの公開手順

1. このフォルダの内容をGitHubリポジトリへ追加します。
2. GitHubのリポジトリ画面で `Settings` を開きます。
3. `Pages` を開き、`Build and deployment` の `Source` を `Deploy from a branch` にします。
4. 公開するブランチを選び、フォルダは `/root` を指定します。
5. 表示された公開URLへアクセスし、各ページの表示とリンクを確認します。

## 公開前の確認

- `company.html` の所在地、法人番号、代表電話番号を必要に応じて確認します。
- `contact.html` のフォームは外部フォーム送信サービスを経由して、入力内容を受付メールアドレスへ送る構成です。公開前に一度テスト送信し、送信先メールアドレス側で有効化メールが届いた場合は承認してください。
- 独自ドメイン `corp.gyokuto-inc.com` を使う場合は、GitHub Pages側のCustom domain設定とDNS設定を行ってください。
