document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.to('.gsap-fade-up', {
    y: 0,
    opacity: 1,
    autoAlpha: 1,
    duration: 1.2,
    stagger: 0.2,
    ease: 'power3.out'
  });

  const revealElements = document.querySelectorAll('.gsap-scroll-reveal');
  revealElements.forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      y: 0,
      opacity: 1,
      autoAlpha: 1,
      duration: 1,
      ease: 'power2.out'
    });
  });
});
