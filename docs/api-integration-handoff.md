# eXs ハンドオフ資料（要点版）

最終更新: 2026-03-02（latest）  
対象環境: `https://exs.customjapan.net`  
公開構成: `exs-api/` 配下をアップロード

## 0. 直近反映（2026-03-02）
- 画像ファイル名の誤記修正
  - `eXs steet` / `eXs-steet` -> `eXs street` / `eXs-street`
  - HTML/JSの参照先も全更新済み
- 不要画像・不要動画の削除と圧縮最適化を実施
  - 未参照画像を削除（root/exs-api 両方）
  - 未参照動画 `video/eXs.mp4` と `video/raw/*` を削除（exs-api側含む）
- `partner-list` の初期フィルター対応
  - `?model=street` / `?model=tkg` で初期表示を切替
- `index` NEWSカードクリックは `news-list.html` 遷移に統一

## 1. Productページ（API連携）
対象:
- `product-street.html`
- `product-tkg.html`

関連JS:
- `JS/api-client.js`
- `JS/services/base-api-requester.js`
- `JS/services/auth-api-requester.js`
- `JS/services/cart-api-requester.js`
- `JS/services/product-api-requester.js`

API設定（任意）:
```js
window.EXS_API_CONFIG = {
  apiBaseUrl: "https://api-e.customjapan.net/api/v1",
  streetProductUrl: "https://.../street-product.json",
  tkgProductUrl: "https://.../tkg-product.json"
};
```

動作優先順位:
1. URLクエリ `?api=...`
2. `window.EXS_API_CONFIG.<page-specific-url>`
3. ページ内フォールバックデータ

Street実装メモ:
- 購入ボタン表記: `GO TO CART`
- 保証文: お届けから12ヶ月（1年間）
- 主要仕様表示: 20×4、10Ah、IPX4/IPX5 など
- `options[]` UIは利用中

TKG実装メモ:
- 購入ボタン表記: `GO TO CART`
- `OPTIONS` UIは削除済み（セット種別選択のみ）
- 価格表示:
  - 単品: `54,999円`
  - サドルセット: `64,799円`
  - ハンドルバッグセット: `56,979円`
- 保証文: お届けから6ヶ月

---

## 2. Accessories（API連携）
対象:
- `accessories.html`

関連JS:
- `JS/accessories.js`
- `JS/api-client.js`
- `JS/services/product-api-requester.js`

API取得:
- `?api=` または `EXS_API_CONFIG.accessoriesUrl` があれば `fetch`
- JSON解釈候補: `json.data` -> `json.products` -> `json.items` -> `json`
- URL未指定時: `GET /products/accessories`

フィルター:
- `all / helmet / lock / bag / maintenance`

現行実装メモ:
- フォールバック（モック）に21商品を定義済み
  - ヘルメット3
  - Street用パーツ5
  - TKG用パーツ6
  - ロック/ポンプ類7
- カードボタン文言は `カートへ進む`
- API追加失敗時のフォールバック:
  - 商品URLがあれば直接遷移
  - カートURLが設定済みならカートへ遷移

---

## 3. 問い合わせ・フォーム（仮PHP実装）
対象:
- `contact.html` -> `contact.php`
- `partner-entry.html` -> `partner-entry.php`
- 完了: `thanks.html`
- 失敗: `form-error.html`
- 上記は `exs-api/` 配下にも同一構成あり

送信仕様:
- 送信方式: `POST`
- 宛先: `info@customjapan.jp`
- 送信後遷移:
  - 成功: `thanks.html?form=contact|partner`
  - 失敗: `form-error.html?form=contact|partner`

現状注意:
- 仮実装のため、CSRF/reCAPTCHA未導入
- 本番ではSMTP送信化・スパム対策追加を推奨

---

## 4. SEO（現状要点）
実施済み:
- 主要ページに `title / meta description / canonical / OGP / Twitter` を設定
- `thanks.html` と `form-error.html` は `noindex,follow`
- `sitemap.xml` 更新済み（`exs-api/sitemap.xml` も同期）

確認対象ファイル:
- `sitemap.xml`
- `exs-api/sitemap.xml`
- `partner-entry.html`
- `thanks.html`
- `form-error.html`
- `exs-api/partner-entry.html`
- `exs-api/thanks.html`
- `exs-api/form-error.html`
