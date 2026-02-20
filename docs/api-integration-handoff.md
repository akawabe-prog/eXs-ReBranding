# eXs フロント/API連携 ハンドオフ資料

最終更新: 2026-02-20
対象画面:
- `product-street(API用).html`
- `product-tkg(API用).html`

## 1. 連携の前提
- APIベースURL初期値: `https://api-e.customjapan.net/api/v1`
- フロント起動時に実行:
  - `initApiClient()`
  - `verifyLogin()`
- カート追加時に実行:
  - `addItemToCart(id, 1)`

## 2. 認証/共通API仕様

### 2-1. 事前トークン取得
- Endpoint: `POST /auth/login/before`
- 期待ヘッダー:
  - `X-Guid`
  - `Authorization`
- フロント動作:
  - 上記をCookie保存して以後のAPIヘッダーに付与

### 2-2. ログイン検証
- Endpoint: `POST /auth/login/verify`
- Timeout: `15000ms`
- エラー再試行条件:
  - `errors[].cd` に `COM3002` or `COM3005`
- 再試行フロー:
  1. トークン/Cookieクリア
  2. `ensureInitialized()` で再初期化
  3. `verify` 再実行

## 3. カートAPI仕様

### 3-1. カート取得
- Endpoint: `POST /cart`
- Function: `fetchCart()`

### 3-2. カート追加
- Endpoint: `PUT /cart/details`
- Function: `addItemToCart(id, quantity)`
- Request Body:
```json
{
  "id": "29044337",
  "quantity": 1,
  "site": "exs"
}
```

### 3-3. カート明細削除
- Endpoint: `POST /cart/details/delete`
- Function: `deleteCartItem(cartDetails)` / `clearCart()`

## 4. 商品表示API仕様（画面描画用）

フロントは以下の順でデータ解釈します:
- `json.product` → `json.data` → `json`

### 4-1. Street 商品データ (`streetProductUrl`)
取得先:
- `?api=` クエリ優先
- 未指定時 `window.EXS_API_CONFIG.streetProductUrl`

期待キー:
- `name`: string
- `category`: string
- `description`: string
- `basePrice` or `price`: number
- `shippingEstimate`: string
- `images[]`:
  - `src`: string
  - `thumb`: string (optional)
  - `label`: string (optional)
  - `colorHex`: string (optional)
  - `productId` or `id` or `itemId` or `sku`: string
  - `rakutenUrl`: string (optional)
  - `yahooUrl`: string (optional)
- `options[]`:
  - `label`: string
  - `price`: number
- `specs[]`:
  - `label`: string
  - `value`: string

### 4-2. TKG 商品データ (`tkgProductUrl`)
取得先:
- `?api=` クエリ優先
- 未指定時 `window.EXS_API_CONFIG.tkgProductUrl`

期待キー:
- `name`: string
- `category`: string
- `description`: string
- `shippingEstimate`: string
- `images[]`: Street同様
- `productTypes[]`:
  - `id` or `productId` or `itemId` or `sku`: string
  - `label` or `name`: string
  - `price`: number
  - `rakutenUrl`: string (optional)
  - `yahooUrl`: string (optional)
  - `badge`: string (optional)
- `options[]`: Street同様
- `specs[]`: Street同様

## 5. レスポンス共通フォーマット（推奨）

成功例:
```json
{
  "result": "success",
  "data": {}
}
```

エラー例:
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

フロント表示で利用する主キー:
- `result`
- `errors[].abstract`
- `errors[].cd`

## 6. システム側へ確認したい項目
- `id`（カート投入ID）の正式キー名は `id` 固定でよいか
- `streetProductUrl` / `tkgProductUrl` の提供先URL
- CORS許可対象ドメイン
- `X-Guid` / `Authorization` の有効期限と更新仕様
- `site: "exs"` 固定値の扱い
- エラーコード一覧（特に認証期限切れ系）

## 7. 受け入れチェック（結合前）
- `verifyLogin()` が成功し、Cookieに `xGuId` / `authorization` が入る
- Street/TKG商品APIが最低キーを返し、ページが崩れない
- `addItemToCart` 実行後、`result !== error` を返す
- エラー時に `errors[].abstract` が表示可能
- CORS/プリフライトでブロックされない

