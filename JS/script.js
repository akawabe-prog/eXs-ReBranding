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

});

// 2. 画像切り替え機能 (Product購入ページ用)
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