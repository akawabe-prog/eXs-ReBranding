# SEO Handoff: API用商品ページ（本番適用予定）

作成日: 2026-02-26  
対象ドメイン: `https://exs.customjapan.net`

## 1. 対象ページ
- `product-street(API用).html`
- `product-tkg(API用).html`

## 2. 現在の設定サマリ
両ページとも以下は実装済みです。
- `title`
- `meta description`
- `meta keywords`
- `canonical`（絶対URL）
- OGP (`og:type`, `og:site_name`, `og:locale`, `og:url`, `og:title`, `og:description`, `og:image`)
- Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

## 3. 重要注意点（本番SEOで最優先）
現在、両ページは以下になっています。
- `<meta name="robots" content="noindex,follow,max-image-preview:large">`

本番でこの2ページを正式公開URLとして使う場合、`noindex` のままだと検索結果に出ません。  
**公開時に `index,follow,max-image-preview:large` へ変更必須**です。

## 4. URL設計に関する注意
現状URLは `(...)` と `API用` を含みます。
- 例: `https://exs.customjapan.net/product-street(API用).html`

技術的には配信可能ですが、SEO/運用の観点では以下推奨です。
- 公開URLはASCIIのクリーンURLに統一（例: `/product-street.html`, `/product-tkg.html`）
- `API用` ファイルを実体として使う場合でも、配信ルーティング側でクリーンURLを正規URLにする

## 5. システム側への依頼事項
1. 本番で適用する最終URLを確定する（クリーンURL推奨）
2. robotsを `index,follow` に切り替える
3. canonical を最終URLへ合わせる
4. `sitemap.xml` を最終URLのみ掲載に更新（重複URLを載せない）
5. OGP画像URLを絶対URLへ統一（必要に応じて）

## 6. リリース前チェックリスト
- [ ] `view-source:` で `robots=index,follow` を確認
- [ ] `canonical` が最終公開URLと一致
- [ ] `og:url` が最終公開URLと一致
- [ ] Search Console URL検査で `インデックス登録可能` を確認
- [ ] `sitemap.xml` 送信後に対象2URLが検出される

## 7. 補足
- 現在のサイト全体で `canonical` と `og:url` は `https://exs.customjapan.net` へ統一済み。
- API用2ページは運用意図に合わせてSEO最終値（robots/canonical/sitemap）を切り替える前提です。
