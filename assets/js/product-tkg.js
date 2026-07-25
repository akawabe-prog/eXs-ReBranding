/* =========================================
   JS/product-tkg.js - eXs 1 TKG 商品ページ用スクリプト
   ========================================= */
import { initApiClient } from './api-client.js';
import { ProductApiRequester } from './services/product-api-requester-init.js';
import { CartApiRequester } from './services/cart-api-requester-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const typeContainer = document.getElementById('product-type-container');
    const optionsContainer = document.getElementById('product-options-container');
    const basePriceEl = document.getElementById('base-price');
    const totalPriceEl = document.getElementById('total-price');
    const rakutenBtn = document.getElementById('rakuten-link-btn');
    const yahooBtn = document.getElementById('yahoo-link-btn');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // ローディング表示
    if (typeContainer) typeContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-gray-300"></i></div>';
    if (optionsContainer) optionsContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-gray-300"></i></div>';

    initApiClient(
        (window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl) || undefined,
        (window.EXS_API_CONFIG && window.EXS_API_CONFIG.initApiBaseUrl) || undefined,
    );

    try {
        // 商品ID (仮)
        const productId = 'exs-1-tkg';
        const productData = await fetchProductData(productId);

        if (productData) {
            if (productData.productTypes) {
                renderProductTypes(productData.productTypes, typeContainer);
            }
            if (productData.options) {
                renderOptions(productData.options, optionsContainer);
            }
            
            // 計算ロジックの初期化
            setupStateCalculator(basePriceEl, totalPriceEl, rakutenBtn, yahooBtn);

            if (addToCartBtn) {
                setupAddToCart(addToCartBtn);
            }
        }

    } catch (error) {
        console.error('Product fetch error:', error);
        if (typeContainer) typeContainer.innerHTML = '<div class="text-xs text-red-500">読み込みエラー</div>';
        if (optionsContainer) optionsContainer.innerHTML = '<div class="text-xs text-red-500">読み込みエラー</div>';
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

function renderProductTypes(types, container) {
    if (!container) return;
    container.innerHTML = '';

    types.forEach(type => {
        const label = document.createElement('label');
        label.className = 'cursor-pointer group relative border border-gray-200 p-4 rounded hover:bg-gray-50 transition has-[:checked]:border-black has-[:checked]:bg-gray-50';
        
        const badgeHtml = type.badge ? `<span class="absolute -top-2 right-4 z-20 bg-brand-stripe text-white text-[10px] px-2 py-0.5 font-bold tracking-wider rounded-full">${type.badge}</span>` : '';
        const checkedAttr = type.isDefault ? 'checked' : '';

        label.innerHTML = `
            <input type="radio" name="product_type" class="peer sr-only" data-id="${type.id}" data-price="${type.price}" data-rakuten-url="${type.rakutenUrl}" data-yahoo-url="${type.yahooUrl}" ${checkedAttr}>
            <div class="flex justify-between items-center">
                <span class="font-bold text-sm">${type.name}</span>
                <span class="text-sm font-en">${type.price.toLocaleString()}円</span>
            </div>
            ${badgeHtml}
            <div class="absolute inset-0 z-10 border-2 border-black rounded opacity-0 peer-checked:opacity-100 pointer-events-none"></div>
        `;
        container.appendChild(label);
    });
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
            <span class="text-sm font-en text-gray-500">+ ¥${opt.price.toLocaleString()}</span>
        `;
        wrapper.appendChild(label);
    });

    container.appendChild(wrapper);
}

function setupStateCalculator(basePriceEl, totalPriceEl, rakutenBtn, yahooBtn) {
    const formatYen = (num) => `${num.toLocaleString('ja-JP')}円`;

    const updateState = () => {
        const selectedType = document.querySelector('input[name="product_type"]:checked');
        if (!selectedType) return;

        const basePrice = parseInt(selectedType.dataset.price || '0', 10);
        let optionsTotal = 0;
        
        document.querySelectorAll('.option-checkbox').forEach(cb => {
            if (cb.checked) optionsTotal += parseInt(cb.dataset.price || '0', 10);
        });

        if (basePriceEl) basePriceEl.textContent = formatYen(basePrice);
        if (totalPriceEl) totalPriceEl.textContent = formatYen(basePrice + optionsTotal);

        if (rakutenBtn) rakutenBtn.href = selectedType.dataset.rakutenUrl || '#';
        if (yahooBtn) yahooBtn.href = selectedType.dataset.yahooUrl || '#';
    };

    // イベントリスナー登録 (動的要素の親コンテナに委譲、または生成後に登録)
    // ここでは生成済み要素に対して直接登録
    document.querySelectorAll('input[name="product_type"]').forEach(el => el.addEventListener('change', updateState));
    document.querySelectorAll('.option-checkbox').forEach(el => el.addEventListener('change', updateState));

    // 初期実行
    updateState();
}

function setupAddToCart(btn) {
    btn.addEventListener('click', async () => {
        const selectedType = document.querySelector('input[name="product_type"]:checked');
        if (!selectedType) {
            alert('商品タイプを選択してください');
            return;
        }
        
        // ローディング状態
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ADDING...';

        try {
            await CartApiRequester.addItemsToCart({ id: selectedType.dataset.id, quantity: 1, site: 'exs' });
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
        id: 'exs-1-tkg',
        name: 'eXs 1 TKG',
        productTypes: [
            {
                id: '27882603',
                name: 'eXs 1 TKG (車体のみ)',
                price: 59080,
                rakutenUrl: 'https://item.rakuten.co.jp/partsdirect/27882603/',
                yahooUrl: 'https://store.shopping.yahoo.co.jp/partsdirect2/27882603.html',
                isDefault: true
            },
            {
                id: '28021582',
                name: 'eXs 1 TKG + サドルセット',
                price: 68880,
                rakutenUrl: 'https://item.rakuten.co.jp/partsdirect39/28021582/',
                yahooUrl: 'https://store.shopping.yahoo.co.jp/partsdirect2/28021582.html',
                badge: 'POPULAR'
            },
            {
                id: '28021599',
                name: 'eXs 1 TKG + ハンドルバッグセット',
                price: 61060,
                rakutenUrl: 'https://item.rakuten.co.jp/partsdirect/28021599/',
                yahooUrl: 'https://store.shopping.yahoo.co.jp/partsdirect2/28021599.html'
            }
        ],
        options: [
            { id: 'opt-1', name: 'eXsオリジナルヘルメット', price: 4500 },
            { id: 'opt-2', name: 'ワイヤーロック', price: 2200 },
            { id: 'opt-3', name: '自賠責保険加入代行（1年）', price: 7000 }
        ]
    };
}
