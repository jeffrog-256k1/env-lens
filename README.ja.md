# Env Lens

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

値をレポートに含めず、環境ごとの設定漏れを確認します。キーの契約と最大3ファイルから、ローカル CLI がオフライン比較レポートを作成します。

[試す](https://jeffrog-256k1.github.io/env-lens/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![Env Lens](assets/preview.png)

## ローカルで実行

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/env-lens.git
cd env-lens
npm ci
npm run check -- --contract examples/contract.json --env local=examples/local.env.sample --env preview=examples/preview.env.sample --out reports/review
# Static fictional demo:
npm run build
npm run dev
```

サンプルは必須値の空欄・不足があるため、意図的に**終了コード1**を返します。reports/review/index.html を直接開いてください。report.json にも値を含まない結果を保存します。--out を省略すると JSON を標準出力します。既存フォルダーは上書きしないため、新しい出力先を指定してください。デモ：http://127.0.0.1:4319。

## 仕組み

required と optional にキーを宣言し、--env 名前=パスを1〜3回指定します。設定済み・空・不足・重複・無効を区別し、キー検索と問題のみの絞り込みを利用できます。--lang は en、ko、zh-CN、ja、es に対応し、レポート内でも言語を変更できます。

終了コード **0**：ブロック項目なし。**1**：必須キーの空欄/不足、重複、構文エラー。**2**：引数・入力・契約・出力エラー。契約外のキーは警告、任意キーの空欄/不足は非ブロックです。値の比較・検証・ハッシュ化・部分表示は行いません。

```json
{ "version": 1, "required": ["APP_URL", "SESSION_SECRET"], "optional": ["LOG_LEVEL"] }
```

## 対応範囲と制限

明示的に指定した UTF-8 通常ファイルのみ、各64 KiBまで、契約と入力を合わせて200種類のキー、3環境まで。キー名は ASCII 英数字とアンダースコアで、数字開始は不可です。環境名は英数字・アンダースコア・ハイフンで32文字まで。契約には version、required、optional のみを指定できます。

KEY=value、export 接頭辞、空行、# コメント、**単一行**の引用符、末尾コメントに対応します。引用符内の # は文字です。二重引用符内のバックスラッシュを処理し、エスケープ n/r/t と空白のみは空と判定します。変数展開・コマンド実行はしません。重複は常にブロックします。閉じない引用符・複数行の値はエラーとし、**以降の解析を停止**します。完全な dotenv/フレームワークローダーではありません。

キー名・環境名・行番号は残るため、共有前に確認してください。サンプルは架空です。アップロード、クラウド同期、値の一致比較、秘密情報の保管機能はありません。

## 開発

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
