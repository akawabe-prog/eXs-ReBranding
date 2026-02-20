import { ApiRequester } from './base-api-requester.js';

const TIMER = 15000;

export class AuthApiRequester extends ApiRequester {
    constructor() {
        super();
    }

    static async verifyLogin() {
        const instance = this.getInstance();
        const options = { timer: TIMER };
        const res = (await instance.sendRequest('auth/login/verify', 'POST', undefined, options)).json;

        if (res.result === 'error' && res.errors && res.errors.some((e) => e.cd === 'COM3002' || e.cd === 'COM3005')) {
            await instance.clearTokensAndCookies();
            await instance.ensureInitialized();
            const xGuId = ApiRequester.getXGuid();
            if (xGuId) instance.updateXGuid(xGuId, true);
            return (await instance.sendRequest('auth/login/verify', 'POST', undefined, options)).json;
        }
        return res;
    }
}
