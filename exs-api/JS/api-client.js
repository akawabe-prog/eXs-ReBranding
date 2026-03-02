import { ApiRequester } from './services/base-api-requester.js';
import { AuthApiRequester } from './services/auth-api-requester.js';
import { CartApiRequester } from './services/cart-api-requester.js';

const API_BASE_URL = 'https://api-e.customjapan.net/api/v1';

export const initApiClient = (apiBaseUrl = API_BASE_URL) => {
    ApiRequester.setApiBaseUrl(apiBaseUrl);
};

export const verifyLogin = async () => {
    const res = await AuthApiRequester.verifyLogin();
    return res;
};

export const fetchCart = async () => {
    const res = await CartApiRequester.fetchCart();
    return res;
};

export const addItemToCart = async (id, quantity) => {
    const addedItems = {
        items: [{
            id,
            quantity,
            site: 'exs'
        }]
    };
    const res = await CartApiRequester.addItemsToCart(addedItems);
    return res;
};

export const deleteCartItem = async (cartDetails) => {
    const req = cartDetails.map((detail) => ({
        details: {
            no: detail.no,
            exclCnt: detail.exclCnt
        }
    }));
    const res = await CartApiRequester.deleteCartDetails(req);
    return res;
};

export const clearCart = async () => {
    const cart = await fetchCart();
    if (!cart || !cart.details || cart.details.length === 0) return;
    const req = cart.details;
    const res = await CartApiRequester.deleteCartDetails(req);
    return res;
};
