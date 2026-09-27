// Progressive enhancement only — every page works without this file.
// Tells the inline head script this file ran; otherwise it restores the no-JS layout.
document.documentElement.classList.add('js-ready');

// Header hairline once the page scrolls.
const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu.
const nav = document.querySelector('.nav');
const toggle = nav?.querySelector('.nav__toggle');
if (nav && toggle) {
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', () => setOpen(false));
}

// Analytics: count booking clicks (only when an analytics script is configured).
document.addEventListener('click', (e) => {
  const link = e.target.closest?.('a[data-book]');
  if (link && typeof window.plausible === 'function') {
    window.plausible('Book', { props: { service: link.dataset.book } });
  }
});
