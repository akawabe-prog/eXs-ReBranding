# eXs API連携ハンドオフ資料（現行実装ベース）

最終更新: 2026-02-26  
対象環境: `https://exs.customjapan.net`（本番想定）  
公開構成: `exs-api/` 配下をアップロード

## 1. 対象ページ
- `product-street.html`（購入ページ/API連携版）
- `product-tkg.html`（購入ページ/API連携版）
- `accessories.html`（アクセサリー一覧/API連携版）

参考:
- 閲覧用ページは別ファイル  
  `product-street(閲覧用).html` / `product-tkg(閲覧用).html`

## 2. 関連ファイル
- 共通APIクライアント: `JS/api-client.js`
- API基盤: `JS/services/base-api-requester.js`
- 認証: `JS/services/auth-api-requester.js`
- カート: `JS/services/cart-api-requester.js`
- 商品API補助: `JS/services/product-api-requester.js`
- アクセサリー画面ロジック: `JS/accessories.js`
- 商品ページロジック:  
  `product-street.html` 内 `type="module"` スクリプト  
  `product-tkg.html` 内 `type="module"` スクリプト

## 3. 環境設定キー（フロント）
フロントは `window.EXS_API_CONFIG` があれば利用します。

```js
window.EXS_API_CONFIG = {
  apiBaseUrl: "https://api-e.customjapan.net/api/v1",
  streetProductUrl: "https://.../street-product.json",
  tkgProductUrl: "https://.../tkg-product.json",
  accessoriesUrl: "https://.../accessories.json"
};
```

優先順位:
1. URLクエリ `?api=...`
2. `window.EXS_API_CONFIG.<page-specific-url>`
3. 未設定時はページ内フォールバックデータ

## 4. 認証・共通API仕様

### 4-1. APIベースURL
- 既定値: `https://api-e.customjapan.net/api/v1`
- 初期化関数: `initApiClient(apiBaseUrl?)`

### 4-2. 事前トークン取得
- Endpoint: `POST /auth/login/before`
- 取得ヘッダー:
  - `X-Guid`
  - `Authorization`
- フロント動作:
  - Cookie保存（`xGuId`, `authorization`）
  - 以降のAPIリクエストヘッダーに付与

### 4-3. ログイン検証
- Endpoint: `POST /auth/login/verify`
- 実行タイミング: 各対象ページ `DOMContentLoaded`
- Timeout: `15000ms`
- 再試行条件:
  - `errors[].cd` が `COM3002` or `COM3005`
- 再試行フロー:
1. 認証Cookieをクリア
2. 再初期化
3. `verify` 再実行

## 5. カートAPI仕様

### 5-1. カート追加（全ページ共通）
- Endpoint: `PUT /cart/details`
- Body:
```json
{
  "id": "29044337",
  "quantity": 1,
  "site": "exs"
}
```

### 5-2. カート取得/削除（共通ユーティリティ）
- 取得: `POST /cart`
- 明細削除: `POST /cart/details/delete`
- 数量変更: `PUT /cart/details/quantity`

## 6. 画面別仕様

### 6-1. `product-street.html`
- 商品データ取得:
  - `?api=` or `EXS_API_CONFIG.streetProductUrl` から `fetch`
  - JSON解釈順: `json.product` → `json.data` → `json`
- カート投入ID:
  - 選択中画像の `productId`（未設定時は `id/itemId/sku` で補完）
- 主な期待データ:
  - `name`, `category`, `description`, `basePrice|price`, `shippingEstimate`
  - `images[]`:
    - `src`, `thumb?`, `label?`, `colorHex?`
    - `productId|id|itemId|sku`
    - `rakutenUrl?`, `yahooUrl?`
  - `options[]`: `label`, `price`
  - `specs[]`: `label`, `value`
- 備考:
  - API失敗時はページ内 `fallbackData` で描画継続

### 6-2. `product-tkg.html`
- 商品データ取得:
  - `?api=` or `EXS_API_CONFIG.tkgProductUrl` から `fetch`
  - JSON解釈順: `json.product` → `json.data` → `json`
- カート投入ID:
  - 選択中 `productTypes[]` の `id`  
  - 補完キー: `productId|itemId|sku`
- 主な期待データ:
  - `name`, `category`, `description`, `shippingEstimate`
  - `images[]`: `src`, `thumb?`, `label?`
  - `productTypes[]`:
    - `id|productId|itemId|sku`
    - `label|name`
    - `price`
    - `rakutenUrl?`, `yahooUrl?`, `badge?`
  - `options[]`: `label`, `price`
  - `specs[]`: `label`, `value`
- 備考:
  - Stripe風UIはモーダル演出のみ（外部Stripe API未接続）
  - API失敗時は `fallbackData` で描画

### 6-3. `accessories.html`
- データ取得:
  - `?api=` or `EXS_API_CONFIG.accessoriesUrl` があれば `fetch`
  - JSON解釈候補: `json.data` → `json.products` → `json.items` → `json`
  - URL指定が無ければ `ProductApiRequester.fetchAccessories()`  
    (`GET /products/accessories`)
- フィルタ:
  - `category` 値で `all/helmet/lock/bag/maintenance`
- カート追加:
  - 各カードの `id` を `addItemToCart(id, 1)` で投入
- 主な期待データ:
  - `id`, `name`, `category`, `description`
  - `categoryLabel?`, `compatibility?`, `image?`
- 備考:
  - API失敗時はモック6件で表示継続

## 7. 想定レスポンス（推奨）
成功:
```json
{
  "result": "success",
  "data": {}
}
```

エラー:
```json
{
  "result": "error",
  "errors": [
    {
      "cd": "COM3002",
      "abstract": "セッションが無効です"
    }
  ],
  "infos": []
}
```

フロントが表示に使用する主キー:
- `result`
- `errors[].abstract`
- `errors[].cd`

## 8. システム連携時の確認事項
1. `PUT /cart/details` の `id` キー名は固定で問題ないか
2. `site: "exs"` 固定値の扱い
3. CORS許可オリジン（`https://exs.customjapan.net`）
4. `auth/login/before` の `X-Guid` / `Authorization` ヘッダー返却仕様
5. 認証期限切れ時の標準エラーコード（`COM3002/COM3005`以外の有無）

## 9. 受け入れ確認チェックリスト
- [ ] `verifyLogin()` 成功後、`xGuId` / `authorization` Cookieが設定される
- [ ] 3ページともAPIデータで描画可能
- [ ] API停止時にフォールバックデータ描画される
- [ ] `PUT /cart/details` が `200` かつ `result != error` を返す
- [ ] エラー時に `errors[].abstract` がUIへ表示される
- [ ] CORS/プリフライトで失敗しない

