const BASE_TIMER = 0; // 0 means no timeout

export class ApiRequester {
    static instance = null;
    static apiBaseUrl = '';
    static activeRequestCount = 0;

    _errors = [];
    _infos = [];
    _requestInProgress = false;
    cookieValidityDays = 400;
    xGuId = null;
    authorization = null;
    isInitialized = false;

    constructor() {
        if (!ApiRequester.apiBaseUrl) throw new Error('API_BASE_URL is not set');
        this.xGuId = this.getCookie('xGuId');
        this.authorization = this.getCookie('authorization');
        if (!this.xGuId || !this.authorization) {
            this.ensureInitialized().then(() => {
                this.isInitialized = true;
            });
        } else {
            this.isInitialized = true;
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.fetchVerifyToken();
            this.isInitialized = true;
        }
    }

    static setApiBaseUrl(url) {
        ApiRequester.apiBaseUrl = url;
    }

    async fetchVerifyToken() {
        try {
            if (!this.xGuId || !this.authorization) {
                const res = await fetch(`${ApiRequester.apiBaseUrl}/auth/login/before`, { method: 'POST' });
                const { headers } = res;
                if (!this.xGuId) this.xGuId = headers.get('X-Guid');
                if (!this.authorization) this.authorization = headers.get('Authorization');
            }
            if (this.xGuId) this.setCookie('xGuId', this.xGuId, this.cookieValidityDays);
            if (this.authorization) this.setCookie('authorization', this.authorization, this.cookieValidityDays);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    setCookie(name, value, days = this.cookieValidityDays) {
        if (typeof window === 'undefined') return;
        const getMainDomain = (hostname) => {
            const parts = hostname.split('.').reverse();
            if (parts.length >= 2) {
                const secondLevelDomains = ['co', 'com', 'org', 'net', 'gov', 'edu'];
                if (parts.length > 2 && secondLevelDomains.includes(parts[1])) return `.${parts[2]}.${parts[1]}.${parts[0]}`;
                return `.${parts[1]}.${parts[0]}`;
            }
            return hostname;
        };
        const maxAge = days ? `max-age=${days * 24 * 60 * 60};` : '';
        const domain = getMainDomain(window.location.hostname);
        document.cookie = `${name}=${value}; ${maxAge} path=/; Domain=${domain}; Secure; SameSite=Lax;`;
    }

    getCookie(name) {
        if (typeof window === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    }

    getDomain(url, hasSubdomain = false) {
        let normalized = url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
        if (!hasSubdomain) {
            const parts = normalized.split('.');
            if (parts.length > 2) normalized = parts.slice(-2).join('.');
        }
        return normalized;
    }

    handleFetchError(error) {
        if (location.pathname.includes('/sorry')) return;
        switch (error.name) {
            case 'TimeoutError':
                location.replace(`https://www.${this.getDomain(location.href)}/sorry`);
                break;
            case 'TypeError':
                console.error('Network error or CORS issue:', error);
                break;
            default:
                console.error('An error occurred:', error);
        }
    }

    get errors() {
        return this._errors;
    }

    get infos() {
        return this._infos;
    }

    get errorMessages() {
        return this._errors.map((error) => error.abstract ?? '').filter(Boolean);
    }

    get infoMessages() {
        return this._infos.map((info) => info.abstract ?? '').filter(Boolean);
    }

    get requestInProgress() {
        return this._requestInProgress;
    }

    static updateRequestInProgress() {
        const instance = ApiRequester.getInstance();
        instance._requestInProgress = ApiRequester.activeRequestCount > 0;
    }

    updateXGuid(newGuid, isLoginKept = false) {
        const days = isLoginKept ? this.cookieValidityDays : 0;
        this.xGuId = newGuid;
        this.setCookie('xGuId', newGuid, days);
    }

    updateAuthorization(newAuthorization, isLoginKept = false) {
        const days = isLoginKept ? this.cookieValidityDays : 0;
        this.authorization = newAuthorization;
        this.setCookie('authorization', newAuthorization, days);
    }

    async clearTokensAndCookies() {
        this.authorization = null;
        this.isInitialized = false;
        document.cookie = 'authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    async sendRequest(path, method = 'GET', body = null, options = {}) {
        if (!this.isInitialized) await this.ensureInitialized();
        this._errors = [];
        this._infos = [];

        const { timer = BASE_TIMER, isNotSendErrors = false } = options || {};
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.xGuId && { 'X-Guid': this.xGuId }),
                ...(this.authorization && { Authorization: this.authorization })
            };
            const settings = {
                method,
                headers,
                body: body !== null ? JSON.stringify(body) : undefined,
                signal: timer ? AbortSignal.timeout(timer) : undefined
            };
            const res = await fetch(`${ApiRequester.apiBaseUrl}/${path}`, settings);
            const status = res.status;
            if (status === 404 || status === 403) throw status;
            const json = await res.json();
            const resHeaders = res.headers;
            if (json.errors && Array.isArray(json.errors)) this._errors = json.errors;
            if (json.infos && Array.isArray(json.infos)) this._infos = json.infos;
            return { json, resHeaders };
        } catch (error) {
            if (isNotSendErrors) {
                const errorData = {
                    result: 'error',
                    errors: [
                        {
                            abstract: 'APIリクエストが失敗しました',
                            cd: '',
                            level: '4',
                            details: [
                                {
                                    direction: 'request',
                                    path: '',
                                    value: '',
                                    message: ''
                                }
                            ]
                        }
                    ]
                };
                console.error('API request failed:', error, path);
                this._errors = errorData.errors;
                return { json: errorData, resHeaders: undefined };
            }
            this.handleFetchError(error);
            throw error;
        }
    }

    static getInstance() {
        if (!ApiRequester.instance) ApiRequester.instance = new ApiRequester();
        return ApiRequester.instance;
    }

    static getXGuid() {
        const instance = ApiRequester.getInstance();
        return instance.xGuId;
    }

    static getAuthorization() {
        const instance = ApiRequester.getInstance();
        return instance.authorization;
    }

    static changeProgressStatus(isLoading) {
        ApiRequester.activeRequestCount = isLoading ? 1 : 0;
        ApiRequester.updateRequestInProgress();
    }

    static async performAction(path, method, body, options = {}) {
        const instance = ApiRequester.getInstance();
        try {
            ApiRequester.activeRequestCount++;
            ApiRequester.updateRequestInProgress();
            return await instance.sendRequest(path, method, body, options);
        } finally {
            ApiRequester.activeRequestCount--;
            ApiRequester.updateRequestInProgress();
        }
    }
}
