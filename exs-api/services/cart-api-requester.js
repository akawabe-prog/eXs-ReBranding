import { ApiRequester } from './base-api-requester.js';

export class CartApiRequester extends ApiRequester {
    static async fetchCart(body = {}) {
        return (await this.performAction('cart', 'POST', body, {
            isNotSendErrors: true
        })).json;
    }

    static async addItemsToCart(body) {
        return (await this.performAction('cart/details', 'PUT', body)).json;
    }

    static async deleteCartDetails(body) {
        return (await this.performAction('cart/details/delete', 'POST', body)).json;
    }

    static async changeCartDetailQuantity(body) {
        return (await this.performAction('cart/details/quantity', 'PUT', body)).json;
    }
}
