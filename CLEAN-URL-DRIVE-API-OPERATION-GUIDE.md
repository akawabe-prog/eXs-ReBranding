# クリーンURL対応 ブランドサイト開発・運用ガイド

最終更新: 2026-07-23

このドキュメントは、新規ブランドサイト構築時のフロントエンド実装ルール、Google Drive納品、GCS配信、API認証に関する運用メモです。

## 基本方針

本番環境では、URLから `.html` 拡張子を排除したクリーンURLで配信する。

例:

- `/about`
- `/product/item-a`
- `/partner-list`

ただし、開発およびGoogle Driveへの格納は、従来通り `.html` ファイルのまま行う。
開発側で拡張子なしファイルを別途作成する必要はない。

## 開発・デプロイの流れ

サイトは、Google Driveに格納されたファイルを自動バッチでGCSへアップロードして配信する。

- 開発: `.html` 拡張子付きで作成する
- Drive格納: `.html` 拡張子付きのままアップロードする
- デプロイ: バッチ処理内で `.html` 拡張子が削除され、クリーンURLとして配置される

## パス指定ルール

クリーンURL配信時に `/product/item-a` などの階層URLからアクセスしても崩れないよう、同一オリジン内の参照はルート相対パスに統一する。

### 共通JS

グローバルナビ、フッター、共通コンポーネント内のサイト内リンクはルート相対パスにする。

NG:

```js
about: 'about'
```

OK:

```js
about: '/about'
product_intro: '/product/item-a'
```

SNSなど外部サイトへのリンクは通常の絶対URLで問題ない。
ロゴなど共通アセットも `/assets/images/...` のようにルート相対パスにする。

### HTML内のCSS・JS・画像

全HTMLの `href` / `src` はルート相対パスにする。

NG:

```html
<link rel="stylesheet" href="assets/css/style.css">
<script src="assets/js/main.js"></script>
```

OK:

```html
<link rel="stylesheet" href="/assets/css/style.css">
<script src="/assets/js/main.js"></script>
```

### 内部リンク

同一サイト内へのリンクは、拡張子を付けず、ルート相対パスにする。

NG:

```html
<a href="about.html">
<a href="about">
```

OK:

```html
<a href="/about">
```

### JS制御・カスタム属性・動画

JSで動的に読む画像や動画もルート相対パスにする。

- `data-images`: `/assets/images/img-webp/...`
- JS import: `import ... from '/assets/js/api-client.js'`
- インラインスクリプト内の画像パス: `/assets/...`
- `<video>` / `<source>`: `/assets/videos/...`
- 動画は `type="video/mp4"` など正しいMIME型を指定する

相対パスのままだと、クリーンURLの階層を基準に解決され、`/product/assets/...` のような誤ったリクエストになる場合がある。

### OGP・Twitterカード

SNSプレビュー用画像もルート相対パスにする。

NG:

```html
<meta property="og:image" content="assets/images/ogp-image.webp">
```

OK:

```html
<meta property="og:image" content="/assets/images/img-webp/ogp-image.webp">
```

## Drive / GCS アップロードバッチ

### Google Driveアップロード元

- ランディング: `https://drive.google.com/drive/folders/0ALnvFtM0p4lJUk9PVA`
- ブランドサイト: `https://drive.google.com/drive/folders/0AKmQ5fovP8zQUk9PVA`

### GCSアップロード先

- ランディング: `lp-prd-customjapan-net`
- ブランドサイト: `brand-prd-customjapan-net`

### 実行タイミング

- 毎時 8:00〜22:00
- 20分ごと

### 同期仕様

Driveをマスターとした完全同期の差分更新。
そのため、Driveは常に最新状態である必要がある。

注意:

- Driveは同一フォルダ内でも同名ファイルを作成できる
- 同名ファイルがある場合は警告される
- アップロード自体は更新日時が新しいファイルで実行される
- 重複ファイルは自動削除されないため、通知を見て手動で削除する

### 通知

- 通知先: `cj-stove-cms-priv`
- 通知元: `Drive Uploader App - lp` または `Drive Uploader App - brand`
- 通知タイミング:
  - 新規・更新
  - 削除
  - ファイル重複
  - 失敗ファイル
  - エラー

失敗ファイルやエラーがある場合は、CJ_飯岡智樹宛に連絡する。

### 削除ガード

誤削除防止のため、全体の2割に相当するファイル数が削除されそうな場合は、全ファイルを更新せずに中断する。

ただし、2割を超えても50件に満たない場合は中断しない。
大量削除が必要な場合は、CJ_飯岡智樹宛に事前連絡する。

### Driveへのアップロード手順

一括置き換えではなく、変更が必要なファイルまたはフォルダ単位でアップロードする。

- 新規追加: Driveの正しい階層へファイルまたはフォルダをアップロード
- 更新: Driveの正しい階層へアップロードし、「既存のファイル（フォルダ）を置き換える」を選択
- 削除: 削除ガード仕様を確認した上で、対象ファイルまたはフォルダをゴミ箱へ移動

## API認証仕様

商品情報、カート、在庫など `api-*.customjapan.net` 系のエンドポイントは、認証を通さないと実行できない。
認証はCookieの `guid` / `authorization` で行う。
これらのCookieは init API が発行する。

### init API

- メソッド: `GET`
- URL: `https://api-i.customjapan.net/api/v1/init`
- 必須オプション:
  - `credentials: 'include'`
  - `cache: 'no-cache'`
- 効果:
  - `guid` / `authorization` / `cid` を `Set-Cookie`
- 戻り値:
  - ログイン状態
  - カートサマリー

戻り値例:

```json
{
  "result": "success",
  "data": {
    "isBiz": true,
    "isCustomer": true,
    "isLoggedIn": true,
    "isConsumer": false,
    "isJ": false,
    "quantity": 2,
    "total": {
      "taxIn": 124047
    },
    "forFreeShipping": 0
  }
}
```

### 認証で使うCookie

- 認証に使う: `guid` / `authorization`
- Cookieにセットされるが認証情報ではない: `cid`

### Safari対策

`cache: 'no-cache'` は必須。
指定しないとSafariが別ログイン状態のレスポンスを使い回し、タブ復帰時に古いログイン状態や古いカート個数が表示される場合がある。

## eXs作業時の注意

- `exs` / `exs-mobi` は `.html` のまま管理する
- 本番URLはクリーンURL前提で、内部リンクは `/about` のように書く
- CSS / JS / 画像 / data属性 / import / video / OGP はルート相対パスにする
- Driveへは変更対象ファイル単位でアップロードする
- API利用前には init API による認証初期化を必ず通す
- `init` は `credentials: 'include'` と `cache: 'no-cache'` を必ず付ける
