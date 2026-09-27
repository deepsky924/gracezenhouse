#!/usr/bin/env node
// Static site generator for gracezenhouse.com. No dependencies.
//   node build.mjs          → writes ./dist
//   npm run dev             → builds, serves http://localhost:4321, rebuilds on change

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

async function build() {
  // Cache-bust the data module so --serve picks up edits.
  const data = await import(`${pathToFileURL(join(SRC, 'data.mjs')).href}?t=${Date.now()}`);
  const {
    site,
    owner,
    testimonials,
    facials,
    facialBySlug,
    facialVisit,
    facialGroups,
    startHere,
    reassurance,
    visitNotes,
    concernGuide,
    reiki,
    waxing,
  } = data;

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
  cpSync(join(SRC, 'public'), DIST, { recursive: true });

  const assetVersion = (file) =>
    createHash('sha1').update(readFileSync(join(SRC, 'assets', file))).digest('hex').slice(0, 8);
  const fontV = Object.fromEntries(
    ['Newsreader-normal-300-400.woff2', 'Newsreader-italic-300.woff2', 'InstrumentSans-400-500.woff2'].map((f) => [
      f,
      assetVersion(`fonts/${f}`),
    ]),
  );
  const fontUrl = (f) => `/assets/fonts/${f}?v=${fontV[f]}`;
  // Version font URLs inside the stylesheet so the long-lived cache can't serve stale files.
  writeFileSync(
    join(DIST, 'assets', 'styles.css'),
    readFileSync(join(SRC, 'assets', 'styles.css'), 'utf8').replace(/url\(fonts\/([^)]+)\)/g, (_, f) => `url(${fontUrl(f)})`),
  );
  // Hash the rewritten stylesheet, so a font change also busts the CSS cache.
  const cssV = createHash('sha1').update(readFileSync(join(DIST, 'assets', 'styles.css'))).digest('hex').slice(0, 8);
  const jsV = assetVersion('main.js');
  const year = new Date().getFullYear();
  const pages = [];
  const warnings = [];

  // ── helpers ──────────────────────────────────────────────────────────────
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const money = (n) => (n == null ? 'Varies' : `$${n}`);
  const fit = (candidates, max) => candidates.find((c) => c.length <= max) ?? candidates.at(-1);
  const abs = (path) => site.url + path;
  const ext = { target: '_blank', rel: 'noopener' };
  const attrs = (o) =>
    Object.entries(o)
      .map(([k, v]) => ` ${k}="${esc(v)}"`)
      .join('');
  const noWidow = (s) => s.replace(/ (\S+)$/, '&nbsp;$1');

  // Icons: authored SVG, one 1.5px stroke family.
  const svg = (cls, body, box = '0 0 20 20') =>
    `<svg class="i ${cls}" viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;
  const ARROW = svg('i--arrow', '<path d="M3.5 10h12M11 5.5l4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>');
  const PHONE = svg('i--phone', '<path d="M6.3 3.3l1.9-.3a1 1 0 0 1 1.1.7l.8 2.6a1 1 0 0 1-.3 1L8.5 8.5a9.5 9.5 0 0 0 3 3l1.2-1.3a1 1 0 0 1 1-.3l2.6.8a1 1 0 0 1 .7 1.1l-.3 1.9a1.7 1.7 0 0 1-1.8 1.4A13.2 13.2 0 0 1 4.9 5.1a1.7 1.7 0 0 1 1.4-1.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>');
  const INSTAGRAM = svg('i--ig', '<rect x="3" y="3" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="14.1" cy="5.9" r="0.9" fill="currentColor"/>');
  const STAR = '<path d="M10 2.4l2.3 4.7 5.2.8-3.8 3.6.9 5.2L10 14.2l-4.6 2.5.9-5.2-3.8-3.6 5.2-.8z" fill="currentColor"/>';
  const STARS = `<span class="stars" aria-hidden="true">${Array.from({ length: 5 }, () => svg('i--star', STAR)).join('')}</span>`;
  const ENSO = `<svg class="enso" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M31.5 7.6A18 18 0 1 0 41.6 29" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>`;

  const linkArrow = (href, label, cls = '', extra = {}) =>
    `<a class="link-arrow ${cls}" href="${esc(href)}"${attrs(extra)}>${label}${ARROW}</a>`;

  // `service` names the booking for screen readers (when the label doesn't) and for analytics.
  // Generic bookings (service === GENERAL) only add the "opens Square" note.
  const GENERAL = 'Appointment';
  const bookLink = (href, service, label = 'Book', cls = 'link-book') =>
    `<a class="${cls}" href="${esc(href)}" data-book="${esc(service)}"${attrs(ext)}>${label}<span class="sr-only">${
      service === GENERAL || label.includes(service) ? '' : ` ${esc(service)}`
    } (opens Square booking)</span></a>`;
  const bookAny = (label = 'Book a visit', cls = 'btn btn--primary') => bookLink(site.bookingUrl, GENERAL, label, cls);
  // Placeholder spans written as [like this] in data render as highlighted todos.
  const todo = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark class="todo">[$1]</mark>');
  const nb = (s) => esc(s).replace(/ /g, '&nbsp;');

  // Image placeholder, sized to its eventual photo. Swap the inner div for an <img>.
  const ph = (subject, ratio = '4x5', caption = '', cls = '') => `
    <figure class="ph ph--${ratio} ${cls}">
      <div class="ph__frame" role="img" aria-label="${esc(subject)}"><span class="ph__label">${esc(subject)}</span></div>
      ${caption ? `<figcaption>${caption}</figcaption>` : ''}
    </figure>`;

  const street = () => esc(site.address.street).replace('Suite ', 'Suite&nbsp;');
  const list = (items, cls = 'ticks') => `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const stepsList = (items) => `<ol class="steps">${items.map((i) => `<li><span>${i}</span></li>`).join('')}</ol>`;
  const assure = (cls = '') => `<ul class="assure ${cls}">${reassurance.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;

  const crumbs = (trail) => `
    <nav class="crumbs wrap" aria-label="Breadcrumb"><ol>
      ${trail
        .map(([label, href], i) =>
          i === trail.length - 1
            ? `<li><span aria-current="page">${esc(label)}</span></li>`
            : `<li><a href="${href}">${esc(label)}</a></li>`,
        )
        .join('')}
    </ol></nav>`;

  const pageHead = (h1, lede) => `
    <section class="page-head wrap">
      <h1 class="display display--md">${h1}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ''}
    </section>`;

  const cta = (
    heading = 'Book a time with Grace.',
    text = 'Choose a treatment and a time online, or call and I’ll help you decide what your skin needs.',
    { ticks = true } = {},
  ) => `
    <section class="cta">
      <div class="wrap cta__grid">
        <div>
          <h2 class="cta__title">${noWidow(heading)}</h2>
          <p>${text}</p>
        </div>
        <div class="cta__side">
          <div class="actions">
            ${bookAny()}
            <a class="btn btn--ghost" href="${site.phoneHref}">Call ${site.phone}</a>
          </div>
          ${ticks ? assure() : ''}
        </div>
      </div>
    </section>`;

  const closeRhythm = (book = null) => `
    <section class="rhythm" aria-labelledby="rhythm-title">
      <div class="wrap rhythm__grid">
        <h2 id="rhythm-title" class="rhythm__title">See you in four&nbsp;weeks.</h2>
        <div class="rhythm__body">
          <p>Skin renews itself about once a month, so facials work best on a four-week rhythm. Coming back? Book your next visit whenever suits you.</p>
          <div class="actions">
            ${book ? bookLink(book.book, book.name, 'Book your next visit', 'btn btn--primary') : bookAny('Book your next visit')}
            <a class="link-quiet" href="${site.phoneHref}">Call ${site.phone}</a>
          </div>
        </div>
      </div>
    </section>`;

  const closeEnergy = (book = null) => `
    <section class="rest" aria-labelledby="rest-title">
      <div class="wrap rest__grid">
        <h2 id="rest-title" class="rest__title">Make time to&nbsp;<em>rest.</em></h2>
        <div class="rest__body">
          <p>Book an in-person session in the studio, or schedule Distance Reiki from wherever you are.</p>
          <div class="actions">
            ${book ? bookLink(book.book, book.name, `Book ${esc(book.name)}`, 'btn btn--light') : bookAny('Book a visit', 'btn btn--light')}
            <a class="link-quiet link-quiet--light" href="${site.phoneHref}">Call ${site.phone}</a>
          </div>
        </div>
      </div>
    </section>`;

  // ── structured data ──────────────────────────────────────────────────────
  const businessId = `${site.url}/#business`;
  const business = {
    '@context': 'https://schema.org',
    '@type': 'DaySpa',
    '@id': businessId,
    name: site.name,
    description: site.description,
    url: `${site.url}/`,
    image: `${site.url}/og-image.png`,
    logo: `${site.url}/favicon.svg`,
    telephone: '+1-626-806-5016',
    email: site.email,
    priceRange: '$10–$300',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postal,
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    areaServed: { '@type': 'City', name: 'Rancho Cucamonga' },
    sameAs: [site.instagram.url],
  };
  const breadcrumbLd = (trail) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, href], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(href),
    })),
  });
  const serviceLd = (item, path, serviceType) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: item.name,
    serviceType,
    description: item.summary,
    url: abs(path),
    provider: { '@id': businessId },
    areaServed: { '@type': 'City', name: 'Rancho Cucamonga' },
    offers: { '@type': 'Offer', price: item.price, priceCurrency: 'USD', url: item.book },
  });

  // ── layout ───────────────────────────────────────────────────────────────
  const NAV = [
    ['Services', '/services/'],
    ['Pricing', '/pricing/'],
    ['About', '/about/'],
    ['Contact', '/contact/'],
  ];

  function layout({ path, title, description, body, schema = [], ogAlt, bodyClass = '', businessLd = business, bookFor }) {
    const canonical = abs(path);
    const ogImageAlt = ogAlt ?? 'Grace Zen House — holistic skincare and energy healing in Rancho Cucamonga';
    const navItems = NAV.map(([label, href]) => {
      const current = path === href ? ' aria-current="page"' : path.startsWith(href) ? ' aria-current="true"' : '';
      return `<li><a href="${href}"${current}>${label}</a></li>`;
    }).join('');
    const ld = [businessLd, ...schema]
      .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`)
      .join('\n  ');
    // Thumb-reach booking bar on phones; on a service page it books that service.
    const barBook = bookFor
      ? bookLink(bookFor.book, bookFor.name, 'Book', 'btn btn--primary')
      : bookAny('Book', 'btn btn--primary');

    return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <script>(function(c){c.replace('no-js','js');addEventListener('load',function(){if(!c.contains('js-ready'))c.replace('js','no-js')})})(document.documentElement.classList)</script>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${site.url}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${site.url}/og-image.png">
  <meta name="twitter:image:alt" content="${esc(ogImageAlt)}">
  <meta name="theme-color" content="${site.themeColor}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="${fontUrl('Newsreader-normal-300-400.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${fontUrl('InstrumentSans-400-500.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/styles.css?v=${cssV}">
  <script src="/assets/main.js?v=${jsV}" defer></script>
  ${site.analytics.plausibleDomain ? `<script defer data-domain="${esc(site.analytics.plausibleDomain)}" src="https://plausible.io/js/script.js"></script>` : ''}
  ${site.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}">` : ''}
  ${ld}
</head>
<body class="${bodyClass}">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="wrap site-header__inner">
      <a class="brand" href="/">${ENSO}<span>Grace Zen House</span></a>
      <nav class="nav" aria-label="Primary">
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu">Menu</button>
        <ul class="nav__list" id="nav-menu">${navItems}
          <li class="nav__social"><a href="${site.instagram.url}"${attrs(ext)}>${INSTAGRAM}<span class="nav__social-label">Instagram</span><span class="sr-only"> ${site.instagram.handle} (opens in a new tab)</span></a></li>
          <li class="nav__book">${bookAny('Book', 'btn btn--primary btn--sm')}</li>
        </ul>
      </nav>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  <footer class="site-footer">
    <div class="wrap site-footer__grid">
      <div class="site-footer__brand">
        <a class="brand brand--light" href="/">${ENSO}<span>Grace Zen House</span></a>
        <p>Holistic skincare &amp; energy healing.<br>Facials, Reiki and waxing in Rancho Cucamonga.</p>
      </div>
      <div>
        <h2 class="footer-label">Visit</h2>
        <address>${street()}<br>${site.address.city}, ${site.address.region} ${site.address.postal}<br><span class="muted">${site.address.landmark}</span></address>
        <a href="${site.mapsUrl}"${attrs(ext)}>Get directions</a>
      </div>
      <div>
        <h2 class="footer-label">Contact</h2>
        <ul class="plain">
          <li><a href="${site.phoneHref}">${site.phone}</a></li>
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li><a href="${site.instagram.url}"${attrs(ext)}>Instagram ${site.instagram.handle}</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer-label">Hours</h2>
        <p>${site.hours}</p>
        ${bookAny('Book a visit', 'btn btn--primary btn--sm')}
      </div>
    </div>
    <div class="wrap site-footer__base">
      <p>© ${year} ${site.name}</p>
      <ul class="plain inline">${NAV.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
    </div>
  </footer>
  <div class="mobile-bar">
    ${barBook}
    <a class="mobile-bar__call" href="${site.phoneHref}">${PHONE}<span>Call</span></a>
  </div>
</body>
</html>
`;
  }

  function addPage(page) {
    const { path, title, description } = page;
    if (title.length > 60) warnings.push(`title ${title.length}ch: ${path}`);
    if (description.length > 155) warnings.push(`description ${description.length}ch: ${path}`);
    const out = path === '/404.html' ? join(DIST, '404.html') : join(DIST, path, 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, layout(page));
    if (!page.noindex) pages.push(path);
  }

  // ── shared blocks ────────────────────────────────────────────────────────
  const facialPath = (slug) => `/services/facial-treatments/${slug}/`;
  const reikiPath = (slug) => `/services/reiki-services/${slug}/`;
  const minPrice = (arr) => Math.min(...arr.filter((n) => n != null));
  const waxPrices = waxing.groups.flatMap((g) => g.items.map((i) => i.price));
  const start = facialBySlug[startHere];

  // `aligned` reserves the Book column so prices line up with bookable rows.
  const menuRow = ({ name, href, price, priceLabel, duration, book, bookAs, note, aligned, arrow, action }) => `
    <li class="menu__row">
      <span class="menu__name">${href ? `<a href="${href}">${esc(name)}${arrow ? ARROW : ''}</a>` : esc(name)}${note ? `<small>${esc(note)}</small>` : ''}</span>
      <span class="menu__leader" aria-hidden="true"></span>
      <span class="menu__price">${priceLabel ?? money(price)}${duration ? `<small>${esc(duration)}</small>` : ''}</span>
      ${book ? bookLink(book, bookAs ?? name, 'Book', 'menu__book') : action ? `<a class="menu__book" href="${action.href}">${action.label}<span class="sr-only"> ${esc(name)} waxing prices</span></a>` : aligned ? '<span class="menu__book menu__book--empty" aria-hidden="true">Book</span>' : ''}
    </li>`;

  const facialRow = (f, opts = {}) =>
    menuRow({ name: f.name, href: facialPath(f.slug), price: f.price, duration: f.duration, book: f.book, ...opts });

  // Facials menu, grouped by goal, "start here" first.
  const facialMenu = ({ headingTag = 'h3' } = {}) => `
    <div class="menu__group menu__group--start">
      <${headingTag} class="menu__heading">Start here</${headingTag}>
      <ul class="menu">${facialRow(start, { note: 'Tailored on the day, after a skin analysis.' })}</ul>
    </div>
    ${facialGroups
      .map(
        (g) => `
    <div class="menu__group">
      <${headingTag} class="menu__heading">${esc(g.name)}</${headingTag}>
      <ul class="menu">${g.slugs.map((s) => facialRow(facialBySlug[s])).join('')}</ul>
    </div>`,
      )
      .join('')}`;

  const waxMenu = () =>
    waxing.groups
      .map(
        (g) => `
      <div class="menu__group">
        <h3 class="menu__heading">${g.name}</h3>
        <ul class="menu">${g.items
          .map((i) => menuRow({ ...i, note: i.price == null ? 'Priced by area, confirmed when you book' : undefined, bookAs: /wax/i.test(i.name) ? i.name : `${i.name} wax` }))
          .join('')}</ul>
      </div>`,
      )
      .join('');

  const guideList = () => `
      <dl class="guide__list">
        ${concernGuide
          .map(
            ([concern, slugs]) => `
          <div class="guide__row">
            <dt>${esc(concern)}</dt>
            <dd>${slugs.map((s) => `<a href="${facialPath(s)}">${nb(facialBySlug[s].name)}</a>`).join('<span aria-hidden="true"> · </span>')}</dd>
          </div>`,
          )
          .join('')}
      </dl>`;

  const concernGuideBlock = (headingTag = 'h2') => `
    <section class="guide wrap" id="guide" aria-labelledby="guide-title">
      <div class="guide__head">
        <${headingTag} id="guide-title" class="guide__title">What would you like to work on?</${headingTag}>
        <p>Choose your main concern for a starting point. If you’re unsure, a Custom Facial is always tailored on the day.</p>
      </div>
      ${guideList()}
    </section>`;

  const quote = (t, cls = '') => `
    <figure class="quote ${cls}">
      <blockquote><p>${esc(t.quote)}</p></blockquote>
      <figcaption>${STARS}<span class="quote__who">${esc(t.author)}</span><span class="quote__what">${esc(t.service)} · Google review</span></figcaption>
    </figure>`;

  const ownerName = owner.isPlaceholder
    ? `<mark class="todo" title="Placeholder — replace with real name">${esc(owner.name)}</mark>`
    : esc(owner.name);
  const creds = owner.credentials
    .map((c) => (owner.isPlaceholder ? `<li><mark class="todo">${esc(c)}</mark></li>` : `<li>${esc(c)}</li>`))
    .join('');
  const lockup = `<p class="lockup"><span>Esthetician</span><span class="lockup__rule" aria-hidden="true"></span><span>Reiki Master</span></p>`;

  // Detail page for any single service (facial, reiki, waxing).
  function detailPage({ item, trail, media, related = [], extra = '', concerns = [], energy = false, voice, close = '' }) {
    const about = [].concat(item.about ?? []);
    const blocks = [];
    if (item.includes)
      blocks.push(`<div class="detail__block"><h2>${item.includesLabel ?? 'What’s included'}</h2>${list(item.includes)}</div>`);
    if (item.benefits)
      blocks.push(`<div class="detail__block"><h2>${item.benefitsLabel ?? 'Benefits'}</h2>${list(item.benefits)}</div>`);
    if (item.ideal) blocks.push(`<div class="detail__block"><h2>Ideal for</h2><p>${esc(item.ideal)}</p></div>`);

    const steps = item.steps
      ? `<section class="detail__section"><h2 class="detail__label">${item.stepsLabel ?? 'What to expect'}</h2>${stepsList(item.steps.map(esc))}</section>`
      : '';
    const care =
      item.before || item.after
        ? `<section class="care" aria-label="Before and after care">
            ${item.before ? `<div><h2 class="detail__label">Before your visit</h2><p>${esc(item.before)}</p></div>` : ''}
            ${item.after ? `<div><h2 class="detail__label">Afterwards</h2><p>${esc(item.after)}</p></div>` : ''}
          </section>`
        : '';
    const faq = item.faq?.length
      ? `<section class="faq detail__section"><h2 class="detail__label">Questions</h2>${item.faq
          .map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`)
          .join('')}</section>`
      : '';
    const relatedHtml = related.length
      ? `<section class="related wrap" aria-labelledby="related-title">
          <h2 id="related-title" class="related__title">You may also like</h2>
          <ul class="related__list">${related
            .map(
              (r) => `<li><a href="${r.href}"><span class="related__name">${esc(r.name)}${ARROW}</span><span class="related__meta">${r.price != null ? `${money(r.price)} · ` : ''}${esc(r.summary)}</span></a></li>`,
            )
            .join('')}</ul>
        </section>`
      : '';
    const concernLine = concerns.length
      ? `<p class="detail__for">Often chosen for ${concerns
          .map((c) => `<a href="/services/#guide">${esc(c.toLowerCase())}</a>`)
          .join(', ')}.</p>`
      : '';

    return `
    ${crumbs(trail)}
    <div class="detail wrap">
      <header class="detail__head">
        <h1 class="display display--md">${esc(item.name)}</h1>
        <p class="lede">${esc(item.summary)}</p>
        ${concernLine}
      </header>
      <aside class="booking${energy ? ' booking--energy' : ''}" aria-label="Book ${esc(item.name)}">
        <p class="booking__price"><span class="booking__amount">${money(item.price)}</span><span class="booking__unit">${item.duration ? `${esc(item.duration)} · ` : ''}per session</span></p>
        ${item.priceNote ? `<p class="booking__note">${esc(item.priceNote)}</p>` : ''}
        ${bookLink(item.book, item.name, `Book ${esc(item.name)}`, `btn ${energy ? 'btn--light' : 'btn--primary'} btn--block`)}
        <a class="booking__call" href="${site.phoneHref}">${PHONE}Or call ${site.phone}</a>
        ${assure()}
      </aside>
      <div class="detail__body">
        ${ph(media, '3x2', '', 'detail__media')}
        ${about.length ? `<div class="detail__about">${about.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
        ${blocks.length ? `<div class="detail__blocks">${blocks.join('')}</div>` : ''}
        ${item.note ? `<p class="detail__note">${esc(item.note)}</p>` : ''}
        ${steps}
        ${care}
        ${faq}
        ${extra}
      </div>
    </div>
    ${relatedHtml}
    ${voice ? `<section class="detail-voice wrap" aria-label="A client’s words">${quote(voice, 'quote--mid')}</section>` : ''}
    ${close}`;
  }

  // ── Home ─────────────────────────────────────────────────────────────────
  const leadVoice = testimonials.find((t) => t.author === 'Ally French');
  const moreVoices = testimonials.filter((t) => ['Sharon Mitchell', 'E. O.', 'Coleen Smith'].includes(t.author));

  addPage({
    path: '/',
    title: 'Facials & Reiki in Rancho Cucamonga | Grace Zen House',
    description:
      'Custom facials, Usui Reiki and gentle waxing in a calm Rancho Cucamonga sanctuary. By appointment only — rated 5.0 on Google. Book online.',
    bodyClass: 'is-home',
    body: `
    <section class="hero">
      <div class="hero__text">
        <h1 class="display hero__title">Skin care that begins with <em>stillness.</em></h1>
        <p class="lede hero__lede">I’m Grace — an esthetician and Reiki master. Every visit, it’s just the two of us: advanced facials for your skin, and Reiki for your nervous system.</p>
        <div class="actions">
          ${bookAny()}
          <a class="link-quiet" href="${site.phoneHref}">Call ${site.phone}</a>
        </div>
        <ul class="hero__meta plain">
          <li><a class="hero__rating" href="${site.reviewsUrl}"${attrs(ext)}>${STARS}<span>${site.rating.value} · ${site.rating.count} Google reviews</span></a></li>
          <li><a class="hero__social" href="${site.instagram.url}"${attrs(ext)}>${INSTAGRAM}<span>${site.instagram.handle}</span><span class="sr-only"> on Instagram (opens in a new tab)</span></a></li>
          <li>Now accepting new clients in Rancho Cucamonga</li>
          <li>Coming back? ${bookLink(site.bookingUrl, GENERAL, 'Book your next visit', 'hero__rebook')}</li>
        </ul>
      </div>
      ${ph('Portrait of Grace in the treatment room, soft window light', 'portrait', 'Grace, in the studio · Suite 222A, Haven Village', 'hero__portrait')}
    </section>

    <section class="duo" aria-labelledby="duo-title">
      <h2 id="duo-title" class="duo__title wrap">Two practices. One practitioner.</h2>
      <div class="duo__split">
        <div class="duo__half duo__half--skin">
          <h3 class="duo__word">Skin</h3>
          <p class="duo__line">Advanced facials and gentle waxing, chosen after a proper look at your skin.</p>
          <ul class="duo__links plain">
            <li>${linkArrow('/services/facial-treatments/', `Facials <span>${facials.length} treatments · from $${minPrice(facials.map((f) => f.price))}</span>`)}</li>
            <li>${linkArrow('/services/waxing-services/', `Waxing <span>Face to full body · from $${minPrice(waxPrices)}</span>`)}</li>
          </ul>
        </div>
        <div class="duo__half duo__half--energy">
          <h3 class="duo__word">Energy</h3>
          <p class="duo__line"><em>Rest is part of the treatment.</em> Usui Reiki eases stress and tension and restores a deep sense of calm — in the studio, or from home.</p>
          <ul class="duo__links plain">
            ${reiki.map((r) => `<li>${linkArrow(reikiPath(r.slug), `${esc(r.name)} <span>${r.duration ? `${esc(r.duration)} · ` : 'In the studio · '}$${r.price}</span>`, 'link-arrow--light')}</li>`).join('')}
          </ul>
        </div>
        ${ENSO.replace('class="enso"', 'class="enso duo__enso"')}
      </div>
    </section>

    <section class="studio" aria-label="The studio">
      <div class="studio__frame ph__frame" role="img" aria-label="The treatment room: soft light, linen and a single stem"><span class="ph__label">The treatment room: soft light, linen and a single stem</span></div>
      <div class="studio__caption wrap">
        <p class="studio__line">A private studio in Haven Village — just you, Grace, and time that’s entirely yours.</p>
        ${linkArrow('/contact/', 'Find the studio', 'link-arrow--light')}
      </div>
    </section>

    <section class="begin wrap" aria-labelledby="begin-title">
      <div class="begin__lead">
        <h2 id="begin-title">Where most clients begin</h2>
        <p>Not sure what your skin needs? Book a Custom Facial and I’ll tailor it on the day, after a proper look at your skin.</p>
        <div class="feature">
          <p class="feature__name"><a href="${facialPath(start.slug)}">${esc(start.name)}${ARROW}</a></p>
          <p class="feature__price">${money(start.price)}</p>
          ${bookLink(start.book, start.name, `Book ${esc(start.name)}`, 'btn btn--primary')}
        </div>
      </div>
      <div class="begin__guide">
        <h3 class="begin__guide-title">Or start from what you’d like to work on</h3>
        ${guideList()}
        ${linkArrow('/pricing/', 'See every treatment and price')}
      </div>
    </section>

    <section class="voices" aria-labelledby="voices-title">
      <h2 id="voices-title" class="sr-only">What clients say</h2>
      <div class="wrap">
        ${quote(leadVoice, 'quote--lead')}
        <div class="voices__more">
          ${moreVoices.map((t) => quote(t)).join('')}
        </div>
        ${linkArrow(site.reviewsUrl, `Read all ${site.rating.count} reviews on Google`, '', ext)}
      </div>
    </section>

    ${closeRhythm()}`,
  });

  // ── Services hub ─────────────────────────────────────────────────────────
  addPage({
    path: '/services/',
    title: 'Facials, Reiki & Waxing Services | Grace Zen House',
    description:
      'Explore holistic services at Grace Zen House in Rancho Cucamonga: 14 custom facials, Usui and distance Reiki, and gentle waxing for all genders.',
    schema: [breadcrumbLd([['Home', '/'], ['Services', '/services/']])],
    body: `
    ${pageHead('Find your treatment.', 'Tell me what you’d like to work on and you’ll find a starting point below. Every treatment can be booked directly.')}
    ${concernGuideBlock()}

    <section class="chapter wrap" id="facials" aria-labelledby="ch-facials">
      <div class="chapter__head">
        <h2 id="ch-facials">Facials</h2>
        <p>Professional-grade Circadia and Hale &amp; Hush products, and a gentle, intuitive touch. Every facial begins with a skin analysis.</p>
        ${linkArrow('/services/facial-treatments/', 'About each facial')}
        ${ph('Hands applying a mask during a facial', '3x2', '', 'chapter__media')}
      </div>
      <div class="chapter__body">${facialMenu()}</div>
    </section>

    <section class="chapter chapter--energy" id="reiki" aria-labelledby="ch-reiki">
      <div class="wrap chapter__inner">
        <div class="chapter__head">
          <h2 id="ch-reiki">Reiki</h2>
          <p>Usui Reiki to release stress and restore balance — in the studio, or remotely from wherever you are.</p>
          ${linkArrow('/services/reiki/', 'About Reiki', 'link-arrow--light')}
        </div>
        <div class="chapter__body">
          <ul class="menu menu--light">${reiki.map((r) => menuRow({ name: r.fullName, href: reikiPath(r.slug), price: r.price, book: r.book, bookAs: r.name })).join('')}</ul>
        </div>
      </div>
    </section>

    <section class="chapter wrap" id="waxing" aria-labelledby="ch-waxing">
      <div class="chapter__head">
        <h2 id="ch-waxing">Waxing</h2>
        <p>Gentle, detailed waxing with high-quality products, for all genders. Face, body and intimate areas.</p>
        ${linkArrow('/services/waxing-services/', 'Full waxing menu &amp; care')}
      </div>
      <div class="chapter__body">
        <ul class="menu">
          ${menuRow({ name: 'Face', note: 'Brow, lip, chin, cheeks, full face', priceLabel: '$10–$50', href: '/services/waxing-services/', action: { href: '/services/waxing-services/', label: 'Menu' } })}
          ${menuRow({ name: 'Body', note: 'Arms, legs, back, underarms and more', priceLabel: '$15–$70', href: '/services/waxing-services/', action: { href: '/services/waxing-services/', label: 'Menu' } })}
          ${menuRow({ name: 'Brazilian wax', href: '/services/waxing-services/brazilian-wax/', price: 60, book: waxing.pages['brazilian-wax'].book })}
          ${menuRow({ name: 'Full body wax', href: '/services/waxing-services/full-body-wax/', price: 300, book: waxing.pages['full-body-wax'].book })}
        </ul>
      </div>
    </section>
    ${cta()}`,
  });

  // ── Facials ──────────────────────────────────────────────────────────────
  addPage({
    path: '/services/facial-treatments/',
    title: 'Custom Facials in Rancho Cucamonga | Grace Zen House',
    description:
      'Hydrafacial, dermaplaning, peptide and LED brightening facials, tailored after a skin analysis. 14 treatments from $110 in Rancho Cucamonga.',
    schema: [
      breadcrumbLd([['Home', '/'], ['Services', '/services/'], ['Facial treatments', '/services/facial-treatments/']]),
    ],
    body: `
    ${crumbs([['Home', '/'], ['Services', '/services/'], ['Facial treatments', '/services/facial-treatments/']])}
    ${pageHead('Facials for radiant, rested skin.', 'From deep hydration to advanced anti-aging, each facial is tailored using professional-grade Circadia and Hale &amp; Hush products. Not sure which? <a href="/services/#guide">Match your skin concern</a>.')}
    <section class="start wrap" aria-labelledby="start-title">
      ${ph('A Custom Facial in progress, warm towel and ceramic bowls', '4x5', '', 'start__media')}
      <div class="start__text">
        <h2 id="start-title">Start with a Custom Facial</h2>
        <p class="start__lede">${esc(start.summary)} ${esc(start.note)}</p>
        <p class="start__price">${money(start.price)} <span>per session</span></p>
        <div class="actions">
          ${bookLink(start.book, start.name, `Book ${esc(start.name)}`, 'btn btn--primary')}
          ${linkArrow(facialPath(start.slug), 'What’s involved')}
        </div>
      </div>
    </section>
    ${facialGroups
      .map(
        (g) => `
    <section class="index wrap" aria-labelledby="g-${g.slugs[0]}">
      <div class="index__head">
        <h2 id="g-${g.slugs[0]}">${esc(g.name)}</h2>
        <p>${esc(g.intro)}</p>
      </div>
      <ul class="index__list plain">
        ${g.slugs
          .map((s) => facialBySlug[s])
          .map(
            (f) => `
          <li class="index__item">
            <div class="index__body">
              <h3><a href="${facialPath(f.slug)}">${esc(f.name)}</a></h3>
              <p>${esc(f.summary)}</p>
            </div>
            <div class="index__side">
              <span class="index__price">${money(f.price)}</span>
              ${bookLink(f.book, f.name)}
            </div>
          </li>`,
          )
          .join('')}
      </ul>
    </section>`,
      )
      .join('')}
    ${closeRhythm()}`,
  });

  const facialMedia = {
    'custom-facial': 'Warm towel and ceramic bowls on a wooden tray',
    'dermaplaning-facial': 'Close-up of calm, glowing skin in natural light',
    microdermabrasion: 'Treatment tools arranged on linen',
    hydrafacial: 'Water droplets on a leaf, soft focus',
    'beyond-botox-facial': 'Client at rest with a firming mask',
    'swich-treatment': 'Circadia bottles on stone',
    'firming-peptide-facial': 'Hands giving a gentle facial massage',
    'c-peptide-facial': 'Citrus slices and serum dropper',
    'brightening-facial-with-led': 'Soft red glow of LED light therapy',
    'oxygen-rx-facial': 'Mist rising in morning light',
    'sensitive-skin-facial': 'Chamomile and a calming balm',
    'acneic-skin-facial': 'Clay mask in a small stone bowl',
    'triple-berry-brightening': 'Australian berries scattered on linen',
    'customized-back-facial': 'Back treatment, draped in white linen',
  };

  const findStudio = ['Finding the studio', `${site.address.landmark}, Suite 222A — ${site.address.street.split(',')[0]}, ${site.address.city}.`];
  const visitBlock = (items) => `
    <section class="detail__visit"><h2 class="detail__label">Your visit</h2>${items
      .concat(visitNotes)
      .map(([t, d]) => `<p><strong>${esc(t)}</strong>${esc(d)}</p>`)
      .join('')}</section>`;
  const facialVisitBlock = visitBlock([...facialVisit, findStudio]);

  for (const f of facials) {
    const path = facialPath(f.slug);
    const trail = [
      ['Home', '/'],
      ['Services', '/services/'],
      ['Facial treatments', '/services/facial-treatments/'],
      [f.name, path],
    ];
    addPage({
      path,
      title: fit(
        [`${f.name} in Rancho Cucamonga | Grace Zen House`, `${f.name}, Rancho Cucamonga | Grace Zen House`, `${f.name} | Grace Zen House`],
        60,
      ),
      description: fit(
        [
          `${f.summary} $${f.price} at Grace Zen House, Rancho Cucamonga. Book online.`,
          `${f.summary} $${f.price} in Rancho Cucamonga.`,
          `${f.name} at Grace Zen House, Rancho Cucamonga — $${f.price}. ${f.summary}`.slice(0, 152).trimEnd() + '…',
        ],
        155,
      ),
      schema: [breadcrumbLd(trail), serviceLd(f, path, 'Facial')],
      bookFor: f,
      body: detailPage({
        item: f,
        trail,
        media: facialMedia[f.slug],
        extra: facialVisitBlock,
        voice: testimonials.find((t) => t.author === (f.slug === 'custom-facial' ? 'Ally French' : 'Crystal Arriola')),
        close: closeRhythm(f),
        concerns: concernGuide.filter(([, slugs]) => slugs.includes(f.slug)).map(([c]) => c),
        related: (f.related ?? []).map((s) => ({ ...facialBySlug[s], href: facialPath(s) })),
      }),
    });
  }

  // ── Reiki ────────────────────────────────────────────────────────────────
  addPage({
    path: '/services/reiki/',
    title: 'Usui Reiki & Distance Reiki | Grace Zen House',
    description:
      'Restore balance and inner calm with Usui Reiki in Rancho Cucamonga — in-person sessions $111, or 30-minute distance Reiki $88 from home.',
    schema: [breadcrumbLd([['Home', '/'], ['Services', '/services/'], ['Reiki', '/services/reiki/']])],
    bodyClass: 'theme-energy',
    body: `
    <div class="energy-top">
      ${crumbs([['Home', '/'], ['Services', '/services/'], ['Reiki', '/services/reiki/']])}
      ${pageHead('Reiki, for a quieter mind and body.', 'Usui Reiki helps you let go of stress and restores balance and inner calm — in the studio, or from home.')}
    </div>
    <section class="split wrap">
      ${ph('A quiet, dimly lit treatment room', '4x5', '', 'split__media')}
      <div class="split__text">
        ${reiki[0].about.map((p) => `<p>${esc(p)}</p>`).join('')}
        ${quote(testimonials[0])}
      </div>
    </section>
    <section class="offerings wrap" aria-label="Reiki sessions">
      ${reiki
        .map(
          (r) => `
        <article class="offering">
          <h2><a href="${reikiPath(r.slug)}">${esc(r.name)}</a></h2>
          <p class="offering__meta">${r.duration ? `Remote · ${esc(r.duration)}` : 'In the studio'}</p>
          <p>${esc(r.summary)}</p>
          <div class="offering__foot">
            <span class="offering__price">${money(r.price)}</span>
            ${bookLink(r.book, r.name)}
          </div>
        </article>`,
        )
        .join('')}
    </section>
    <section class="session wrap" aria-labelledby="session-title">
      <h2 id="session-title">What happens in a session</h2>
      <div class="session__cols">
        ${reiki
          .map(
            (r) => `
        <div class="session__col">
          <h3>${r.duration ? `From home · ${esc(r.duration)}` : 'In the studio'}</h3>
          ${stepsList(r.steps.map(esc))}
        </div>`,
          )
          .join('')}
      </div>
    </section>
    ${closeEnergy()}`,
  });

  for (const r of reiki) {
    const path = reikiPath(r.slug);
    const trail = [['Home', '/'], ['Services', '/services/'], ['Reiki', '/services/reiki/'], [r.name, path]];
    addPage({
      path,
      title:
        r.slug === 'reiki'
          ? 'Reiki Healing in Rancho Cucamonga | Grace Zen House'
          : 'Distance Reiki — Remote Sessions | Grace Zen House',
      description:
        r.slug === 'reiki'
          ? 'In-person Usui Reiki in Rancho Cucamonga to ease stress, release tension and restore inner peace. $111 per session. Book online.'
          : 'Receive the restorative benefits of Reiki from home. A 30-minute distance Reiki session with Grace Zen House, $88. Book online.',
      schema: [breadcrumbLd(trail), serviceLd(r, path, 'Reiki')],
      bookFor: r,
      body: detailPage({
        item: r,
        trail,
        energy: true,
        extra: visitBlock(r.slug === 'reiki' ? [['Tell me what you need', 'Share anything on your mind — stress, sleep, tension — when you book, and I’ll shape the session around it.'], findStudio] : [['Before we begin', 'We’ll set a time when you can lie down somewhere quiet and undisturbed for the full 30 minutes.']]),
        voice: testimonials.find((t) => t.author === 'Sharon Mitchell'),
        close: closeEnergy(r),
        media: r.slug === 'reiki' ? 'Hands held just above the body, soft light' : 'A cozy corner at home with a blanket and candle',
        related: reiki
          .filter((o) => o.slug !== r.slug)
          .map((o) => ({ ...o, href: reikiPath(o.slug) }))
          .concat([{ ...start, href: facialPath(start.slug) }]),
      }),
    });
  }

  // ── Waxing ───────────────────────────────────────────────────────────────
  addPage({
    path: '/services/waxing-services/',
    title: 'Waxing Services in Rancho Cucamonga | Grace Zen House',
    description:
      'Gentle, detailed waxing for all genders in Rancho Cucamonga — brows from $20, Brazilian $60, full body $300. See the full menu and aftercare.',
    schema: [breadcrumbLd([['Home', '/'], ['Services', '/services/'], ['Waxing', '/services/waxing-services/']])],
    body: `
    ${crumbs([['Home', '/'], ['Services', '/services/'], ['Waxing', '/services/waxing-services/']])}
    ${pageHead('Smooth, radiant skin, head to toe.', 'Gentle, detailed waxing with high-quality products for long-lasting results — suitable for all skin types, and welcoming to all genders.')}
    <section class="menu-sheet wrap" aria-labelledby="wax-menu">
      <h2 id="wax-menu" class="menu-sheet__title">Menu &amp; pricing</h2>
      <div class="menu-sheet__cols">${waxMenu()}</div>
      <div class="menu__group">
        <h3 class="menu__heading">Add-ons</h3>
        <ul class="menu">${waxing.addons.map((a) => menuRow({ ...a, note: a.desc })).join('')}</ul>
      </div>
      <p class="small muted">“Varies” prices are confirmed when you book.</p>
    </section>
    <section class="care wrap" aria-label="Waxing care">
      <div><h2 class="detail__label">Before your wax</h2><p>${esc(waxing.before)}</p></div>
      <div><h2 class="detail__label">After your wax</h2><p>${esc(waxing.after)}</p></div>
    </section>
    <section class="offerings wrap" aria-label="Featured waxing services">
      ${Object.entries(waxing.pages)
        .map(
          ([slug, w]) => `
        <article class="offering">
          <h2><a href="/services/waxing-services/${slug}/">${esc(w.name)}</a></h2>
          <p>${esc(w.summary)}</p>
          <div class="offering__foot"><span class="offering__price">${money(w.price)}</span>${bookLink(w.book, w.name)}</div>
        </article>`,
        )
        .join('')}
    </section>
    ${cta('Ready for silky, smooth skin?', 'Book your wax online, or call and I’ll help you plan it.')}`,
  });

  for (const [slug, w] of Object.entries(waxing.pages)) {
    const path = `/services/waxing-services/${slug}/`;
    const trail = [['Home', '/'], ['Services', '/services/'], ['Waxing', '/services/waxing-services/'], [w.name, path]];
    const other = Object.entries(waxing.pages).find(([s]) => s !== slug);
    addPage({
      path,
      title: `${w.name} in Rancho Cucamonga | Grace Zen House`,
      description:
        slug === 'brazilian-wax'
          ? 'Expert, discreet Brazilian waxing in Rancho Cucamonga — gentle wax, a private room and smoothness that lasts 4–6 weeks. $60. Book online.'
          : 'Head-to-toe waxing in one comprehensive, customizable session at Grace Zen House, Rancho Cucamonga. From $300. Book a consultation.',
      schema: [breadcrumbLd(trail), serviceLd(w, path, 'Waxing')],
      bookFor: w,
      body: detailPage({
        item: w,
        trail,
        media: slug === 'brazilian-wax' ? 'Folded white towels and a sprig of eucalyptus' : 'Warm wax and a wooden spatula on stone',
        extra: visitBlock([['Before you come', waxing.before], findStudio]),
        voice: testimonials.find((t) => t.author === 'Coleen Smith'),
        close: cta('Ready for silky, smooth skin?', 'Book your wax online, or call and I’ll help you plan it.', { ticks: false }),
        related: [
          { name: other[1].name, price: other[1].price, summary: other[1].summary, href: `/services/waxing-services/${other[0]}/` },
          { name: 'Full waxing menu', summary: 'From $10 · Face, body and intimate areas', href: '/services/waxing-services/' },
        ],
      }),
    });
  }

  // ── Pricing ──────────────────────────────────────────────────────────────
  const offerCatalog = {
    '@type': 'OfferCatalog',
    name: 'Grace Zen House menu',
    url: abs('/pricing/'),
    itemListElement: [
      ...facials.map((f) => ({ name: f.name, price: f.price })),
      ...reiki.map((r) => ({ name: r.fullName, price: r.price })),
      ...waxing.groups.flatMap((g) => g.items.filter((i) => i.price != null).map((i) => ({ name: `${i.name} wax`, price: i.price }))),
    ].map((o) => ({
      '@type': 'Offer',
      price: o.price,
      priceCurrency: 'USD',
      itemOffered: { '@type': 'Service', name: o.name, provider: { '@id': businessId } },
    })),
  };

  addPage({
    path: '/pricing/',
    title: 'Spa Menu & Pricing | Grace Zen House, Rancho Cucamonga',
    description:
      'Full menu and prices for facials ($110–$200), Reiki ($88–$111) and waxing ($10–$300) at Grace Zen House, Rancho Cucamonga. Book any service online.',
    schema: [breadcrumbLd([['Home', '/'], ['Pricing', '/pricing/']])],
    businessLd: { ...business, hasOfferCatalog: offerCatalog },
    body: `
    ${pageHead('Pricing', 'Every treatment, every price. Choose a service to learn more, or book it directly — each Book link opens that service in Square.')}
    <nav class="jump wrap" aria-label="Menu sections"><a href="#menu-facials">Facials</a><a href="#menu-reiki">Reiki</a><a href="#menu-waxing">Waxing</a></nav>
    <div class="menu-sheet wrap">
      <section id="menu-facials" class="menu-sheet__section" aria-labelledby="mf">
        <h2 id="mf" class="menu-sheet__title">Facials</h2>
        <div class="menu-sheet__cols">${facialMenu()}</div>
        <p class="small muted">Add a customized nourishing mask to a Dermaplaning Facial for $20.</p>
      </section>
      <section id="menu-reiki" class="menu-sheet__section" aria-labelledby="mr">
        <h2 id="mr" class="menu-sheet__title">Reiki</h2>
        <ul class="menu">${reiki.map((r) => menuRow({ name: r.fullName, href: reikiPath(r.slug), price: r.price, book: r.book, bookAs: r.name })).join('')}</ul>
      </section>
      <section id="menu-waxing" class="menu-sheet__section" aria-labelledby="mw">
        <h2 id="mw" class="menu-sheet__title">Waxing</h2>
        <div class="menu-sheet__cols">${waxMenu()}</div>
        <div class="menu__group">
          <h3 class="menu__heading">Waxing add-ons</h3>
          <ul class="menu">${waxing.addons.map((a) => menuRow({ ...a, note: a.desc })).join('')}</ul>
        </div>
        <p class="small muted">“Varies” prices are confirmed when you book. Full body wax is customizable; the final price is confirmed during consultation.</p>
      </section>
    </div>
    ${cta()}`,
  });

  // ── About ────────────────────────────────────────────────────────────────
  addPage({
    path: '/about/',
    title: 'About Grace Zen House | Esthetician & Reiki Master',
    description:
      'A sanctuary in Rancho Cucamonga where advanced skincare and Reiki energy healing come together. Meet the esthetician and Reiki master behind it.',
    schema: [breadcrumbLd([['Home', '/'], ['About', '/about/']])],
    body: `
    <section class="meet">
      <div class="meet__text">
        <h1 class="display meet__title">Meet Grace.</h1>
        ${lockup}
        <p class="meet__name">${ownerName}</p>
        <ul class="creds">${creds}</ul>
        ${owner.bio.map((p) => `<p>${todo(p)}</p>`).join('')}
        <div class="actions">
          ${bookAny()}
        </div>
      </div>
      ${ph('Portrait of Grace in the studio', 'portrait', '', 'meet__portrait')}
    </section>
    <section class="belief" aria-labelledby="belief-title">
      <div class="wrap belief__grid">
        <h2 id="belief-title" class="belief__line">True beauty can’t be separated from inner&nbsp;peace.</h2>
        <div class="belief__body">
          <p>That belief is why Grace Zen House exists. I wanted a space where advanced skincare and energy healing work together to care for the whole person.</p>
          <p>After years of perfecting my techniques and building a loyal following, I opened the studio to offer care that is results-driven, yet deeply calming.</p>
        </div>
      </div>
    </section>
    <section class="room wrap" aria-labelledby="room-title">
      ${ph('The studio: soft light, plants, a made treatment bed', '4x5', '', 'room__media')}
      <div class="room__text">
        <h2 id="room-title">What a visit feels like</h2>
        <dl class="room__list">
          <div><dt>More than skin</dt><dd>Reiki and mindful care address stress, one of the root causes of premature aging.</dd></div>
          <div><dt>Tailored to you</dt><dd>Every facial follows a thorough skin analysis, using professional-grade Circadia and Hale &amp; Hush products.</dd></div>
          <div><dt>A calm room</dt><dd>Soft lighting, serene music and a clean, elegant space, far from the everyday.</dd></div>
          <div><dt>Everyone welcome</dt><dd>Whatever your gender, age or background, you’re welcome here.</dd></div>
        </dl>
      </div>
    </section>
    <section class="voices voices--grid" aria-labelledby="about-voices">
      <div class="wrap">
        <div class="voices__head">
          <h2 id="about-voices">${site.rating.value} stars across ${site.rating.count} Google reviews</h2>
          ${linkArrow(site.reviewsUrl, 'Read them on Google', '', ext)}
        </div>
        <div class="voices__more">${testimonials.map((t) => quote(t)).join('')}</div>
      </div>
    </section>
    ${cta('Become part of the story.', 'I’d love to welcome you. Book your first visit online, or call with any questions.')}`,
  });

  // ── Contact ──────────────────────────────────────────────────────────────
  addPage({
    path: '/contact/',
    title: 'Contact & Directions | Grace Zen House, Rancho Cucamonga',
    description:
      'Visit Grace Zen House at 7365 Carnelian St, Suite 222A, Rancho Cucamonga, in the Haven Village Shopping Center. By appointment. (626) 806-5016.',
    schema: [breadcrumbLd([['Home', '/'], ['Contact', '/contact/']])],
    body: `
    ${pageHead('I’d love to welcome you.', 'Reach out to book your appointment, or simply ask which treatment would suit you best.')}
    <section class="contact wrap">
      <div class="contact__details">
        <div class="contact__block">
          <h2 class="footer-label">Studio</h2>
          <address class="contact__address">${street()}<br>${site.address.city}, ${site.address.region} ${site.address.postal}</address>
          <p class="muted">In the ${site.address.landmark}</p>
          ${linkArrow(site.mapsUrl, 'Get directions', '', ext)}
        </div>
        <div class="contact__block">
          <h2 class="footer-label">Hours</h2>
          <p>${site.hours}. Please book your session in advance.</p>
        </div>
        <div class="contact__block">
          <h2 class="footer-label">Get in touch</h2>
          <ul class="plain contact__list">
            <li><a href="${site.phoneHref}">${site.phone}</a></li>
            <li><a href="mailto:${site.email}">${site.email}</a></li>
            <li><a href="${site.instagram.url}"${attrs(ext)}>${site.instagram.handle} on Instagram</a></li>
          </ul>
        </div>
        <div class="actions">${bookAny()}</div>
      </div>
      <div class="contact__map">
        <p class="contact__map-label">Map · ${esc(site.address.full)}</p>
        <iframe title="Map showing Grace Zen House at ${esc(site.address.full)}" src="https://www.google.com/maps/embed?origin=mfe&amp;pb=!1m3!2m1!1s${site.mapsQuery.replace(/%20/g, '+')}!6i16" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </section>
    <section class="first-visit wrap" aria-labelledby="fv-title">
      <h2 id="fv-title">Your first visit</h2>
      ${stepsList([
        `Book online through Square, or call ${site.phone} and I’ll help you choose a treatment.`,
        'Let me know about any skin concerns, allergies or special requests ahead of time.',
        `Find the studio in the ${site.address.landmark}, Suite 222A.`,
        `Can’t make it in? <a href="${reikiPath('distance-reiki')}">Distance Reiki</a> can be received from home.`,
      ])}
    </section>`,
  });

  // ── 404 ──────────────────────────────────────────────────────────────────
  addPage({
    path: '/404.html',
    noindex: true,
    title: 'Page not found | Grace Zen House',
    description: 'This page doesn’t exist. Explore facials, Reiki and waxing at Grace Zen House in Rancho Cucamonga.',
    body: `
    <section class="page-head page-head--404 wrap">
      <h1 class="display display--md">This path leads nowhere. Take a&nbsp;breath.</h1>
      <p class="lede">The page you were looking for has moved or no longer exists (error 404).</p>
      <div class="actions"><a class="btn btn--primary" href="/">Return home</a><a class="link-quiet" href="/services/">Browse services</a></div>
    </section>`,
  });
  // 404 must not advertise a canonical URL of its own.
  const p404 = join(DIST, '404.html');
  writeFileSync(
    p404,
    readFileSync(p404, 'utf8')
      .replace(/\s*<link rel="canonical"[^>]*>/, '\n  <meta name="robots" content="noindex">')
      .replace(/\s*<meta property="og:url"[^>]*>/, ''),
  );

  // ── sitemap & robots ─────────────────────────────────────────────────────
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map((p) => `  <url><loc>${abs(p)}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

  // ── Cloudflare Pages / Workers static assets ─────────────────────────────
  // Retired pages from the previous site → closest current page (mirrors nginx.conf).
  // First match wins, so exact paths come before the catch-all splats.
  const legacy = [
    ['/home', '/'],
    ['/terms', '/'],
    ['/track', '/'],
    ['/blog/anti-aging-facials-rancho-cucamonga', '/services/facial-treatments/'],
    ['/blog/reiki-anti-aging', '/services/reiki/'],
    ['/blog/dermaplaning-vs-microdermabrasion', '/services/facial-treatments/dermaplaning-facial/'],
    ['/blog/brazilian-wax-aftercare', '/services/waxing-services/brazilian-wax/'],
    ['/blog/facials-for-sensitive-skin', '/services/facial-treatments/sensitive-skin-facial/'],
    ['/blog/hydrafacial-vs-oxygen-rx', '/services/facial-treatments/hydrafacial/'],
    ['/blog/back-facial-benefits', '/services/facial-treatments/customized-back-facial/'],
    ['/blog/mens-waxing-skincare', '/services/waxing-services/'],
    ['/blog/led-light-therapy-anti-aging', '/services/facial-treatments/brightening-facial-with-led/'],
    ['/blog/rancho-cucamonga-professionals-grace-zen', '/'],
    ['/blog', '/services/'],
    ['/locations', '/contact/'],
  ];
  const redirects = [
    ...legacy.flatMap(([from, to]) => [`${from} ${to} 301`, `${from}/ ${to} 301`]),
    '/blog/* /services/ 301',
    '/locations/* /contact/ 301',
  ];
  writeFileSync(join(DIST, '_redirects'), `${redirects.join('\n')}\n`);
  writeFileSync(
    join(DIST, '_headers'),
    `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
  );

  if (owner.isPlaceholder) warnings.push('owner name/credentials are placeholders (src/data.mjs → owner)');
  if (!facials.some((f) => f.duration)) warnings.push('facial durations not set yet (src/data.mjs → facials[].duration)');
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  console.log(`Built ${pages.length} pages + 404 → dist/`);
}

// ── dev server ──────────────────────────────────────────────────────────────
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function serve(port = 4321) {
  createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (!rel.endsWith('/') && !extname(rel) && existsSync(join(DIST, rel, 'index.html'))) {
      res.writeHead(301, { Location: `${rel}/${url.search}` });
      return res.end();
    }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = join(DIST, rel);
    const found = file.startsWith(DIST) && existsSync(file);
    res.writeHead(found ? 200 : 404, {
      'Content-Type': TYPES[extname(found ? file : '.html')] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(readFileSync(found ? file : join(DIST, '404.html')));
  }).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}`));

  // Serialize rebuilds so overlapping saves can't delete dist/ mid-write.
  let timer;
  let running = Promise.resolve();
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      running = running.then(() => build()).catch((e) => console.error(e));
    }, 100);
  });
}

await build();
if (process.argv.includes('--serve')) serve();
