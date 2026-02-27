import { ApiRequester } from '../../services/base-api-requester.js'
import { AuthApiRequester } from '../../services/auth-api-requester.js'
import { CartApiRequester } from '../../services/cart-api-requester.js'

const API_BASE_URL = 'https://api-e.customjapan.net/api/v1'

// APIクライアントの初期化
export const initApiClient = (apiBaseUrl = API_BASE_URL) => {
  ApiRequester.setApiBaseUrl(apiBaseUrl)
}

// ログイン検証とHead情報を取得
// Head情報をCookieに保存しないと他のAPIリクエストが失敗する
export const verifyLogin = async () => {
  const res = await AuthApiRequester.verifyLogin()
  return res // ログイン検証結果を返す
}

// カート情報の取得
export const fetchCart = async () => {
  const res = await CartApiRequester.fetchCart()
  return res // カート情報を返す
}

// カートに商品を追加
export const addItemToCart = async (id, quantity) => {
  const addedItem = {
    id, // 商品品番
    quantity, // 追加する数量
    site: 'exs', // サイト識別子
  }

  const res = await CartApiRequester.addItemsToCart(addedItem)
  return res // 追加後のカート情報を返す
}

// カートから商品を削除
// 削除したい明細を配列で渡す
export const deleteCartItem = async (cartDetails) => {
  const req = cartDetails.map((detail) => ({
    details: {
      no: detail.no,
      exclCnt: detail.exclCnt
    }
  }))

  const res = await CartApiRequester.deleteCartDetails(req)
  return res // 削除後のカート情報を返す
}

// カートを空にする
export const clearCart = async () => {
  const cart = await fetchCart()
  if (!cart || !cart.details || cart.details.length === 0) return

  const req = cart.details
  const res = await CartApiRequester.deleteCartDetails(req)
  return res // 削除後のカート情報を返す
}