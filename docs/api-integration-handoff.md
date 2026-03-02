# eXs ハンドオフ資料（API / JS / PHP のみ）

最終更新: 2026-03-02  
対象環境: `https://exs.customjapan.net`  
公開構成: `exs-api/` 配下をアップロード

## 1. Product（API連携）
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

実装メモ:
- Street:
  - 購入ボタン表記: `GO TO CART`
  - 保証文: お届けから12ヶ月（1年間）
  - 主要仕様表示: 20×4、10Ah、IPX4/IPX5
  - `THE STREET RIDE` のPCパララックス強化済み
- TKG:
  - 購入ボタン表記: `GO TO CART`
  - `OPTIONS` UI削除（セット種別選択のみ）
  - 価格表示: 単品 `54,999円` / サドル `64,799円` / バッグ `56,979円`
  - 保証文: お届けから6ヶ月
  - `THE URBAN CRUISER` の `IMAGE MOVIE` 表記削除済み

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

実装メモ:
- フィルター: `all / helmet / lock / bag / maintenance`
- フォールバック（モック）: 21商品定義済み
- ボタン文言: `カートへ進む`

## 3. 問い合わせ
対象:
- `contact.html` -> `contact.php`
- 完了: `thanks.html`
- 失敗: `form-error.html`

送信仕様:
- 送信方式: `POST`
- 宛先: `info@customjapan.jp`
- 送信後遷移:
  - 成功: `thanks.html?form=contact`
  - 失敗: `form-error.html?form=contact`

## 4. エントリー
対象:
- `partner-entry.html` -> `partner-entry.php`
- 完了: `thanks.html`
- 失敗: `form-error.html`

送信仕様:
- 送信方式: `POST`
- 宛先: `info@customjapan.jp`
- 送信後遷移:
  - 成功: `thanks.html?form=partner`
  - 失敗: `form-error.html?form=partner`
