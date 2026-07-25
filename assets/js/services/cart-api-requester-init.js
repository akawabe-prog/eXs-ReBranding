// 【init 版・差し替え用】CartApiRequester の init ベース版。
// 現行 cart-api-requester.js（旧認証ベース）の置き換え用。
// 中身は現行と同一で、継承する基底のみ base-api-requester-init.js に変えてある。
// 移行完了時に api-client.js の import を本ファイルへ差し替える。
import { ApiRequester } from './base-api-requester-init.js'

export class CartApiRequester extends ApiRequester {
  static async fetchCart (body = {}) {
    return (
      await this.performAction('cart', 'POST', body, {
        isNotSendErrors: true,
      })
    ).json
  }

  static async addItemsToCart (body) {
    return (await this.performAction('cart/details', 'PUT', body)).json
  }

  static async deleteCartDetails (body) {
    return (await this.performAction('cart/details/delete', 'POST', body)).json
  }

  static async changeCartDetailQuantity (body) {
    return (await this.performAction('cart/details/quantity', 'PUT', body)).json
  }
}
