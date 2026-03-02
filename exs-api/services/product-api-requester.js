import { ApiRequester } from './base-api-requester.js';

export class ProductApiRequester extends ApiRequester {
    // アクセサリー一覧を取得
    static async fetchAccessories() {
        // エンドポイントは仮定です（/products/accessories）。
        // 実際のAPI仕様に合わせて変更してください。
        return (await this.performAction('products/accessories', 'GET')).json;
    }

    // 商品詳細（オプション含む）を取得
    static async fetchProductDetail(productId) {
        // エンドポイントは仮定です（products/{id}）
        return (await this.performAction(`products/${productId}`, 'GET')).json;
    }

    // アクセサリーをカートに追加
    static async addAccessoryToCart(productId, quantity = 1) {
        // exs-api仕様: cart/details に site=exs 付きで追加
        return (await this.performAction('cart/details', 'PUT', {
            id: String(productId),
            quantity: Number(quantity),
            site: 'exs',
        })).json;
    }
}
