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
