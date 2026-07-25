# exs-mobi Accessories CTA OFF Memo

最終更新: 2026-04-16

## 実施内容（今回）
- 対象: `exs-mobi/assets/js/accessories.js`
- アクセサリーカードから CTA を完全に削除。
  - 「カートへ進む」ボタンを削除
  - 「購入先へ進む」リンクを削除
  - ボタン/リンクは表示しない
- カードには商品情報（カテゴリ、説明、価格表示）のみ表示する構成に変更。

## 補足
- データ内の `url` は保持しているが、UIには表示・利用しない。
- FAQページ自体の導線変更は今回未実施（アクセサリーページのCTA削除のみ）。

## 戻し方（必要時）
1. `renderAccessories()` 内でCTAマークアップを再追加する。
2. 必要なら `item.url` を使って購入リンク、またはカート処理を復帰する。
3. 確認コマンド:
   - `rg -n "カートへ進む|購入先へ進む|add-to-cart-btn" exs-mobi/assets/js/accessories.js`
