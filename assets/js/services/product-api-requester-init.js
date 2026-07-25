// 【init 版・差し替え用】ProductApiRequester の init ベース版。
// 現行 product-api-requester.js（旧認証ベース）の置き換え用。
// 中身は現行と同一で、継承する基底のみ base-api-requester-init.js に変えてある。
// 移行完了時に api-client.js / 利用側の import を本ファイルへ差し替える。
import { ApiRequester } from './base-api-requester-init.js'

const BMA_API_BASE_URL = 'https://api-f.customjapan.net/api/v1'

export class ProductApiRequester extends ApiRequester {
  // アクセサリー一覧を取得
  static async fetchAccessories () {
    const json = (
      await this.performAction('items', 'POST', {
        ids: [
          // eXs Street 用パーツ
          '29282029',
          '29282012',
          '29184231',
          '29184224',
          '29184217',
          '29184194',
          '29184187',
          '29184170',
          '29184118',
          '29184101',
          '29184071',
          '29184064',
          '29184057',
          '29184040',
          '29184033',
          '29184026',
          '29184019',
          '29184002',
          '29183999',
          '29183982',
          '29183968',
          '29183913',
          '29183906',
          '29183890',
          '29183883',
          '29183876',
          '29183869',
          '28120285',
          // eXs 1 TKG 用パーツ
          '27878163',
          '27294116',
          '27290262',
          '27290279',
          // ヘルメット（両モデル共通）
          '27687352',
          '27687345',
          '27687338',
        ],
      })
    ).json
    if (json?.result === 'error' || ((!json?.data || (Array.isArray(json?.data) && json.data.length === 0)) && Array.isArray(json?.errors) && json.errors.length > 0)) {
      const code = json?.errors?.[0]?.cd || ''
      const message = json?.errors?.[0]?.abstract || 'API request failed'
      throw new Error(`items: ${code} ${message}`.trim())
    }
    return json
  }

  // 指定IDの商品情報を取得
  static async fetchItems (ids) {
    const normalizedIds = (Array.isArray(ids) ? ids : [ids]).map(id => String(id || '').trim()).filter(Boolean)
    if (normalizedIds.length === 0) {
      throw new Error('items: no ids')
    }

    const json = (
      await this.performAction('items', 'POST', {
        ids: normalizedIds,
      })
    ).json
    if (json?.result === 'error' || ((!json?.data || (Array.isArray(json?.data) && json.data.length === 0)) && Array.isArray(json?.errors) && json.errors.length > 0)) {
      const code = json?.errors?.[0]?.cd || ''
      const message = json?.errors?.[0]?.abstract || 'API request failed'
      throw new Error(`items: ${code} ${message}`.trim())
    }
    return json
  }

  // 商品詳細（オプション含む）を取得
  static async fetchProductDetail (productId) {
    // エンドポイントは仮定です（products/{id}）
    return (await this.performAction(`products/${productId}`, 'GET')).json
  }

  // アクセサリーをカートに追加
  static async addAccessoryToCart (productId, quantity = 1) {
    // exs-api仕様: cart/details に site=exs 付きで追加
    return (
      await this.performAction('cart/details', 'PUT', {
        id      : String(productId),
        quantity: Number(quantity),
        site    : 'exs',
      })
    ).json
  }

  // BMA API（api-f）から商品情報（画像含む）を取得。img / imgs / freeImgs を持つ。
  // BMA は init 認証不要・軽量のため、performAction を経由せず直接 fetch する。
  // 存在すれば商品オブジェクト、非公開 / 無効 / 不在（404 等）なら null。
  static async fetchItemBmaInfo (id) {
    const base = (window.EXS_API_CONFIG && window.EXS_API_CONFIG.bmaApiBaseUrl) || BMA_API_BASE_URL
    const res = await fetch(`${base}/getItemBmaInfo?id=${encodeURIComponent(id)}`, {
      method     : 'GET',
      credentials: 'include',
    })
    if (!res.ok) return null
    return await res.json()
  }
}
