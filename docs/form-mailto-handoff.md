# フォーム送信ハンドオフ（暫定 mailto 運用）

作成日: 2026-03-02  
対象ドメイン: `https://exs.customjapan.net`

## 1. 現在の暫定対応
サーバー実行環境の都合により、フォーム送信先を一旦 `mailto` に切り替えています。

- `contact.html`
- `partner-entry.html`
- `exs-api/contact.html`
- `exs-api/partner-entry.html`

変更内容:
- `action="mailto:info@customjapan.jp"`
- `method="POST"`
- `enctype="text/plain"`

## 2. 重要注意点
- `mailto` はユーザーのメールクライアント依存のため、送信体験が不安定です。
- ブラウザ/端末によっては期待通りに起動しない場合があります。
- スパム対策、バリデーション、送信ログ、再送制御が弱くなります。

## 3. 本来の推奨
**PHPで対応可能なら、PHP送信（サーバー送信）へ戻すことを推奨**します。

現状、以下PHPは実装済みのため、環境が整えば復帰可能です。
- `contact.php`
- `partner-entry.php`
- `exs-api/contact.php`
- `exs-api/partner-entry.php`

復帰時の戻し先:
- `contact` フォーム: `action="contact.php"`
- `partner-entry` フォーム: `action="partner-entry.php"`

## 4. 復帰時チェック
- PHP実行可否（Webサーバー + PHP-FPM / mod_php）
- `mb_send_mail` / `mail` の送信可否
- 送信元ドメイン設定（SPF/DKIM/DMARC）
- `thanks` / `form-error` への遷移確認
- 送信テスト（PC/スマホ）
