# exs-mobi Hybrid Temporary Purchase Memo

最終更新: 2026-04-16

## 現在の運用（暫定）
- `exs-mobi` はハイブリッド運用。
- ただし購入導線は一時的に「API非連携のcustomjapan商品ページ」へ接続。

## 暫定の購入リンク先
- eXs Street: `https://cycle.customjapan.net/i/29044337`
- eXs 1 TKG: `https://moto.customjapan.net/i/27882603`

## この設定を入れた主な箇所
- `exs-mobi/assets/js/components.js`
- `exs-mobi/assets/js/cart-page.js`
- `exs-mobi/index.html`
- `exs-mobi/partner.html`
- `exs-mobi/developer.html`
- `exs-mobi/product/exs-street.html`
- `exs-mobi/product/exs-1-tkg.html`
- `exs-mobi/product/exs-street/purchase.html`（redirect/canonical/関連リンク）
- `exs-mobi/product/exs-1-tkg/purchase.html`（redirect/canonical/関連リンク）
- `exs-mobi/cart.html`
- `exs-mobi/sitemap.xml`

## 元の導線へ戻す手順（すぐ戻せる）
1. `exs-mobi` 配下で次を置換する。
   - `https://cycle.customjapan.net/i/29044337` → `https://exs.customjapan.net/product/exs-street/purchase`
   - `https://moto.customjapan.net/i/27882603` → `https://exs.customjapan.net/product/exs-1-tkg/purchase`
2. 置換後に以下で確認:
   - `rg -n "cycle\\.customjapan\\.net/i/29044337|moto\\.customjapan\\.net/i/27882603" exs-mobi`
   - `rg -n "https://exs\\.customjapan\\.net/product/exs-(street|1-tkg)/purchase" exs-mobi`
