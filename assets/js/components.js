/* =========================================
   JS/components.js - 共通ヘッダー＆フッター
   ========================================= */

// サイト内のリンク先定義（ルート相対パスで統一し、どの階層からでも正しく遷移するようにする）
const COMPONENTS_CONFIG = window.EXS_COMPONENTS_CONFIG || {};
const SITE_ORIGIN = COMPONENTS_CONFIG.siteOrigin || 'https://exs.mobi';

const DEFAULT_PATHS = {
    home: `${SITE_ORIGIN}/`,
    about: `${SITE_ORIGIN}/about`,
    ebike_intro: 'https://exs.customjapan.net/product/exs-street',
    ebike_buy: 'https://exs.customjapan.net/product/exs-street/purchase',
    kickboard_intro: 'https://exs.customjapan.net/product/exs-1-tkg',
    kickboard_buy: 'https://exs.customjapan.net/product/exs-1-tkg/purchase',
    cart: 'https://www.customjapan.net/cart?site=exs',
    accessories: 'https://exs.customjapan.net/accessories',
    news: `${SITE_ORIGIN}/news`,
    developer: `${SITE_ORIGIN}/developer`,
    partner: `${SITE_ORIGIN}/partner`,
    partner_list: `${SITE_ORIGIN}/partner-list`,
    column: `${SITE_ORIGIN}/colum`,
    support: `${SITE_ORIGIN}/support`,
    contact: `${SITE_ORIGIN}/contact`,
    privacy: `${SITE_ORIGIN}/policy`,
    company: `${SITE_ORIGIN}/company`,
    faq: 'https://exs.customjapan.net/faq',
    instagram: 'https://www.instagram.com/exs.mobi/',
    facebook: 'https://www.facebook.com/exs.mobi',
    youtube: 'https://www.youtube.com/@CustomJapan39'
};
const PATHS = {
    ...DEFAULT_PATHS,
    ...(COMPONENTS_CONFIG.paths || {})
};

const CURRENT_SCRIPT = document.currentScript;
const COMPONENTS_SCRIPT_URL = (CURRENT_SCRIPT && CURRENT_SCRIPT.src)
    ? CURRENT_SCRIPT.src
    : new URL('/assets/js/components.js', window.location.origin).href;
const LOGO_SRC = COMPONENTS_CONFIG.logoSrc || '/assets/images/img/eXs_logo_white.svg';
const CART_ICON_SVG = `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="20" r="1.25"></circle>
        <circle cx="18" cy="20" r="1.25"></circle>
        <path d="M3 4h2.2l1.9 9.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 7H6.1"></path>
    </svg>
`;

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    highlightCurrentNav();
    initCartBadge();
});

// ヘッダー生成
function renderHeader() {
    const headerContainer = document.getElementById('common-header');
    if (!headerContainer) return;

    headerContainer.className = 'fixed w-full top-0 z-50 transition-all duration-300 bg-brand-black text-white';

    const headerHTML = `
    <div class="container mx-auto px-6 h-20 flex justify-between items-center relative z-50">
        <a href="${PATHS.home}" class="hover:opacity-70 transition inline-flex items-center">
            <img src="${LOGO_SRC}" alt="eXs ロゴ" class="h-8 md:h-9 w-auto object-contain">
        </a>

        <nav class="hidden lg:flex space-x-6 text-xs font-en tracking-widest font-medium items-center">
            <a href="${PATHS.about}" class="nav-item hover:opacity-60 transition">ABOUT</a>
            <div class="relative group">
                <a href="${PATHS.ebike_intro}" class="nav-item hover:opacity-60 transition">E-BIKE</a>
                <span class="absolute left-0 top-full h-2 w-full"></span>
                <div class="absolute left-0 top-full mt-2 w-44 bg-white text-brand-black border border-gray-200 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                    <a href="${PATHS.ebike_intro}" class="block px-4 py-3 text-[10px] tracking-widest hover:bg-gray-50">ABOUT eXs Street</a>
                    <a href="${PATHS.ebike_buy}" class="block px-4 py-3 text-[10px] tracking-widest hover:bg-gray-50">BUY eXs Street</a>
                </div>
            </div>
            <div class="relative group">
                <a href="${PATHS.kickboard_intro}" class="nav-item hover:opacity-60 transition">KICKBOARD</a>
                <span class="absolute left-0 top-full h-2 w-full"></span>
                <div class="absolute left-0 top-full mt-2 w-44 bg-white text-brand-black border border-gray-200 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                    <a href="${PATHS.kickboard_intro}" class="block px-4 py-3 text-[10px] tracking-widest hover:bg-gray-50">About eXs 1 TKG</a>
                    <a href="${PATHS.kickboard_buy}" class="block px-4 py-3 text-[10px] tracking-widest hover:bg-gray-50">Buy eXs 1 TKG</a>
                </div>
            </div>
            <a href="${PATHS.accessories}" class="nav-item hover:opacity-60 transition">ACCESSORIES</a>
            <a href="${PATHS.news}" class="nav-item hover:opacity-60 transition">NEWS</a>
            <div class="relative group">
                <a href="${PATHS.partner}" class="nav-item hover:opacity-60 transition">PARTNER</a>
                <span class="absolute left-0 top-full h-2 w-full"></span>
                <div class="absolute left-0 top-full mt-2 w-56 bg-white text-brand-black border border-gray-200 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                    <a href="${PATHS.partner_list}" class="block px-4 py-3 hover:bg-gray-50">
                        <span class="block text-[10px] tracking-widest">BRAND PARTNER</span>
                        <span class="block text-[10px] text-gray-500 mt-0.5">正規販売店</span>
                    </a>
                    <a href="${PATHS.partner}" class="block px-4 py-3 hover:bg-gray-50">
                        <span class="block text-[10px] tracking-widest">PARTNER REGISTER</span>
                        <span class="block text-[10px] text-gray-500 mt-0.5">お取扱いを検討中の方</span>
                    </a>
                </div>
            </div>
            <a href="${PATHS.column}" class="nav-item hover:opacity-60 transition">COLUMN</a>
            <a href="${PATHS.support}" class="nav-item hover:opacity-60 transition">SUPPORT</a>
            <a href="${getCartPageUrl()}" class="relative inline-flex items-center justify-center hover:opacity-70 transition" aria-label="カート">
                ${CART_ICON_SVG}
                <span id="cart-count-badge" class="absolute -top-2 -right-3 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-5 text-center hidden">0</span>
            </a>
            <a href="${PATHS.contact}" class="bg-white text-black px-4 py-2 hover:bg-gray-200 transition shadow-sm border border-gray-200">CONTACT</a>
        </nav>

        <div class="lg:hidden flex items-center gap-4">
            <a href="${getCartPageUrl()}" class="relative inline-flex items-center justify-center hover:opacity-70 transition" aria-label="カート">
                ${CART_ICON_SVG}
                <span id="cart-count-badge-mobile" class="absolute -top-2 -right-3 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-5 text-center hidden">0</span>
            </a>
            <button id="menu-btn" class="focus:outline-none w-8 h-8 flex flex-col justify-center items-end gap-1.5 z-50 relative" aria-label="メニュー">
                <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
                <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
                <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
            </button>
        </div>
    </div>

    <div id="mobile-menu" class="fixed inset-0 bg-[#111111]/95 backdrop-blur-md text-white flex flex-col justify-center items-center opacity-0 pointer-events-none transition-opacity duration-300 z-40">
        <nav class="flex flex-col space-y-6 text-center font-en text-lg tracking-widest">
            <a href="${PATHS.home}" class="mobile-link hover:text-gray-400">HOME</a>
            <a href="${PATHS.about}" class="mobile-link hover:text-gray-400">ABOUT</a>
            <a href="${PATHS.ebike_intro}" class="mobile-link hover:text-gray-400">E-BIKE</a>
            <a href="${PATHS.kickboard_intro}" class="mobile-link hover:text-gray-400">KICKBOARD</a>
            <a href="${PATHS.accessories}" class="mobile-link hover:text-gray-400">ACCESSORIES</a>
            <a href="${PATHS.news}" class="mobile-link hover:text-gray-400">NEWS</a>
            <a href="${PATHS.partner}" class="mobile-link hover:text-gray-400">PARTNER</a>
            <a href="${PATHS.column}" class="mobile-link hover:text-gray-400">COLUMN</a>
            <a href="${PATHS.support}" class="mobile-link hover:text-gray-400">SUPPORT</a>
            <a href="${getCartPageUrl()}" class="mobile-link hover:text-gray-400">CART</a>
            <a href="${PATHS.contact}" class="mobile-link hover:text-gray-400">CONTACT</a>
        </nav>
    </div>
    `;

    headerContainer.innerHTML = headerHTML;
    initMobileMenu();
}

// フッター生成
function renderFooter() {
    const footerContainer = document.getElementById('common-footer');
    if (!footerContainer) return;

    const footerHTML = `
    <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_minmax(560px,1.45fr)] gap-12 items-start mb-16">
            <div>
                <a href="${PATHS.home}" class="mb-6 block hover:opacity-70 transition">
                    <img src="${LOGO_SRC}" alt="eXs ロゴ" class="h-10 w-auto object-contain">
                </a>
                <p class="text-xs text-gray-400 leading-relaxed mb-4">Custom Japan Co., Ltd.<br>株式会社カスタムジャパン</p>
                <p class="text-xs text-gray-500">大阪市中央区日本橋2-9-16<br>日本橋センタービル6F</p>
            </div>
            <div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-8 font-en text-xs tracking-widest">
                <div class="w-full flex flex-col space-y-4">
                    <a href="${PATHS.ebike_intro}" class="hover:text-gray-400 transition">eXs Street (商品詳細)</a>
                    <a href="${PATHS.ebike_buy}" class="hover:text-gray-400 transition">eXs Street (購入)</a>
                    <a href="${PATHS.kickboard_intro}" class="hover:text-gray-400 transition">eXs 1 TKG (商品詳細)</a>
                    <a href="${PATHS.kickboard_buy}" class="hover:text-gray-400 transition">eXs 1 TKG (購入)</a>
                    <a href="${PATHS.accessories}" class="hover:text-gray-400 transition">ACCESSORIES</a>
                </div>
                <div class="w-full flex flex-col space-y-4">
                    <a href="${PATHS.about}" class="hover:text-gray-400 transition">ABOUT</a>
                    <a href="${PATHS.news}" class="hover:text-gray-400 transition">NEWS</a>
                    <a href="${PATHS.column}" class="hover:text-gray-400 transition">COLUMN</a>
                    <a href="${PATHS.partner}" class="hover:text-gray-400 transition">PARTNER</a>
                    <a href="${PATHS.developer}" class="hover:text-gray-400 transition">DEVELOPER INTERVIEW</a>
                </div>
                <div class="w-full flex flex-col space-y-4">
                    <a href="${PATHS.faq}" class="hover:text-gray-400 transition">FAQ</a>
                    <a href="${PATHS.support}" class="hover:text-gray-400 transition">SUPPORT</a>
                    <a href="${PATHS.contact}" class="hover:text-gray-400 transition">CONTACT</a>
                    <a href="${PATHS.company}" class="hover:text-gray-400 transition">COMPANY</a>
                    <a href="${PATHS.privacy}" class="hover:text-gray-400 transition">PRIVACY POLICY</a>
                </div>
            </div>
        </div>
        <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-en">
            <p>&copy; 2026 eXs / Custom Japan Co., Ltd.</p>
            <div class="flex space-x-6 mt-4 md:mt-0">
                <a href="${PATHS.instagram}" class="hover:text-white transition"><i class="fa-brands fa-instagram text-lg"></i></a>
                <a href="${PATHS.facebook}" class="hover:text-white transition"><i class="fa-brands fa-facebook-f text-lg"></i></a>
                <a href="${PATHS.youtube}" class="hover:text-white transition"><i class="fa-brands fa-youtube text-lg"></i></a>
            </div>
        </div>
    </div>
    `;
    footerContainer.innerHTML = footerHTML;
}

// モバイルメニュー制御
function initMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-link');
    const header = document.getElementById('common-header');
    
    if (!menuBtn || !mobileMenu) return;

    function toggleMenu() {
        const isOpen = mobileMenu.classList.contains('opacity-100');
        const spans = menuBtn.querySelectorAll('span');

        if (!isOpen) {
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
            mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
            spans[0].classList.add('rotate-45', 'translate-y-2');
            spans[1].classList.add('opacity-0');
            spans[2].classList.add('-rotate-45', '-translate-y-2');
            if (header) header.classList.add('bg-brand-black', 'text-white');
            document.body.style.overflow = 'hidden';
        } else {
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            spans[0].classList.remove('rotate-45', 'translate-y-2');
            spans[1].classList.remove('opacity-0');
            spans[2].classList.remove('-rotate-45', '-translate-y-2');
            if (header) {
                header.classList.remove('bg-white', 'bg-white/90', 'bg-white/95', 'text-brand-black', 'text-black');
                header.classList.add('bg-brand-black', 'text-white');
            }
            document.body.style.overflow = '';
        }
    }

    menuBtn.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('opacity-100')) toggleMenu();
        });
    });
}

function highlightCurrentNav() {
    const currentPath = normalizeRoute(window.location.pathname);
    document.querySelectorAll('.nav-item').forEach(link => {
        const href = normalizeRoute(link.getAttribute('href'));
        if (href && href === currentPath && currentPath !== 'index') {
            link.classList.add('border-b', 'border-current');
            link.classList.remove('hover:opacity-60');
        }
    });
}

function getCartPageUrl() {
    return (window.EXS_API_CONFIG && window.EXS_API_CONFIG.cartUrl) || PATHS.cart;
}

function initCartBadge() {
    const desktopBadge = document.getElementById('cart-count-badge');
    const mobileBadge = document.getElementById('cart-count-badge-mobile');
    if (!desktopBadge && !mobileBadge) return;

    const apiBaseUrl = (window.EXS_API_CONFIG && window.EXS_API_CONFIG.apiBaseUrl)
        || 'https://api-e.customjapan.net/api/v1';
    const initApiBaseUrl = (window.EXS_API_CONFIG && window.EXS_API_CONFIG.initApiBaseUrl)
        || 'https://api-i.customjapan.net/api/v1';
    let refreshInFlight = null;

    const getCookie = (name) => {
        const encodedName = `${encodeURIComponent(name)}=`;
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        const found = cookies.find((cookie) => cookie.startsWith(encodedName));
        return found ? decodeURIComponent(found.slice(encodedName.length)) : '';
    };

    const setCookie = (name, value) => {
        if (!value) return;
        const parts = window.location.hostname.split('.').reverse();
        let domain = window.location.hostname;
        if (parts.length >= 2) {
            const secondLevelDomains = ['co', 'com', 'org', 'net', 'gov', 'edu'];
            domain = (parts.length > 2 && secondLevelDomains.includes(parts[1]))
                ? `.${parts[2]}.${parts[1]}.${parts[0]}`
                : `.${parts[1]}.${parts[0]}`;
        }
        document.cookie = `${name}=${value}; path=/; Domain=${domain}; Secure; SameSite=Lax;`;
    };

    const setBadgeCount = (count) => {
        [desktopBadge, mobileBadge].forEach((badge) => {
            if (!badge) return;
            if (count > 0) {
                badge.textContent = String(count);
                badge.classList.remove('hidden');
            } else {
                badge.textContent = '0';
                badge.classList.add('hidden');
            }
        });
    };

    const sumCartCount = (payload) => {
        const cart = payload?.data || payload || {};
        const details = Array.isArray(cart.details) ? cart.details : [];
        return details.reduce((sum, detail) => {
            const quantity = Number(
                detail?.quantity ??
                detail?.cnt ??
                detail?.count ??
                detail?.item?.quantity ??
                1
            );
            return sum + ((Number.isFinite(quantity) && quantity > 0) ? quantity : 1);
        }, 0);
    };

    const ensureApiSession = async (force = false) => {
        if (!force && getCookie('guid')) return;
        const response = await fetch(`${initApiBaseUrl}/init`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-cache' // 必須: Safariが別ログイン状態のレスポンスを使い回すのを防ぐ
        });
        if (!response.ok) throw new Error(`Init API request failed: ${response.status}`);
    };

    const fetchCartCount = async () => {
        await ensureApiSession();

        let response = await fetch(`${apiBaseUrl}/cart`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: '{}'
        });

        if (response.status === 401 || response.status === 403) {
            await ensureApiSession(true);
            response = await fetch(`${apiBaseUrl}/cart`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: '{}'
            });
        }

        if (!response.ok) throw new Error(`Cart API request failed: ${response.status}`);
        const json = await response.json();
        return sumCartCount(json);
    };

    const refreshBadge = async () => {
        if (refreshInFlight) return refreshInFlight;
        refreshInFlight = (async () => {
            try {
                const count = await fetchCartCount();
                setBadgeCount(count);
            } catch (error) {
                console.warn('[components] cart badge refresh failed', error);
                setBadgeCount(0);
            } finally {
                refreshInFlight = null;
            }
        })();
        return refreshInFlight;
    };

    window.refreshExsCartBadge = refreshBadge;
    window.addEventListener('exs:cart-updated', refreshBadge);
    window.addEventListener('focus', refreshBadge);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshBadge();
    });

    refreshBadge();
}

function normalizeRoute(path) {
    if (!path) return 'index';
    return path
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/^\//, '')
        .split('?')[0]
        .split('#')[0]
        .replace(/\.html$/, '')
        .replace(/\/$/, '') || 'index';
}
