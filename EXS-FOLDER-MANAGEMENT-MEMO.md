# eXs フォルダ管理メモ

最終更新: 2026-07-23

## 基本方針

この作業フォルダには、主に `exs` と `exs-mobi` の2系統があります。

- `exs`: `exs.customjapan.net` 向けの静的サイト一式として管理
- `exs-mobi`: `exs.mobi` 本番向けの静的サイト一式として管理
- `wp-theme`: 現在のeXsブランディングサイトでは使用しない。ユーザーから明示指示がない限り編集しない
- `exs_backup`: 旧状態・退避用。通常の更新対象ではない

クリーンURL、Google Drive納品、GCS同期、API認証の詳細ルールは `CLEAN-URL-DRIVE-API-OPERATION-GUIDE.md` を参照する。

## `exs` と `exs-mobi` の関係

ページや画像の多くは同じ構成だが、完全なミラーではない。
共通の表示修正や素材追加は、原則として `exs` と `exs-mobi` の両方へ反映する。

ただし、以下のような差分があるため、フォルダごとの単純上書きコピーは避ける。

- canonical / og:url などのURLが異なる
- `assets/js/components.js` の `SITE_ORIGIN` が異なる
  - `exs`: `https://exs.customjapan.net`
  - `exs-mobi`: `https://exs.mobi`
- `exs-mobi` には本番寄りのファイルがある
  - `.htaccess`
  - `robots.txt`
  - `sitemap.xml`
  - `contact_config.local.php`
  - `contact_submit.php`
  - `_PhP_Mailer_`
  - `product/detail-street.html`
  - `product/detail-tkg.html`
  - `product/purchase-street.html`
  - `product/purchase-tkg.html`
- API関連JSは `exs` と `exs-mobi` で参照している requester 名が異なる箇所があるため、修正時は必ず両方を確認する

## 更新時の運用

通常のページ修正は、同名HTMLを両方更新する。

例:

- `exs/index.html`
- `exs-mobi/index.html`

代理店一覧も同様に両方更新する。

- `exs/partner-list.html`
- `exs-mobi/partner-list.html`

商品ページは、同じ内容でも別名ページが存在する場合があるため注意する。

例:

- `exs/product/exs-street.html`
- `exs-mobi/product/exs-street.html`
- `exs-mobi/product/detail-street.html`
- `exs/product/exs-street/purchase.html`
- `exs-mobi/product/exs-street/purchase.html`
- `exs-mobi/product/purchase-street.html`

## 画像・素材の配置

既存構成に合わせて、基本的に以下へ配置する。

- 元形式・JPEG版: `assets/images/img/`
- WebP版: `assets/images/img-webp/`
- SVGアイコン: `assets/images/icons/`
- Instagram用画像: `assets/images/instagram/`

素材追加時は `exs` と `exs-mobi` の両方へ配置する。
写真素材は、原則としてサイト用に長辺1920px程度へ縮小し、WebP版も作成する。

## 本番確認について

ローカルの `exs-mobi` を編集しても、即座に `https://exs.mobi/` へ反映されるわけではない。
本番反映後に確認する場合は、対象URLを直接確認する。

例:

- `https://exs.mobi/`
- `https://exs.mobi/partner-list`
- `https://exs.mobi/product/exs-1-tkg`
- `https://exs.mobi/product/exs-1-tkg/purchase`

## 注意点

- WordPressテーマは現在使用しない前提のため、通常作業では `wp-theme` を編集しない
- `exs` と `exs-mobi` は似ているが、URL、問い合わせ、商品ページ別名、API関連に差分がある
- 共通修正後は、必要に応じて `diff -qr exs exs-mobi` で差分を確認する
- `.DS_Store` は差分に出るが、サイト更新内容としては基本的に無視する
