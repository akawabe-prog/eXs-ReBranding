/* NORUNOWA — ヘッダー、ドロワー、スクロール表示 */
(function () {
    'use strict';

    /* ヘッダー：ヒーロー上は透過、スクロールで紙色に切り替える。
       ヒーローが無いページ（下層）は最初から紙色。 */
    var hd = document.querySelector('.hd');
    var hero = document.querySelector('.hero');
    if (hd) {
        var solid = function () {
            var limit = hero ? hero.offsetHeight - hd.offsetHeight - 40 : 0;
            hd.classList.toggle('is-solid', window.scrollY > limit);
        };
        solid();
        window.addEventListener('scroll', solid, { passive: true });
        window.addEventListener('resize', solid);
    }

    /* モバイルドロワー */
    var burger = document.querySelector('.burger');
    var drawer = document.querySelector('.drawer');
    if (burger && drawer) {
        var setNav = function (open) {
            document.body.classList.toggle('nav-open', open);
            burger.setAttribute('aria-expanded', String(open));
            drawer.setAttribute('aria-hidden', String(!open));
        };
        setNav(false);
        burger.addEventListener('click', function () {
            setNav(!document.body.classList.contains('nav-open'));
        });
        drawer.addEventListener('click', function (e) {
            if (e.target.closest('a')) setNav(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setNav(false);
        });
        window.matchMedia('(min-width:900px)').addEventListener('change', function (m) {
            if (m.matches) setNav(false);
        });
    }

    /* スクロールで要素をふわっと表示 */
    var targets = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('is-in');
                io.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
        targets.forEach(function (el) { io.observe(el); });
    }

    /* フッターの年号 */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = String(new Date().getFullYear());
}());
