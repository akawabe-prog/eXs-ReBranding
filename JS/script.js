/* =========================================
   JS/script.js - 共通動作・アニメーション
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. フェードアップアニメーション (全ページ共通)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    if (fadeElements.length > 0) {
        fadeElements.forEach(el => observer.observe(el));
    }

    // 2. FAQ タブ切り替え
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabButtons.length > 0 && tabContents.length > 0) {
        const activateTab = (targetId, activeBtn) => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'border-brand-black', 'text-brand-black');
                btn.classList.add('border-transparent', 'text-gray-400');
                btn.setAttribute('aria-selected', 'false');
            });
            if (activeBtn) {
                activeBtn.classList.add('active', 'border-brand-black', 'text-brand-black');
                activeBtn.classList.remove('border-transparent', 'text-gray-400');
                activeBtn.setAttribute('aria-selected', 'true');
            }

            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                    content.classList.add('block');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('block');
                }
            });
        };

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                if (targetId) activateTab(targetId, btn);
            });
        });

        // 初期状態の補正（URLクエリ ?tab=street|tkg を優先）
        const params = new URLSearchParams(window.location.search);
        const paramTab = params.get('tab');
        const initialFromParam = paramTab
            ? Array.from(tabButtons).find(btn => btn.getAttribute('data-target') === paramTab)
            : null;
        const initialActive = initialFromParam || document.querySelector('.tab-btn.active') || tabButtons[0];
        const initialTarget = initialActive.getAttribute('data-target');
        if (initialTarget) activateTab(initialTarget, initialActive);
    }

    // 3. 商品オプション合計表示 (product-street)
    const basePriceEl = document.getElementById('base-price');
    const totalPriceEl = document.getElementById('total-price');
    const optionCheckboxes = document.querySelectorAll('.option-checkbox');
    const productTypeRadios = document.querySelectorAll('input[name="product_type"]');
    if (basePriceEl && totalPriceEl && optionCheckboxes.length > 0 && productTypeRadios.length === 0) {
        const basePrice = parseInt(basePriceEl.dataset.price || '0', 10);
        const formatYen = (num) => `¥${num.toLocaleString('ja-JP')}`;
        const updateTotal = () => {
            let optionsTotal = 0;
            optionCheckboxes.forEach(cb => {
                if (cb.checked) {
                    optionsTotal += parseInt(cb.dataset.price || '0', 10);
                }
            });
            totalPriceEl.textContent = formatYen(basePrice + optionsTotal);
        };
        optionCheckboxes.forEach(cb => cb.addEventListener('change', updateTotal));
        updateTotal();
    }

    // 4. 商品タイプに合わせて価格/楽天/Yahooを更新 (product-tkg)
    if (productTypeRadios.length > 0 && basePriceEl && totalPriceEl) {
        const rakutenBtn = document.getElementById('rakuten-link-btn');
        const yahooBtn = document.getElementById('yahoo-link-btn');
        const formatYen = (num) => `¥${num.toLocaleString('ja-JP')}`;
        const parsePrice = (str) => parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;

        const updateState = () => {
            const selected = document.querySelector('input[name="product_type"]:checked');
            if (!selected) return;
            const basePrice = parsePrice(selected.getAttribute('data-price'));
            let optionTotal = 0;
            optionCheckboxes.forEach(cb => {
                if (cb.checked) optionTotal += parseInt(cb.getAttribute('data-price') || '0', 10);
            });
            basePriceEl.textContent = formatYen(basePrice);
            totalPriceEl.textContent = formatYen(basePrice + optionTotal);
            const rakutenUrl = selected.getAttribute('data-rakuten-url');
            const yahooUrl = selected.getAttribute('data-yahoo-url');
            if (rakutenUrl && rakutenBtn) rakutenBtn.href = rakutenUrl;
            if (yahooUrl && yahooBtn) yahooBtn.href = yahooUrl;
        };

        productTypeRadios.forEach(radio => radio.addEventListener('change', updateState));
        optionCheckboxes.forEach(cb => cb.addEventListener('change', updateState));
        updateState();
    }

    // 5. カラー選択に合わせて楽天/Yahooボタンのリンク先を書き換える (product-street)
    const colorRadios = document.querySelectorAll('input[name="color"]');
    const rakutenBtn = document.getElementById('rakuten-link-btn');
    const yahooBtn = document.getElementById('yahoo-link-btn');
    if (colorRadios.length > 0 && rakutenBtn) {
        const updateShopUrls = (radio) => {
            const nextUrl = radio.getAttribute('data-rakuten-url');
            if (nextUrl && rakutenBtn) rakutenBtn.href = nextUrl;
            const nextYahooUrl = radio.getAttribute('data-yahoo-url');
            if (nextYahooUrl && yahooBtn) yahooBtn.href = nextYahooUrl;
        };
        colorRadios.forEach(radio => {
            radio.addEventListener('change', () => updateShopUrls(radio));
        });
        const checked = document.querySelector('input[name="color"]:checked');
        if (checked) updateShopUrls(checked);
    }

});

// 3. 画像切り替え機能 (Product購入ページ用)
// HTML側の onclick="updateImage(...)" から呼ばれます
function updateImage(src) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        // フェード効果をつけるために一度透明度を下げる（任意）
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            mainImage.src = src;
            mainImage.style.opacity = '1';
        }, 150);
    }
}

/* =========================================
   JS/script.js - 共通動作・アニメーション
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. フェードアップアニメーション (全ページ共通)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    if (fadeElements.length > 0) {
        fadeElements.forEach(el => observer.observe(el));
    }

    // 2. FAQ タブ切り替え
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabButtons.length > 0 && tabContents.length > 0) {
        const activateTab = (targetId, activeBtn) => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'border-brand-black', 'text-brand-black');
                btn.classList.add('border-transparent', 'text-gray-400');
                btn.setAttribute('aria-selected', 'false');
            });
            if (activeBtn) {
                activeBtn.classList.add('active', 'border-brand-black', 'text-brand-black');
                activeBtn.classList.remove('border-transparent', 'text-gray-400');
                activeBtn.setAttribute('aria-selected', 'true');
            }

            tabContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                    content.classList.add('block');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('block');
                }
            });
        };

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                if (targetId) activateTab(targetId, btn);
            });
        });

        // 初期状態の補正
        const params = new URLSearchParams(window.location.search);
        const paramTab = params.get('tab');
        const initialFromParam = paramTab
            ? Array.from(tabButtons).find(btn => btn.getAttribute('data-target') === paramTab)
            : null;
        const initialActive = initialFromParam || document.querySelector('.tab-btn.active') || tabButtons[0];
        const initialTarget = initialActive.getAttribute('data-target');
        if (initialTarget) activateTab(initialTarget, initialActive);
    }

});

// 3. 画像切り替え機能 (Product購入ページ用)
function updateImage(src) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.style.opacity = '0.5';
        setTimeout(() => {
            mainImage.src = src;
            mainImage.style.opacity = '1';
        }, 150);
    }
}
