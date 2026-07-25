// InitApiRequester … init ベース。init() が使用し、active requester も同じ基底を継承。
import { ApiRequester as InitApiRequester } from './services/base-api-requester-init.js'
import { CartApiRequester } from './services/cart-api-requester-init.js'

const API_BASE_URL = 'https://api-e.customjapan.net/api/v1'
const INIT_API_BASE_URL = 'https://api-i.customjapan.net/api/v1'

export const initApiClient = (apiBaseUrl = API_BASE_URL, initApiBaseUrl = INIT_API_BASE_URL) => {
  InitApiRequester.setApiBaseUrl(apiBaseUrl)
  InitApiRequester.setInitApiBaseUrl(initApiBaseUrl)
}

// init API（api-i）で認証初期化。guid / authorization / cid を Cookie にセットし
// loginInfo を返す。旧認証フローの置き換え。
export const init = async () => {
  const res = await InitApiRequester.init()
  InitApiRequester.hasInitialized = true
  return res
}

export const fetchCart = async () => {
  const res = await CartApiRequester.fetchCart()
  return res?.data || res
}

export const addItemsToCart = async items => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map(item => ({
      id      : item?.id,
      quantity: Number(item?.quantity || 1),
      site    : item?.site || 'exs',
    }))
    .filter(item => item.id)

  if (normalizedItems.length === 0) {
    throw new Error('No cart items to add')
  }

  const res = await CartApiRequester.addItemsToCart({
    items: normalizedItems,
  })
  return res
}

export const addItemToCart = async (id, quantity) => {
  return addItemsToCart([
    {
      id,
      quantity,
    },
  ])
}

export const deleteCartItem = async cartDetails => {
  const req = (Array.isArray(cartDetails) ? cartDetails : []).map(detail => ({
    ...detail,
  }))
  const res = await CartApiRequester.deleteCartDetails(req)
  return res
}

export const clearCart = async () => {
  const cart = await fetchCart()
  if (!cart || !cart.details || cart.details.length === 0) return
  const req = cart.details
  const res = await CartApiRequester.deleteCartDetails(req)
  return res
}
