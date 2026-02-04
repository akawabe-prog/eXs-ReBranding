document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       Mobile Menu Toggle (ハンバーガーメニュー)
       ========================================= */
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-link');
    let isMenuOpen = false;

    // Toggle function
    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
            mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
            
            // Hamburger Animation -> 'X'
            if(menuBtn.children.length === 3) {
                menuBtn.children[0].classList.add('rotate-45', 'translate-y-2');
                menuBtn.children[1].classList.add('opacity-0');
                menuBtn.children[2].classList.add('-rotate-45', '-translate-y-2');
            }
            document.body.style.overflow = 'hidden'; // 背景固定
        } else {
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
            
            // Revert Hamburger
            if(menuBtn.children.length === 3) {
                menuBtn.children[0].classList.remove('rotate-45', 'translate-y-2');
                menuBtn.children[1].classList.remove('opacity-0');
                menuBtn.children[2].classList.remove('-rotate-45', '-translate-y-2');
            }
            document.body.style.overflow = ''; // 背景固定解除
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMenu);
    }

    // Close menu when link is clicked
    menuLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });


    /* =========================================
       Header Background Change on Scroll
       ========================================= */
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (!header) return;

        if (window.scrollY > 50) {
            header.classList.remove('bg-transparent', 'text-white');
            header.classList.add('bg-white/90', 'backdrop-blur-sm', 'text-brand-black', 'shadow-sm');
        } else {
            header.classList.add('bg-transparent', 'text-white');
            header.classList.remove('bg-white/90', 'backdrop-blur-sm', 'text-brand-black', 'shadow-sm');
        }
    });


    /* =========================================
       Intersection Observer for Fade-up Animation
       ========================================= */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // アニメーションは1回のみ
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));
});