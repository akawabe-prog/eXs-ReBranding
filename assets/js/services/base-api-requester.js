// init API ベースの基底リクエスター。
// init（api-i /init）で認証 Cookie を確立し、各リクエストは credentials:'include' で送る。

const BASE_TIMER = 0 // 0 means no timeout
const INIT_TIMER = 15000 // init は 15 秒でタイムアウト

const getCurrentRouteName = () => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.useRoute === 'function') {
    const route = globalThis.useRoute()
    return route?.name
  }
  return undefined
}

export class ApiRequester {
  static instance = null
  static apiBaseUrl = '' // 本体 EC（api-e）
  static initApiBaseUrl = '' // 認証初期化（api-i）
  static activeRequestCount = 0
  static initializationPromise = null
  static hasInitialized = false // ページ読み込みごとに1回だけ init するためのフラグ（フルリロードでリセットされる）

  _errors = []
  _infos = []
  _requestInProgress = false

  constructor () {
    if (!ApiRequester.apiBaseUrl) throw new Error('API_BASE_URL is not set')
  }

  static setApiBaseUrl (url) {
    ApiRequester.apiBaseUrl = url
  }

  static setInitApiBaseUrl (url) {
    ApiRequester.initApiBaseUrl = url
  }

  // init API（api-i）で認証 Cookie（guid / authorization / cid）を確立する。
  // sendRequest は経由しない（ensureInitialized → init の自己再帰を避けるため直接 fetch）。
  static async init () {
    if (!ApiRequester.initApiBaseUrl) {
      throw new Error('ApiRequester: initApiBaseUrl が未設定です。EXS_API_CONFIG.initApiBaseUrl を確認してください。')
    }

    const res = await fetch(`${ApiRequester.initApiBaseUrl}/init`, {
      method     : 'GET',
      credentials: 'include', // guid / authorization / cid の Set-Cookie を受け取る
      signal     : AbortSignal.timeout(INIT_TIMER),
    })

    return await res.json()
  }

  // ページ読み込みごとに1回だけ init を実行する（毎リクエストでは叩かない）。
  // このサイトはページ遷移のたびにフルリロードされるため、メモリ上のフラグは
  // ページ遷移時に自然にリセットされ、結果として全ページで1回ずつ init が走る。
  // 認証切れ（401 / 403）の再確立は sendRequest 側で検知して行う。
  async ensureInitialized () {
    if (ApiRequester.hasInitialized) return

    // 並行リクエストで init が多重発火しないよう Promise を共有。完了後は破棄する。
    if (!ApiRequester.initializationPromise) {
      ApiRequester.initializationPromise = ApiRequester.init()
        .then(() => {
          ApiRequester.hasInitialized = true
        })
        .catch(error => {
          ApiRequester.initializationPromise = null
          throw error
        })
    }

    await ApiRequester.initializationPromise
    ApiRequester.initializationPromise = null
  }

  getDomain (url, hasSubdomain = false) {
    let normalized = url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0]

    if (!hasSubdomain) {
      const parts = normalized.split('.')
      if (parts.length > 2) normalized = parts.slice(-2).join('.')
    }

    return normalized
  }

  handleFetchError (error) {
    if (location.pathname.includes('/sorry')) return
    switch (error.name) {
      case 'TimeoutError':
        location.replace(`https://www.${this.getDomain(location.href)}/sorry`)
        break
      case 'TypeError':
        console.error('Network error or CORS issue:', error)
        break
      default:
        console.error('An error occurred:', error)
    }
  }

  getCookie (name) {
    if (typeof document === 'undefined') return null
    const cookieName = `${encodeURIComponent(name)}=`
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const found = cookies.find(cookie => cookie.startsWith(cookieName))
    return found ? decodeURIComponent(found.slice(cookieName.length)) : null
  }

  isSafari = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    const isIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIOS) return true
    return /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(ua)
  }

  get errors () {
    return this._errors
  }

  get infos () {
    return this._infos
  }

  get errorMessages () {
    return this._errors.map(error => (error.cd !== 'ITM9001' ? error.abstract ?? '' : '')).filter(Boolean)
  }

  get infoMessages () {
    return this._infos.map(info => info.abstract ?? '').filter(Boolean)
  }

  get requestInProgress () {
    return this._requestInProgress
  }

  static updateRequestInProgress () {
    const instance = ApiRequester.getInstance()
    instance._requestInProgress = ApiRequester.activeRequestCount > 0
  }

  async sendRequest (path, method = 'GET', body = null, options = {}, _retried = false) {
    this._errors = []
    this._infos = []

    const { overrideApiBaseUrl, isFileResponse = false, timer = BASE_TIMER, isNotSendErrors = false } = options || {}

    try {
      await this.ensureInitialized()

      const apiBaseUrl = overrideApiBaseUrl || ApiRequester.apiBaseUrl

      const headers = {
        ...(body !== null ? { 'Content-Type': 'application/json' } : {}),
      }

      const settings = {
        method,
        headers,
        credentials: 'include',
        ...(this.isSafari() ? { cache: 'no-store' } : {}),
        body       : body !== null ? JSON.stringify(body) : undefined,
        signal     : timer ? AbortSignal.timeout(timer) : undefined,
      }

      const res = await fetch(`${apiBaseUrl}/${path}`, settings)
      const status = res.status

      // 認証が通らなかった（401 / 403）場合は init し直して 1 回だけ再試行する。
      if ((status === 401 || status === 403) && !_retried) {
        ApiRequester.initializationPromise = null
        await ApiRequester.init().catch(() => {})
        return this.sendRequest(path, method, body, options, true)
      }

      if (status === 404 || status === 403 || status === 500 || status === 503) throw status

      const json = isFileResponse === true ? await res.blob() : await res.json()
      const resHeaders = res.headers

      if (!isFileResponse && json?.errors && Array.isArray(json.errors)) this._errors = json.errors

      if (!isFileResponse && json?.infos && Array.isArray(json.infos)) {
        const routeName = getCurrentRouteName()
        this._infos = json.infos.filter(info => info.cd !== 'ODW3054' || routeName === 'mypage-orders-change')
      }

      return { json, resHeaders }
    } catch (error) {
      if (isNotSendErrors) {
        const errorData = {
          result: 'error',
          errors: [
            {
              abstract: 'APIリクエストが失敗しました',
              cd      : '',
              level   : '4',
              details : [
                {
                  direction: 'request',
                  path     : '',
                  value    : '',
                  message  : '',
                },
              ],
            },
          ],
        }

        console.error('API request failed:', error, path)
        this._errors = errorData.errors

        return {
          json      : errorData,
          resHeaders: undefined,
        }
      }

      this.handleFetchError(error)
      throw error
    }
  }

  static getInstance () {
    if (!ApiRequester.instance) ApiRequester.instance = new ApiRequester()
    return ApiRequester.instance
  }

  static changeProgressStatus (isLoading) {
    ApiRequester.activeRequestCount = isLoading ? 1 : 0
    ApiRequester.updateRequestInProgress()
  }

  static async performAction (path, method, body, options) {
    const instance = ApiRequester.getInstance()

    try {
      ApiRequester.activeRequestCount++
      ApiRequester.updateRequestInProgress()
      return await instance.sendRequest(path, method, body, options)
    } finally {
      ApiRequester.activeRequestCount--
      ApiRequester.updateRequestInProgress()
    }
  }
}
