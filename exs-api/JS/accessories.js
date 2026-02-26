/* =========================================
   JS/accessories.js - アクセサリーページ用スクリプト
   ========================================= */
import { ProductApiRequester } from './services/product-api-requester.js';
import { initApiClient, verifyLogin, addItemToCart } from './api-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('.grid');
    const filterButtons = document.querySelectorAll('.filter__item');
    
    // ローディング表示
    if (grid) grid.innerHTML = '<div class="col-span-full text-center py-20"><i class="fa-solid fa-spinner fa-spin text-3xl text-gray-300"></i></div>';

    // APIクライアント初期化（exs-api仕様に合わせる）
    initApiClient((window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl) || undefined);
    try {
        await verifyLogin();
    } catch (error) {
        console.warn('[accessories] verifyLogin failed', error);
    }

    try {
        // APIからデータ取得
        const accessories = await fetchAccessoriesData();
        
        // 初期表示
        renderAccessories(accessories, grid);
        
        // フィルタリング設定
        setupFilters(accessories, filterButtons, grid);
        
    } catch (error) {
        console.error('Accessories fetch error:', error);
        if (grid) grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">データの取得に失敗しました。</div>';
    }
});

async function fetchAccessoriesData() {
    try {
        const queryApiUrl = new URLSearchParams(window.location.search).get('api');
        const configuredApiUrl = window.EXS_API_CONFIG && window.EXS_API_CONFIG.accessoriesUrl;
        const apiUrl = queryApiUrl || configuredApiUrl;

        // 設定URLがある場合は直接取得（商品ページと同一方針）
        if (apiUrl) {
            const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const json = await response.json();
            const raw = json.data || json.products || json.items || json;
            if (Array.isArray(raw) && raw.length > 0) return raw;
        }

        // ProductApiRequesterを使用してAPIリクエスト（既存互換）
        const response = await ProductApiRequester.fetchAccessories();
        
        // レスポンスの形式に合わせてデータを抽出 (例: response.data や response.products など)
        if (response && response.data) {
            return response.data;
        }
        
        // データが空、またはAPI未実装の場合はモックデータを返す
        console.warn('API returned empty data, using mock data.');
        return getMockData();

    } catch (e) {
        console.warn('API request failed, using mock data.', e);
        // エラー時はモックデータをフォールバックとして使用
        return getMockData();
    }
}

function renderAccessories(items, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">該当する商品がありません。</div>';
        return;
    }

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card bg-white border border-gray-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg opacity-0';
        card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`;
        
        // 画像がない場合のプレースホルダー
        const imgSrc = item.image || `https://placehold.co/600x450/eee/333?text=${encodeURIComponent(item.name)}`;

        card.innerHTML = `
            <div class="card__image aspect-[4/3] bg-gray-50 overflow-hidden">
                <img src="${imgSrc}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
            </div>
            <div class="card__body p-5">
                <span class="card__tag text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-1">${item.categoryLabel || item.category}</span>
                <h3 class="card__title text-lg font-bold mb-2 leading-tight">${item.name}</h3>
                <span class="card__compatibility text-xs font-bold text-gray-500 block mb-3">対応: ${item.compatibility || '全モデル'}</span>
                <p class="card__desc text-sm text-gray-600 mb-5 leading-relaxed line-clamp-2">${item.description}</p>
                <button class="btn--outline w-full py-3 border border-black text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors add-to-cart-btn" data-product-id="${item.id}" data-product-name="${item.name}">カートに追加</button>
                <p class="mt-3 text-xs text-center text-gray-500 min-h-[1rem] cart-feedback" aria-live="polite"></p>
            </div>
        `;
        container.appendChild(card);
    });

    setupAddToCartButtons(container);
}

function setupFilters(items, buttons, container) {
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // スタイルのリセットと適用
            buttons.forEach(b => {
                b.classList.remove('active', 'bg-brand-black', 'text-white');
                b.classList.add('bg-transparent', 'text-brand-black');
            });
            btn.classList.remove('bg-transparent', 'text-brand-black');
            btn.classList.add('active', 'bg-brand-black', 'text-white');

            const filter = btn.getAttribute('data-filter');
            
            // フィルタリング実行
            const filteredItems = filter === 'all' 
                ? items 
                : items.filter(item => item.category === filter);
            
            renderAccessories(filteredItems, container);
        });
    });
}

function setupAddToCartButtons(container) {
    const buttons = container.querySelectorAll('.add-to-cart-btn');
    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const productId = button.getAttribute('data-product-id');
            const productName = button.getAttribute('data-product-name') || '商品';
            const feedback = button.parentElement?.querySelector('.cart-feedback');
            if (!productId) return;

            const setFeedback = (message, isError = false) => {
                if (!feedback) return;
                feedback.textContent = message;
                feedback.classList.toggle('text-red-500', isError);
                feedback.classList.toggle('text-gray-500', !isError);
            };

            button.disabled = true;
            button.classList.add('opacity-60', 'cursor-not-allowed');
            setFeedback('カートに追加中...');

            try {
                const result = await addItemToCart(productId, 1);
                if (result && result.result === 'error') {
                    const message = result.errors?.[0]?.abstract || 'カート追加に失敗しました。';
                    setFeedback(message, true);
                    return;
                }
                setFeedback(`${productName} をカートに追加しました。`);
            } catch (error) {
                console.warn('add to cart failed, fallback message is shown.', error);
                setFeedback('API接続待ちのため、カート追加は準備中です。', true);
            } finally {
                button.disabled = false;
                button.classList.remove('opacity-60', 'cursor-not-allowed');
            }
        });
    });
}

// モックデータ (API実装までの仮データ)
function getMockData() {
    return [
        { id: '1', name: "eXs オリジナルヘルメット", category: "helmet", categoryLabel: "HELMET", compatibility: "全モデル", description: "安全性とデザインを両立したマットブラック仕様のハードシェルヘルメット。", image: "https://placehold.co/600x450/eee/333?text=eXs+Helmet" },
        { id: '2', name: "ダイヤル式ワイヤーロック", category: "lock", categoryLabel: "LOCK", compatibility: "全モデル", description: "持ち運びに便利なコンパクト設計。4桁のダイヤルでセキュリティも安心。", image: "https://placehold.co/600x450/eee/333?text=Wire+Lock" },
        { id: '3', name: "eXs フロントバッグ", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 / eXs 1 TKG", description: "ハンドルバーに装着可能な防水仕様のハードシェルバッグ。充電器の収納に最適。", image: "https://placehold.co/600x450/eee/333?text=Front+Bag" },
        { id: '4', name: "フロアポンプ（米式対応）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street / eXs 2", description: "エアゲージ付きで正確な空気圧管理が可能。ファットタイヤにも対応。", image: "https://placehold.co/600x450/eee/333?text=Air+Pump" },
        { id: '5', name: "eXs 1用 キャリーバッグ", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 / eXs 1 TKG", description: "電車やバスへの持ち込みに必須の専用輪行バッグ。丈夫なナイロン素材採用。", image: "https://placehold.co/600x450/eee/333?text=Carry+Bag" },
        { id: '6', name: "メンテナンスマルチツール", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "六角レンチやドライバーがセットになった携帯用工具セット。", image: "https://placehold.co/600x450/eee/333?text=Multi+Tool" }
    ];
}
