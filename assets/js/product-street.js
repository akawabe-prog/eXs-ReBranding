/* =========================================
   JS/product-street.js - eXs Street 商品ページ用スクリプト
   ========================================= */
import { initApiClient } from './api-client.js';
import { ProductApiRequester } from './services/product-api-requester-init.js';
import { CartApiRequester } from './services/cart-api-requester-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const optionsContainer = document.getElementById('product-options-container');
    const basePriceEl = document.getElementById('base-price');
    const totalPriceEl = document.getElementById('total-price');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    
    // ローディング表示
    if (optionsContainer) optionsContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-gray-300"></i></div>';

    initApiClient(
        (window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl) || undefined,
        (window.EXS_API_CONFIG && window.EXS_API_CONFIG.initApiBaseUrl) || undefined,
    );

    try {
        // 商品ID (仮)
        const productId = 'exs-street'; 
        const productData = await fetchProductData(productId);
        
        if (productData && productData.options) {
            renderOptions(productData.options, optionsContainer);
            setupPriceCalculator(basePriceEl, totalPriceEl);
            
            if (addToCartBtn) {
                setupAddToCart(addToCartBtn, productId);
            }
        } else {
             if (optionsContainer) optionsContainer.innerHTML = '<p class="text-xs text-gray-400">オプションはありません</p>';
        }

    } catch (error) {
        console.error('Product fetch error:', error);
        if (optionsContainer) optionsContainer.innerHTML = '<div class="text-xs text-red-500">オプション情報の取得に失敗しました。</div>';
    }
});

async function fetchProductData(id) {
    try {
        const response = await ProductApiRequester.fetchProductDetail(id);
        if (response && response.data) return response.data;
        
        console.warn('API returned empty data, using mock data.');
        return getMockProductData();
    } catch (e) {
        console.warn('API request failed, using mock data.', e);
        return getMockProductData();
    }
}

function renderOptions(options, container) {
    if (!container) return;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-3';

    options.forEach(opt => {
        const label = document.createElement('label');
        label.className = 'flex items-center justify-between p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition';
        label.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" class="w-4 h-4 text-black border-gray-300 rounded focus:ring-black accent-black option-checkbox" data-price="${opt.price}">
                <span class="ml-3 text-sm font-medium">${opt.name}</span>
            </div>
            <span class="text-sm font-en text-gray-500">+ ${opt.price.toLocaleString()}円</span>
        `;
        wrapper.appendChild(label);
    });

    container.appendChild(wrapper);
}

function setupPriceCalculator(basePriceEl, totalPriceEl) {
    if (!basePriceEl || !totalPriceEl) return;

    const basePrice = parseInt(basePriceEl.dataset.price || '0', 10);
    const formatYen = (num) => `${num.toLocaleString('ja-JP')}円`;

    const updateTotal = () => {
        let optionsTotal = 0;
        document.querySelectorAll('.option-checkbox').forEach(cb => {
            if (cb.checked) {
                optionsTotal += parseInt(cb.dataset.price || '0', 10);
            }
        });
        totalPriceEl.textContent = formatYen(basePrice + optionsTotal);
    };

    // 動的に生成されたチェックボックスにイベントリスナーを設定
    document.querySelectorAll('.option-checkbox').forEach(cb => {
        cb.addEventListener('change', updateTotal);
    });
    
    // 初期計算
    updateTotal();
}

function setupAddToCart(btn, productId) {
    btn.addEventListener('click', async () => {
        // ローディング状態
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ADDING...';

        try {
            // カート追加API呼び出し
            await CartApiRequester.addItemsToCart({ id: productId, quantity: 1, site: 'exs' });
            alert('カートに追加しました');
        } catch (e) {
            console.error('Cart add error:', e);
            alert('カートへの追加に失敗しました');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

function getMockProductData() {
    return {
        id: 'exs-street',
        name: 'eXs Street',
        basePrice: 149800,
        options: [
            { id: 'opt-1', name: 'リアキャリア', price: 5478 },
            { id: 'opt-2', name: '前後フェンダーセット', price: 7678 }
        ]
    };
}
