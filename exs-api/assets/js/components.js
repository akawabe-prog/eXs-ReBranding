/* =========================================
   JS/components.js - 共通ヘッダー＆フッター
   ========================================= */

// サイト内のリンク先定義
const PATHS = {
    home: './',
    about: 'about',
    ebike_intro: 'product/exs-street',
    ebike_buy: 'product/exs-street/purchase',
    kickboard_intro: 'product/exs-1-tkg',
    kickboard_buy: 'product/exs-1-tkg/purchase',
    accessories: 'accessories',
    news: 'news',
    developer: 'developer',
    partner: 'partner',
    column: 'colum',
    support: 'support',
    contact: 'contact',
    privacy: 'policy',
    company: 'company',
    faq: 'faq',
    instagram: 'https://www.instagram.com/exs.mobi/',
    facebook: 'https://www.facebook.com/exs.mobi',
    youtube: 'https://www.youtube.com/@CustomJapan39'
};

document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    highlightCurrentNav();
});

// ヘッダー生成
function renderHeader() {
    const headerContainer = document.getElementById('common-header');
    if (!headerContainer) return;

    headerContainer.className = 'fixed w-full top-0 z-50 transition-all duration-300 bg-brand-black text-white';

    const headerHTML = `
    <div class="container mx-auto px-6 h-20 flex justify-between items-center relative z-50">
        <a href="${PATHS.home}" class="hover:opacity-70 transition inline-flex items-center">
            <img src="assets/images/img/exs-logo-white.svg" alt="eXs ロゴ" class="h-8 md:h-9 w-auto object-contain">
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
            <a href="${PATHS.partner}" class="nav-item hover:opacity-60 transition">PARTNER</a>
            <a href="${PATHS.column}" class="nav-item hover:opacity-60 transition">COLUMN</a>
            <a href="${PATHS.support}" class="nav-item hover:opacity-60 transition">SUPPORT</a>
            <a href="${PATHS.contact}" class="bg-white text-black px-4 py-2 hover:bg-gray-200 transition shadow-sm border border-gray-200">CONTACT</a>
        </nav>

        <button id="menu-btn" class="lg:hidden focus:outline-none w-8 h-8 flex flex-col justify-center items-end gap-1.5 z-50 relative" aria-label="メニュー">
            <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
            <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
            <span class="w-6 h-0.5 bg-current transition-all duration-300 origin-center"></span>
        </button>
    </div>

    <div id="mobile-menu" class="fixed inset-0 bg-[#111111]/95 backdrop-blur-md text-white flex flex-col justify-center items-center opacity-0 pointer-events-none transition-opacity duration-300 z-40">
        <nav class="flex flex-col space-y-6 text-center font-en text-lg tracking-widest">
            <a href="${PATHS.home}" class="mobile-link hover:text-gray-400">HOME</a>
            <a href="${PATHS.about}" class="mobile-link hover:text-gray-400">ABOUT</a>
            <a href="${PATHS.ebike_buy}" class="mobile-link hover:text-gray-400">E-BIKE</a>
            <a href="${PATHS.kickboard_buy}" class="mobile-link hover:text-gray-400">KICKBOARD</a>
            <a href="${PATHS.accessories}" class="mobile-link hover:text-gray-400">ACCESSORIES</a>
            <a href="${PATHS.news}" class="mobile-link hover:text-gray-400">NEWS</a>
            <a href="${PATHS.partner}" class="mobile-link hover:text-gray-400">PARTNER</a>
            <a href="${PATHS.column}" class="mobile-link hover:text-gray-400">COLUMN</a>
            <a href="${PATHS.support}" class="mobile-link hover:text-gray-400">SUPPORT</a>
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
                    <img src="assets/images/img/exs-logo-white.svg" alt="eXs ロゴ" class="h-10 w-auto object-contain">
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
