import {
  initApiClient,
  verifyLogin,
  fetchCart,
  addItemToCart,
  deleteCartItem,
  clearCart,
} from './api-client.js'

// ページ読み込み時に必ず実行する
// APIクライアントの初期化
initApiClient()
// ログイン検証とHead情報の取得
verifyLogin()