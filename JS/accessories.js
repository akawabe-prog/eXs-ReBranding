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
                <button class="btn--outline w-full py-3 border border-black text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors add-to-cart-btn" data-product-id="${item.id}" data-product-name="${item.name}" data-product-url="${item.url || ''}">カートへ進む</button>
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
            const productUrl = button.getAttribute('data-product-url');
            const feedback = button.parentElement?.querySelector('.cart-feedback');
            if (!productId && productUrl) {
                window.location.href = productUrl;
                return;
            }
            if (!productId) return;

            const setFeedback = (message, isError = false) => {
                if (!feedback) return;
                feedback.textContent = message;
                feedback.classList.toggle('text-red-500', isError);
                feedback.classList.toggle('text-gray-500', !isError);
            };

            button.disabled = true;
            button.classList.add('opacity-60', 'cursor-not-allowed');
            setFeedback('カートへ移動中...');

            try {
                const result = await addItemToCart(productId, 1);
                if (result && result.result === 'error') {
                    const message = result.errors?.[0]?.abstract || 'カート追加に失敗しました。';
                    if (productUrl) {
                        window.location.href = productUrl;
                        return;
                    }
                    setFeedback(message, true);
                    return;
                }
                const cartUrl = window.EXS_API_CONFIG && window.EXS_API_CONFIG.cartUrl;
                if (cartUrl) {
                    window.location.href = cartUrl;
                    return;
                }
                if (productUrl) {
                    window.location.href = productUrl;
                    return;
                }
                setFeedback(`${productName} をカートへ追加しました。`, false);
            } catch (error) {
                console.warn('add to cart failed, fallback message is shown.', error);
                if (productUrl) {
                    window.location.href = productUrl;
                    return;
                }
                setFeedback('API接続待ちのため、商品ページへ遷移できませんでした。', true);
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
        { id: 'acc-001', name: "eXsダックテールヘルメット（マットブラック）", category: "helmet", categoryLabel: "HELMET", compatibility: "全モデル", description: "街乗りに馴染むダックテール形状。落ち着いたマットブラック。", image: "https://placehold.co/600x450/ffffff/333?text=Helmet+Black", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-002', name: "eXsダックテールヘルメット（マットグレー）", category: "helmet", categoryLabel: "HELMET", compatibility: "全モデル", description: "軽快な印象のマットグレー。日常使いしやすい定番カラー。", image: "https://placehold.co/600x450/ffffff/333?text=Helmet+Gray", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-003', name: "eXsダックテールヘルメット（マットアイボリー）", category: "helmet", categoryLabel: "HELMET", compatibility: "全モデル", description: "上品で柔らかな印象のマットアイボリー。", image: "https://placehold.co/600x450/ffffff/333?text=Helmet+Ivory", url: "https://item.rakuten.co.jp/partsdirect/" },

        { id: 'acc-004', name: "eXs Street フェンダーセット（前後）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street", description: "泥はねを抑える純正フェンダーセット。日常走行での快適性を向上。", image: "https://placehold.co/600x450/ffffff/333?text=Fender+Set", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-005', name: "eXs Street リアキャリア", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street", description: "荷物積載をサポートする純正リアキャリア。", image: "https://placehold.co/600x450/ffffff/333?text=Rear+Carrier", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-006', name: "eXs Street 充電器", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street", description: "純正仕様の充電器。予備用としてもおすすめ。", image: "https://placehold.co/600x450/ffffff/333?text=Street+Charger", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-007', name: "20×4.0 タイヤ", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street", description: "オンロード/オフロード両対応のファットタイヤ。", image: "https://placehold.co/600x450/ffffff/333?text=20x4.0+Tire", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-008', name: "20×4.0 ホワイトウォールタイヤ", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs Street", description: "クラシックなルックスを演出するホワイトウォール仕様。", image: "https://placehold.co/600x450/ffffff/333?text=Whitewall+Tire", url: "https://item.rakuten.co.jp/partsdirect/" },

        { id: 'acc-009', name: "eXs 1 TKG サドル", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs 1 TKG", description: "長距離走行時の快適性を高める純正サドル。", image: "https://placehold.co/600x450/ffffff/333?text=Saddle", url: "https://item.rakuten.co.jp/partsdirect39/28021582/" },
        { id: 'acc-010', name: "eXs 1 TKG ハンドルバッグ（大）", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 TKG", description: "日用品やガジェットの収納に便利な大容量タイプ。", image: "https://placehold.co/600x450/ffffff/333?text=Handle+Bag+L", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-011', name: "eXs 1 TKG ハンドルバッグ（小）", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 TKG", description: "必要最低限をスマートに持ち運べるコンパクトタイプ。", image: "https://placehold.co/600x450/ffffff/333?text=Handle+Bag+S", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-012', name: "eXs 1 TKG コンビニフック", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 TKG", description: "買い物袋を掛けられる便利なフック。", image: "https://placehold.co/600x450/ffffff/333?text=Convenience+Hook", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-013', name: "eXs 1 TKG 持ち運びストラップセット", category: "bag", categoryLabel: "BAG", compatibility: "eXs 1 TKG", description: "折りたたみ時の持ち運びを快適にするストラップセット。", image: "https://placehold.co/600x450/ffffff/333?text=Carry+Strap+Set", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-014', name: "eXs 1 用充電器", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "eXs 1 / eXs 1 TKG", description: "eXs 1シリーズ対応の純正充電器。", image: "https://placehold.co/600x450/ffffff/333?text=eXs1+Charger", url: "https://item.rakuten.co.jp/partsdirect/" },

        { id: 'acc-015', name: "TORUNA ワイヤーロック", category: "lock", categoryLabel: "LOCK", compatibility: "全モデル", description: "携帯しやすい定番ワイヤーロック。", image: "https://placehold.co/600x450/ffffff/333?text=TORUNA+Wire+Lock", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-016', name: "TORUNA ジョイントロック", category: "lock", categoryLabel: "LOCK", compatibility: "全モデル", description: "取り回しやすさと防犯性を両立したジョイントタイプ。", image: "https://placehold.co/600x450/ffffff/333?text=TORUNA+Joint+Lock", url: "https://item.rakuten.co.jp/partsdirect/" },

        { id: 'acc-017', name: "スマートエアーマルチポンプ", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "携行しやすいマルチ対応エアポンプ。", image: "https://placehold.co/600x450/ffffff/333?text=Smart+Air+Pump", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-018', name: "WINDPRO P アルミフロアポンプ（ブラック）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "高圧対応のアルミフロアポンプ。ブラックカラー。", image: "https://placehold.co/600x450/ffffff/333?text=WINDPRO+Black", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-019', name: "WINDPRO P アルミフロアポンプ（グレー）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "高圧対応のアルミフロアポンプ。グレーカラー。", image: "https://placehold.co/600x450/ffffff/333?text=WINDPRO+Gray", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-020', name: "WINDPRO P アルミフロアポンプ（レッド）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "高圧対応のアルミフロアポンプ。レッドカラー。", image: "https://placehold.co/600x450/ffffff/333?text=WINDPRO+Red", url: "https://item.rakuten.co.jp/partsdirect/" },
        { id: 'acc-021', name: "WINDPRO P アルミフロアポンプ（ブルー）", category: "maintenance", categoryLabel: "MAINTENANCE", compatibility: "全モデル", description: "高圧対応のアルミフロアポンプ。ブルーカラー。", image: "https://placehold.co/600x450/ffffff/333?text=WINDPRO+Blue", url: "https://item.rakuten.co.jp/partsdirect/" }
    ];
}
