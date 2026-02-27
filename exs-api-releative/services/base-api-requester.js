const BASE_TIMER = 0 // 0 means no timeout

export class ApiRequester {
  static instance = null
  static apiBaseUrl = ''
  _errors = []
  _infos = []
  _requestInProgress = false
  cookieValidityDays = 400
  xGuId = null
  authorization = null
  isInitialized = false
  static activeRequestCount = 0

  // インスタンス生成時にxGuIdとauthorizationを取得
  constructor () {
    if (!ApiRequester.apiBaseUrl) throw new Error('API_BASE_URL is not set')
    this.xGuId = this.getCookie('xGuId')
    this.authorization = this.getCookie('authorization')

    if (!this.xGuId || !this.authorization) this.ensureInitialized().then(() => this.isInitialized = true)
    else this.isInitialized = true
  }

  // 初期設定が完了していなければ初期設定を行う
  async ensureInitialized () {
    if (!this.isInitialized) {
      await this.fetchVerifyToken()
      this.isInitialized = true
    }
  }

  // APIのベースURLを設定
  static setApiBaseUrl (url) {
    ApiRequester.apiBaseUrl = url
  }

  // APIリクエストを送信する前に xGuId authorization 取得
  async fetchVerifyToken () {
    try {
      if (!this.xGuId || !this.authorization) {
        const res = await fetch(`${ApiRequester.apiBaseUrl}/auth/login/before`, { method: 'POST' })
        const { headers } = res
        if (!this.xGuId) this.xGuId = headers.get('X-Guid')
        if (!this.authorization) this.authorization = headers.get('Authorization')
      }
    
      if (this.xGuId) this.setCookie('xGuId', this.xGuId, this.cookieValidityDays)
      if (this.authorization) this.setCookie('authorization', this.authorization, this.cookieValidityDays)
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error)
    }
  }

  // Cookieを設定
  setCookie (name, value, days = this.cookieValidityDays) {
    if (typeof window === 'undefined') return

    const getMainDomain = (hostname) => {
      // ドメイン名をピリオドで分割する
      const parts = hostname.split('.').reverse() // 逆順にすることで、TLDを最初にする
      if (parts.length >= 2) {
        // co.jpのようなセカンドレベルドメインを考慮に入れる
        const secondLevelDomains = ['co', 'com', 'org', 'net', 'gov', 'edu']
        if (parts.length > 2 && secondLevelDomains.includes(parts[1])) return `.${parts[2]}.${parts[1]}.${parts[0]}`
        else return `.${parts[1]}.${parts[0]}`
      }
      return hostname
    }

    const maxAge = days ? `max-age=${days * 24 * 60 * 60};` : ''
    const domain = getMainDomain(window.location.hostname)
    document.cookie = `${name}=${value}; ${maxAge} path=/; Domain=${domain}; Secure; SameSite=Lax;`
  }

  // Cookieから値を取得
  getCookie (name) {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  getDomain (url, hasSubdomain = false) {
    url = url
      .replace(/^(https?:\/\/)?(www\.)?/i, '')
      .split('/')[0]
  
    if (!hasSubdomain) {
      const parts = url.split('.')
      if (parts.length > 2) url = parts.slice(-2).join('.')
    }
  
    return url
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

  get errors () {
    return this._errors
  }

  get infos () {
    return this._infos
  }

  get errorMessages () {
    return this._errors
      .map(error => error.abstract ?? '')
      .filter(Boolean)
  }

  get infoMessages () {
    return this._infos
      .map(info => info.abstract ?? '')
      .filter(Boolean)
  }

  get requestInProgress () {
    return this._requestInProgress
  }

  static updateRequestInProgress () {
    const instance = ApiRequester.getInstance()
    if ( ApiRequester.activeRequestCount > 0) instance._requestInProgress = true
    else instance._requestInProgress = false
  }

  // update xGuId
  updateXGuid (newGuid, isLoginKept = false) {
    const days = isLoginKept ? this.cookieValidityDays : 0
    this.xGuId = newGuid
    this.setCookie('xGuId', newGuid, days)
  }

  // update authorization
  updateAuthorization (newAuthorization, isLoginKept = false) {
    const days = isLoginKept ? this.cookieValidityDays : 0
    this.authorization = newAuthorization
    this.setCookie('authorization', newAuthorization, days)
  }

  // delete xGuId authorization
  async clearTokensAndCookies () {
    this.authorization = null
    this.isInitialized = false
    document.cookie = 'authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  // APIリクエストを送信
  async sendRequest (
    path,
    method = 'GET',
    body = null,
    options = {},
  ) {
    if (!this.isInitialized) await this.ensureInitialized()
    this._errors = []
    this._infos = []

    const {
      timer = BASE_TIMER,
      isNotSendErrors = false,
    } = options || {}

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(this.xGuId && { 'X-Guid': this.xGuId }),
        ...(this.authorization && { Authorization: this.authorization }),
      }

      const settings = {
        method,
        headers,
        body  : body !== null ? JSON.stringify(body) : undefined,
        signal: timer ? AbortSignal.timeout(timer) : undefined,
      }

      const res = await fetch(`${ApiRequester.apiBaseUrl}/${path}`, settings)
      const status = res.status

      if (status === 404 || status === 403) throw status

      const json = await res.json()
      const resHeaders = res.headers

      if (json.errors && Array.isArray(json.errors)) this._errors = json.errors
      if (json.infos && Array.isArray(json.infos)) this._infos = json.infos

      return { json, resHeaders }
    } catch (error) {
      if (isNotSendErrors) {
        const errorData = {
          result: 'error',
          errors: [
            {
              abstract: 'APIリクエストが失敗しました', // 共通メッセージ
              cd      : '',
              level   : '4',
              details : [{
                direction: 'request',
                path     : '',
                value    : '',
                message  : '', // エラー個別メッセージ
              }],
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

  // シングルトンパターンでインスタンスを取得
  static getInstance () {
    if (!ApiRequester.instance) ApiRequester.instance = new ApiRequester()
    return ApiRequester.instance
  }

  // x-guid getter
  static getXGuid () {
    const instance = ApiRequester.getInstance()
    return instance.xGuId
  }

  // authorization getter
  static getAuthorization () {
    const instance = ApiRequester.getInstance()
    return instance.authorization
  }

  // static method to change progress status for search page
  static changeProgressStatus (isLoading) {
    ApiRequester.activeRequestCount = isLoading ? 1 : 0
    ApiRequester.updateRequestInProgress()
  }

  static async performAction (path, method, body, options = {}) {
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
