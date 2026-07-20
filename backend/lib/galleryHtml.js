const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STUDIO_NAME = process.env.GALLERY_STUDIO_NAME || 'Surrey Quays Photo Studio';

const layout = ({ title, body, extraHead = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  :root{
    --bg:#fafaf9;--surface:#fff;--ink:#1c1c1f;--ink-soft:#67676d;--ink-faint:#a8a8ad;
    --line:#ececea;--accent:#1c1c1f;--heart:#e64a4a;--gold:#c9a14d;
    --serif:'Cormorant Garamond',Georgia,serif;
    --sans:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  }
  html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
  a{color:inherit}
  img{-webkit-user-select:none;user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none}
  button{font-family:inherit}

  /* ---------- HERO ---------- */
  .hero{position:relative;height:88vh;min-height:520px;width:100%;overflow:hidden;background:#0e0e10}
  .hero .cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;filter:brightness(0.78)}
  .hero .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.10) 35%,rgba(0,0,0,0.45) 100%)}
  .hero .studio{position:absolute;top:24px;left:0;right:0;text-align:center;color:#fff;font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;opacity:0.92}
  .hero .center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;padding:0 24px;width:100%}
  .hero .center h1{font-family:var(--serif);font-weight:500;font-size:clamp(40px,7vw,86px);line-height:1.05;margin:0 0 16px;letter-spacing:0.01em}
  .hero .center .date{font-family:var(--sans);font-size:12px;letter-spacing:0.32em;text-transform:uppercase;opacity:0.92}
  .hero .scroll{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);color:#fff;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:500;opacity:0.9}
  .hero .scroll svg{display:block;margin:8px auto 0;animation:b 2s ease-in-out infinite}
  @keyframes b{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
  .no-cover .hero{display:none}

  /* ---------- STICKY TOP BAR ---------- */
  .topbar{position:sticky;top:0;z-index:20;background:rgba(250,250,249,0.92);backdrop-filter:saturate(180%) blur(14px);-webkit-backdrop-filter:saturate(180%) blur(14px);border-bottom:1px solid var(--line)}
  .topbar .inner{max-width:1400px;margin:0 auto;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px}
  .topbar .brand{font-family:var(--serif);font-size:22px;font-weight:500}
  .topbar .meta{display:none;font-size:12px;color:var(--ink-soft);letter-spacing:0.04em}
  @media(min-width:720px){.topbar .meta{display:block}}
  .iconbtn{background:transparent;border:0;color:var(--ink);padding:8px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-weight:600;font-size:13px;transition:background 0.15s}
  .iconbtn:hover{background:rgba(0,0,0,0.06)}
  .iconbtn svg{width:18px;height:18px;display:block}
  .iconbtn .count{font-size:12px;color:var(--ink-soft);min-width:14px;text-align:left}
  .iconbtn.active svg{fill:var(--heart);stroke:var(--heart)}
  .toolbar{display:flex;align-items:center;gap:4px}

  /* ---------- FILTERS ---------- */
  .filters{max-width:1400px;margin:0 auto;padding:32px 22px 8px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
  .filters .left{display:flex;gap:6px;align-items:center}
  .filters .left button{background:transparent;border:0;color:var(--ink-soft);padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:0.04em}
  .filters .left button.active{background:var(--ink);color:#fff}
  .filters .total{font-size:12px;color:var(--ink-faint);letter-spacing:0.04em}

  /* ---------- MASONRY ---------- */
  main{max-width:1400px;margin:0 auto;padding:14px 22px 80px;position:relative}
  .grid{column-count:1;column-gap:10px}
  @media(min-width:560px){.grid{column-count:2}}
  @media(min-width:880px){.grid{column-count:3}}
  @media(min-width:1280px){.grid{column-count:4}}
  .tile{position:relative;margin:0 0 10px;break-inside:avoid;background:#eee;border-radius:2px;overflow:hidden;cursor:zoom-in;display:block}
  .tile img{width:100%;height:auto;display:block}
  .tile .ribbon{position:absolute;top:10px;right:10px;color:#fff;background:rgba(0,0,0,0.45);width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.18s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .tile:hover .ribbon{opacity:1}
  .tile .ribbon svg{width:16px;height:16px}
  .tile.faved .ribbon{opacity:1;color:var(--heart);background:rgba(255,255,255,0.92)}
  .tile.faved .ribbon svg{fill:var(--heart)}
  .tile .star{position:absolute;top:10px;left:10px;color:var(--gold);font-size:16px;text-shadow:0 1px 4px rgba(0,0,0,0.4)}
  /* Tiny original-filename tag, very top-left of each photo. */
  .tile .fname{position:absolute;top:6px;left:6px;max-width:calc(100% - 12px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(0,0,0,0.42);color:#fff;font-size:9px;font-weight:500;letter-spacing:0.02em;padding:2px 6px;border-radius:3px;pointer-events:none;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
  .tile.hidden{display:none}
  /* Note shown above the masonry grid (e.g. when filtering by Favorites). */
  .grid-note{margin:0 0 16px;padding:12px 16px;background:#fff;border:1px solid var(--line);border-left:3px solid var(--ink);border-radius:4px;color:var(--ink);font-size:13px;font-weight:500}
  .grid-note .em{font-family:var(--serif);font-style:italic;font-size:15px;color:var(--ink)}

  /* Sale banner shown above the gallery + everywhere prints are offered. */
  .sale-banner{background:linear-gradient(135deg,#e64a4a 0%,#c43030 100%);color:#fff;padding:14px 22px;text-align:center;font-weight:600;font-size:13px;letter-spacing:0.06em;text-transform:uppercase}
  .sale-banner strong{font-family:var(--serif);font-style:italic;font-weight:600;font-size:18px;text-transform:none;letter-spacing:0;display:inline-block;margin:0 6px}

  /* Basket count pill on the basket icon */
  .basket-pill{position:absolute;top:0;right:0;background:#e64a4a;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:999px;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1}
  .iconbtn{position:relative}

  /* Basket items inside the modal */
  .basket-items{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
  .basket-row{display:flex;align-items:center;gap:12px;padding:10px;background:#fff;border:1px solid var(--line);border-radius:6px}
  .basket-row img{width:54px;height:54px;object-fit:cover;border-radius:3px;flex-shrink:0}
  .basket-row .ph{width:54px;height:54px;border-radius:3px;background:#f0f0ee;display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-size:11px;flex-shrink:0}
  .basket-row .info{flex:1;min-width:0}
  .basket-row .info .nm{font-weight:600;font-size:14px}
  .basket-row .info .sub{color:var(--ink-soft);font-size:12px;margin-top:2px}
  .basket-row .price{font-weight:700;font-size:14px;text-align:right;min-width:64px}
  .basket-row .rm{background:transparent;border:0;color:var(--ink-faint);cursor:pointer;padding:6px;border-radius:4px;flex-shrink:0}
  .basket-row .rm:hover{color:#e64a4a;background:rgba(230,74,74,0.08)}
  .basket-totals{padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:6px;margin-bottom:16px;font-size:13px}
  .basket-totals .row{display:flex;justify-content:space-between;padding:4px 0}
  .basket-totals .row.discount{color:#c43030;font-weight:700}
  .basket-totals .row.total{border-top:1px solid var(--line);margin-top:6px;padding-top:10px;font-weight:700;font-size:16px}
  .basket-empty{text-align:center;padding:30px 0;color:var(--ink-faint);font-size:14px}
  .empty{color:var(--ink-faint);text-align:center;padding:60px 0;font-size:14px}

  /* ---------- PASSWORD ---------- */
  .pw{max-width:380px;margin:80px auto;padding:36px 32px;background:var(--surface);border:1px solid var(--line);border-radius:6px;text-align:center}
  .pw h2{font-family:var(--serif);font-weight:500;font-size:28px;margin:0 0 8px}
  .pw p{color:var(--ink-soft);font-size:13px;margin:0 0 22px}
  .pw input{width:100%;padding:12px 14px;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font-size:14px;margin-bottom:12px;font-family:inherit}
  .pw button{width:100%;padding:13px;background:var(--ink);color:#fff;border:0;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;letter-spacing:0.06em;text-transform:uppercase}
  .pw .err{color:#c14747;font-size:13px;margin-bottom:10px}

  /* ---------- LIGHTBOX ---------- */
  .lb{position:fixed;inset:0;background:rgba(15,15,17,0.96);display:none;z-index:50;align-items:center;justify-content:center}
  .lb.open{display:flex}
  .lb img{max-width:96vw;max-height:88vh;object-fit:contain;box-shadow:0 30px 80px rgba(0,0,0,0.5)}
  .lb .lb-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:18px 22px;color:#fff}
  .lb .lb-top .counter{font-size:11px;letter-spacing:0.04em;opacity:0.85;text-transform:none;max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lb .lb-actions{display:flex;align-items:center;gap:2px}
  .lb .lb-actions button,.lb .lb-actions a{background:transparent;border:0;color:#fff;padding:9px;border-radius:999px;cursor:pointer;opacity:0.85;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
  .lb .lb-actions button:hover,.lb .lb-actions a:hover{opacity:1;background:rgba(255,255,255,0.08)}
  .lb .lb-actions svg{width:20px;height:20px}
  .lb .lb-actions .active svg{fill:var(--heart);stroke:var(--heart)}
  .lb .nav{position:absolute;top:50%;transform:translateY(-50%);background:transparent;color:#fff;border:0;font-size:42px;width:54px;height:54px;cursor:pointer;opacity:0.8;line-height:1}
  .lb .nav:hover{opacity:1}
  .lb .prev{left:14px}.lb .next{right:14px}

  /* ---------- STORE MODAL ---------- */
  .store{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:none;align-items:center;justify-content:center;z-index:60;padding:20px}
  .store.open{display:flex}
  .store-card{position:relative;background:var(--surface);border-radius:8px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;padding:30px 32px}
  .store-card h2{font-family:var(--serif);font-weight:500;font-size:28px;margin:0 0 6px}
  .store-card .sub{color:var(--ink-soft);font-size:13px;margin:0 0 22px}
  .store-card .close{position:absolute;top:18px;right:20px;background:transparent;color:var(--ink);border:0;font-size:24px;cursor:pointer;line-height:1}
  .field{margin-bottom:14px}
  .field label{display:block;font-size:11px;font-weight:600;color:var(--ink-soft);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.12em}
  .field input{width:100%;padding:11px 13px;background:#fff;border:1px solid var(--line);border-radius:4px;color:var(--ink);font-size:14px;font-family:inherit}
  .store-select{width:100%;padding:11px 13px;background:#fff;border:1px solid var(--line);border-radius:4px;color:var(--ink);font-size:14px;font-family:inherit;appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%231c1c1f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}
  .store-product-desc{margin-top:8px;color:var(--ink-soft);font-size:13px;line-height:1.4;min-height:18px}
  .qty{display:flex;align-items:center;gap:8px}
  .qty button{width:32px;height:32px;border:1px solid var(--line);background:#fff;border-radius:4px;cursor:pointer;font-size:16px}
  .qty span{min-width:28px;text-align:center;font-weight:600}
  .photo-pick{display:flex;align-items:center;gap:12px;padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:6px;margin-bottom:16px;font-size:13px;color:var(--ink-soft)}
  .photo-pick img{width:46px;height:46px;object-fit:cover;border-radius:3px}
  .summary{padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:6px;margin-bottom:16px;display:flex;justify-content:space-between;font-weight:700}
  .store-card .btn{display:block;width:100%;padding:14px;background:var(--ink);color:#fff;border:0;border-radius:4px;font-weight:600;cursor:pointer;font-size:13px;letter-spacing:0.1em;text-transform:uppercase}
  .store-card .btn:disabled{opacity:0.4;cursor:not-allowed}
  .err{color:#c14747;font-size:13px;margin-bottom:10px}

  /* ---------- FOOTER ---------- */
  footer{padding:40px 22px;text-align:center;color:var(--ink-faint);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;border-top:1px solid var(--line);margin-top:20px}
  footer span{display:block;margin-top:6px;font-size:10px;letter-spacing:0.1em;color:var(--ink-faint);text-transform:none;opacity:0.7}
</style>
${extraHead}
</head>
<body oncontextmenu="return false">
${body}
</body>
</html>`;

const renderPasswordPage = ({ slug, error }) => {
  const body = `
    <div class="pw">
      <h2>Private gallery</h2>
      <p>Please enter the password your photographer shared with you.</p>
      ${error ? `<div class="err">${escapeHtml(error)}</div>` : ''}
      <form method="post" action="/g/${escapeHtml(slug)}/unlock" autocomplete="off">
        <input name="password" type="password" required autofocus />
        <button type="submit">View Gallery</button>
      </form>
    </div>`;
  return layout({ title: 'Private gallery', body });
};

// Small inline SVG icons (no external font/icon dep — works offline on Render).
const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>',
};

const renderGalleryPage = ({
  gallery,
  photos,
  coverUrl,
  downloadEnabled,
  products,
  currency,
  discountPct = 0,
}) => {
  const photosJson = JSON.stringify(photos);
  const productsJson = JSON.stringify(products || []);
  const shoot = new Date(gallery.shootDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const cover = coverUrl
    ? `<img class="cover" src="${escapeHtml(coverUrl)}" alt="" />`
    : '';

  const body = `
    <section class="hero${coverUrl ? '' : ' no-cover'}">
      ${cover}
      <div class="scrim"></div>
      <div class="studio">${escapeHtml(STUDIO_NAME)}</div>
      <div class="center">
        <h1>${escapeHtml(gallery.clientName)}</h1>
        <div class="date">${escapeHtml(shoot)}</div>
      </div>
      <div class="scroll">View gallery
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </section>

    ${discountPct > 0 && (products || []).length
      ? `<div class="sale-banner">Limited time · <strong>${discountPct}% OFF</strong> all prints — applied automatically at checkout</div>`
      : ''}

    <div class="topbar">
      <div class="inner">
        <div class="brand">${escapeHtml(gallery.clientName)}</div>
        <div class="meta">${escapeHtml(shoot)} · ${photos.length} photo${photos.length === 1 ? '' : 's'}</div>
        <div class="toolbar">
          <button class="iconbtn" id="favCountBtn" title="Favorites">${ICON.heart}<span class="count" id="favCount">0</span></button>
          ${downloadEnabled ? `<a class="iconbtn" href="/g/${escapeHtml(gallery.slug)}/download-all" title="Download all">${ICON.download}</a>` : ''}
          ${(products || []).length
            ? `<button class="iconbtn" id="openBasketBtn" title="Basket">${ICON.bag}<span class="basket-pill" id="basketPill" style="display:none">0</span></button>`
            : ''}
          <button class="iconbtn" id="shareBtn" title="Copy share link">${ICON.share}</button>
        </div>
      </div>
    </div>

    <div class="filters">
      <div class="left">
        <button class="active" data-filter="all">All</button>
        <button data-filter="highlights">Highlights</button>
        <button data-filter="favorites">My Favorites</button>
      </div>
      <div class="total">${photos.length} photo${photos.length === 1 ? '' : 's'}</div>
    </div>

    <main>
      <div class="grid-note" id="favNote" style="display:none">
        <span class="em">My favourite picture will count as your selected picture.</span>
        Tap the heart on any photo to add it to your favourites — your photographer will see what you picked.
      </div>
      <div class="grid" id="grid">
        ${photos
          .map(
            (p) => `<div class="tile${p.isHighlight ? ' has-star' : ''}" data-id="${escapeHtml(p._id)}" data-highlight="${p.isHighlight ? '1' : '0'}">
              <img src="${escapeHtml(p.url)}" alt="" loading="lazy" draggable="false" />
              ${p.name ? `<div class="fname">${escapeHtml(p.name)}</div>` : ''}
              ${p.isHighlight ? '<div class="star">★</div>' : ''}
              <button class="ribbon" data-fav="${escapeHtml(p._id)}" aria-label="Favorite">${ICON.heart}</button>
            </div>`
          )
          .join('')}
      </div>
      ${photos.length === 0 ? '<div class="empty">No photos in this gallery yet.</div>' : ''}
    </main>

    <div class="lb" id="lb" role="dialog" aria-modal="true">
      <div class="lb-top">
        <div class="counter" id="lbCounter">—</div>
        <div class="lb-actions">
          <button id="lbFav" aria-label="Favorite">${ICON.heart}</button>
          ${downloadEnabled ? `<a id="lbDl" href="#" aria-label="Download">${ICON.download}</a>` : ''}
          ${(products || []).length ? `<button id="lbBuy" aria-label="Order print">${ICON.bag}</button>` : ''}
          <button id="lbClose" aria-label="Close">${ICON.close}</button>
        </div>
      </div>
      <button class="nav prev" aria-label="Previous">‹</button>
      <img id="lbImg" alt="" draggable="false" />
      <button class="nav next" aria-label="Next">›</button>
    </div>

    <!-- ADD-TO-BASKET modal: open from lightbox "Order print" or basket "Add another" -->
    <div class="store" id="store" role="dialog" aria-modal="true">
      <div class="store-card">
        <button class="close" id="storeClose" aria-label="Close">${ICON.close}</button>
        <h2>Add print to basket</h2>
        <p class="sub">${discountPct > 0 ? `<strong style="color:#c43030">${discountPct}% off</strong> applied automatically at checkout.` : 'Choose a print size below.'}</p>
        <div id="storeErr"></div>
        <div id="storePhotoPick"></div>
        <div class="field">
          <label>Print size</label>
          <select id="storeSku" class="store-select"></select>
          <div id="storeProductDesc" class="store-product-desc"></div>
        </div>
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
          <div>
            <label style="display:block;font-size:11px;font-weight:600;color:var(--ink-soft);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.12em">Quantity</label>
            <div class="qty">
              <button type="button" id="qtyMinus">−</button>
              <span id="qtyVal">1</span>
              <button type="button" id="qtyPlus">+</button>
            </div>
          </div>
        </div>
        <div class="summary"><span>Line total</span><span id="storeTotal">—</span></div>
        <button type="button" class="btn" id="storeAdd">Add to basket</button>
      </div>
    </div>

    <!-- BASKET modal: review all items, enter email, checkout once -->
    <div class="store" id="basket" role="dialog" aria-modal="true">
      <div class="store-card">
        <button class="close" id="basketClose" aria-label="Close">${ICON.close}</button>
        <h2>Your basket</h2>
        <p class="sub">${discountPct > 0 ? `<strong style="color:#c43030">${discountPct}% off</strong> all prints applied automatically.` : 'Review your items before paying.'}</p>
        <div id="basketErr"></div>
        <div id="basketItems" class="basket-items"></div>
        <div id="basketTotals" class="basket-totals" style="display:none">
          <div class="row"><span>Subtotal</span><span id="bSubtotal">—</span></div>
          ${discountPct > 0 ? `<div class="row discount"><span>${discountPct}% discount</span><span id="bDiscount">—</span></div>` : ''}
          <div class="row" style="color:var(--ink-soft);font-size:12px"><span>Shipping</span><span>Chosen at checkout</span></div>
          <div class="row total"><span>Total before shipping</span><span id="bTotal">—</span></div>
        </div>
        <div id="basketEmailField" class="field" style="display:none">
          <label>Email (order confirmation)</label>
          <input type="email" id="basketEmail" required placeholder="you@example.com" />
        </div>
        <button type="button" class="btn" id="basketCheckout" disabled>Checkout</button>
      </div>
    </div>

    <footer>
      ${escapeHtml(STUDIO_NAME)}
      <span>Photos are watermarked and shared privately. Please don't redistribute without permission.</span>
    </footer>

    <script>
      // Deterrents only — honest comment: context-menu/drag/select are blocked
      // for casual users; screenshots and DevTools still work. The burned-in
      // watermark on each web preview is the real attribution.
      document.addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });

      const PHOTOS = ${photosJson};
      const PRODUCTS = ${productsJson};
      const SLUG = ${JSON.stringify(gallery.slug)};
      const DOWNLOAD = ${downloadEnabled ? 'true' : 'false'};
      const CURRENCY = ${JSON.stringify(currency || 'gbp')};

      // ----- Favorites: per-browser localStorage, no server round-trip -----
      const FAV_KEY = 'sqg_fav_' + SLUG;
      const loadFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); } };
      const saveFavs = (set) => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch {} };
      let FAVS = loadFavs();

      const fmtMoney = (minor) => (minor / 100).toLocaleString('en-GB', { style: 'currency', currency: CURRENCY.toUpperCase() });

      // ----- Hero scroll on click -----
      const heroScroll = document.querySelector('.hero .scroll');
      if (heroScroll) heroScroll.addEventListener('click', () => document.querySelector('.topbar')?.scrollIntoView({ behavior: 'smooth' }));

      // ----- Grid / filters -----
      const grid = document.getElementById('grid');
      const favCountEl = document.getElementById('favCount');
      function refreshFavUi() {
        favCountEl.textContent = FAVS.size;
        document.getElementById('favCountBtn').classList.toggle('active', FAVS.size > 0);
        grid.querySelectorAll('.tile').forEach((t) => t.classList.toggle('faved', FAVS.has(t.dataset.id)));
      }
      grid.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.ribbon');
        if (favBtn) {
          e.stopPropagation();
          const id = favBtn.dataset.fav;
          if (FAVS.has(id)) FAVS.delete(id); else FAVS.add(id);
          saveFavs(FAVS);
          refreshFavUi();
          applyFilter();
          return;
        }
        const tile = e.target.closest('.tile');
        if (tile) openLightboxAt(tile.dataset.id);
      });

      let currentFilter = 'all';
      function applyFilter() {
        grid.querySelectorAll('.tile').forEach((t) => {
          const show =
            currentFilter === 'all' ||
            (currentFilter === 'highlights' && t.dataset.highlight === '1') ||
            (currentFilter === 'favorites' && FAVS.has(t.dataset.id));
          t.classList.toggle('hidden', !show);
        });
        const favNote = document.getElementById('favNote');
        if (favNote) favNote.style.display = currentFilter === 'favorites' ? 'block' : 'none';
      }
      document.querySelectorAll('.filters .left button').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filters .left button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          applyFilter();
        });
      });

      // ----- Lightbox -----
      const lb = document.getElementById('lb');
      const lbImg = document.getElementById('lbImg');
      const lbCounter = document.getElementById('lbCounter');
      const lbFav = document.getElementById('lbFav');
      const lbDl = document.getElementById('lbDl');
      const lbBuy = document.getElementById('lbBuy');
      let lbIndex = 0;
      const visiblePhotos = () => PHOTOS.filter((p) => {
        const tile = grid.querySelector('.tile[data-id="' + p._id + '"]');
        return tile && !tile.classList.contains('hidden');
      });
      function renderLb() {
        const list = visiblePhotos();
        if (!list.length) { lb.classList.remove('open'); return; }
        if (lbIndex < 0) lbIndex = list.length - 1;
        if (lbIndex >= list.length) lbIndex = 0;
        const p = list[lbIndex];
        lbImg.src = p.url;
        // Show the original filename (top-left) so the customer references the
        // exact same file the studio has. Falls back to position if unnamed.
        lbCounter.textContent = p.name || ((lbIndex + 1) + ' / ' + list.length);
        if (lbDl) lbDl.href = '/g/' + SLUG + '/download/' + p._id;
        lbFav.classList.toggle('active', FAVS.has(p._id));
      }
      function openLightboxAt(id) {
        const list = visiblePhotos();
        lbIndex = Math.max(0, list.findIndex((p) => p._id === id));
        renderLb();
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeLightbox() { lb.classList.remove('open'); document.body.style.overflow = ''; }
      document.getElementById('lbClose').addEventListener('click', closeLightbox);
      lb.querySelector('.prev').addEventListener('click', () => { lbIndex--; renderLb(); });
      lb.querySelector('.next').addEventListener('click', () => { lbIndex++; renderLb(); });
      lbFav.addEventListener('click', () => {
        const list = visiblePhotos();
        const p = list[lbIndex];
        if (!p) return;
        if (FAVS.has(p._id)) FAVS.delete(p._id); else FAVS.add(p._id);
        saveFavs(FAVS);
        refreshFavUi();
        renderLb();
      });
      if (lbBuy) lbBuy.addEventListener('click', () => { const p = visiblePhotos()[lbIndex]; if (p) openStore(p._id); });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') { lbIndex--; renderLb(); }
        if (e.key === 'ArrowRight') { lbIndex++; renderLb(); }
      });

      // ----- Share -----
      document.getElementById('shareBtn').addEventListener('click', async () => {
        const url = window.location.origin + '/g/' + SLUG;
        try {
          if (navigator.share) await navigator.share({ title: document.title, url });
          else { await navigator.clipboard.writeText(url); flash('Link copied'); }
        } catch {}
      });
      function flash(msg) {
        let el = document.getElementById('__flash');
        if (!el) {
          el = document.createElement('div');
          el.id = '__flash';
          el.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;z-index:80;opacity:0;transition:opacity 0.2s';
          document.body.appendChild(el);
        }
        el.textContent = msg;
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 1600);
      }

      // ===== BASKET (persists in localStorage per gallery) =====
      const BASKET_KEY = 'sqg_basket_' + SLUG;
      const DISCOUNT_PCT = ${discountPct};
      const loadBasket = () => { try { return JSON.parse(localStorage.getItem(BASKET_KEY) || '[]'); } catch { return []; } };
      const saveBasket = (b) => { try { localStorage.setItem(BASKET_KEY, JSON.stringify(b)); } catch {} };
      let BASKET = loadBasket();

      function refreshBasketPill() {
        const pill = document.getElementById('basketPill');
        if (!pill) return;
        const n = BASKET.reduce((s, it) => s + it.qty, 0);
        pill.style.display = n > 0 ? 'flex' : 'none';
        pill.textContent = n;
      }

      // ----- Add-to-basket modal -----
      const storeEl = document.getElementById('store');
      const storeErr = document.getElementById('storeErr');
      const storeSku = document.getElementById('storeSku');
      const storeProductDesc = document.getElementById('storeProductDesc');
      const storePhotoPick = document.getElementById('storePhotoPick');
      const storeTotal = document.getElementById('storeTotal');
      const storeAdd = document.getElementById('storeAdd');
      const qtyVal = document.getElementById('qtyVal');
      let storeState = { photoId: null, sku: null, qty: 1 };

      function openStore(photoId) {
        if (!PRODUCTS.length) return;
        closeLightbox();
        closeBasket();
        storeState = { photoId: photoId || null, sku: PRODUCTS[0]?.sku || null, qty: 1 };
        renderStore();
        storeEl.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeStore() { storeEl.classList.remove('open'); document.body.style.overflow = ''; }
      function renderStore() {
        storeErr.innerHTML = '';
        if (storeState.photoId) {
          const p = PHOTOS.find((x) => x._id === storeState.photoId);
          storePhotoPick.innerHTML = p
            ? '<div class="photo-pick"><img src="' + p.url + '" alt="" /><div><div style="font-weight:600;color:var(--ink)">Print of selected photo</div><div>' + (p.name || 'Selected photo') + '</div></div></div>'
            : '';
        } else {
          storePhotoPick.innerHTML = '<div class="photo-pick">Open a photo from the gallery first to attach it, or add a generic print.</div>';
        }
        if (storeSku.options.length !== PRODUCTS.length) {
          storeSku.innerHTML = PRODUCTS.map((p) =>
            '<option value="' + p.sku + '">' + p.name + ' — ' + fmtMoney(p.priceMinor) + '</option>'
          ).join('');
        }
        if (storeSku.value !== storeState.sku) storeSku.value = storeState.sku || '';
        const sel = PRODUCTS.find((p) => p.sku === storeState.sku);
        storeProductDesc.textContent = sel?.description || '';
        qtyVal.textContent = storeState.qty;
        storeTotal.textContent = sel ? fmtMoney(sel.priceMinor * storeState.qty) : '—';
        storeAdd.disabled = !sel;
      }
      document.getElementById('qtyMinus').addEventListener('click', () => { storeState.qty = Math.max(1, storeState.qty - 1); renderStore(); });
      document.getElementById('qtyPlus').addEventListener('click', () => { storeState.qty = Math.min(50, storeState.qty + 1); renderStore(); });
      storeSku.addEventListener('change', () => { storeState.sku = storeSku.value; renderStore(); });
      document.getElementById('storeClose').addEventListener('click', closeStore);
      storeEl.addEventListener('click', (e) => { if (e.target === storeEl) closeStore(); });
      storeAdd.addEventListener('click', () => {
        const sel = PRODUCTS.find((p) => p.sku === storeState.sku);
        if (!sel) return;
        // Merge with an existing identical line (same sku + photo) to keep
        // the basket tidy when the user adds the same thing twice.
        const idx = BASKET.findIndex((it) => it.sku === sel.sku && (it.photoId || null) === (storeState.photoId || null));
        if (idx >= 0) {
          BASKET[idx].qty = Math.min(50, BASKET[idx].qty + storeState.qty);
        } else {
          BASKET.push({
            sku: sel.sku, name: sel.name, priceMinor: sel.priceMinor,
            qty: storeState.qty,
            photoId: storeState.photoId || null,
            photoName: storeState.photoId ? PHOTOS.find((p) => p._id === storeState.photoId)?.name : null,
            photoUrl: storeState.photoId ? PHOTOS.find((p) => p._id === storeState.photoId)?.url : null,
          });
        }
        saveBasket(BASKET);
        refreshBasketPill();
        flash('Added to basket');
        closeStore();
        openBasket();
      });

      // ----- Basket modal -----
      const basketEl = document.getElementById('basket');
      const basketItemsEl = document.getElementById('basketItems');
      const basketTotalsEl = document.getElementById('basketTotals');
      const basketEmailField = document.getElementById('basketEmailField');
      const basketEmail = document.getElementById('basketEmail');
      const basketCheckout = document.getElementById('basketCheckout');
      const basketErr = document.getElementById('basketErr');

      function openBasket() {
        closeLightbox(); closeStore();
        renderBasket();
        basketEl.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeBasket() { basketEl.classList.remove('open'); document.body.style.overflow = ''; }
      function renderBasket() {
        basketErr.innerHTML = '';
        if (!BASKET.length) {
          basketItemsEl.innerHTML = '<div class="basket-empty">Your basket is empty. Open any photo and tap the bag icon to add a print.</div>';
          basketTotalsEl.style.display = 'none';
          basketEmailField.style.display = 'none';
          basketCheckout.style.display = 'none';
          return;
        }
        basketItemsEl.innerHTML = BASKET.map((it, i) =>
          '<div class="basket-row">' +
            (it.photoUrl
              ? '<img src="' + it.photoUrl + '" alt="" />'
              : '<div class="ph">no photo</div>') +
            '<div class="info">' +
              '<div class="nm">' + it.name + '</div>' +
              '<div class="sub">' + fmtMoney(it.priceMinor) + ' each' + (it.photoName ? ' · ' + it.photoName : '') + '</div>' +
              '<div class="qty" style="margin-top:6px"><button type="button" data-act="dec" data-i="' + i + '">−</button><span>' + it.qty + '</span><button type="button" data-act="inc" data-i="' + i + '">+</button></div>' +
            '</div>' +
            '<div class="price">' + fmtMoney(it.priceMinor * it.qty) + '</div>' +
            '<button class="rm" type="button" data-act="rm" data-i="' + i + '" aria-label="Remove">×</button>' +
          '</div>'
        ).join('');
        const subtotal = BASKET.reduce((s, it) => s + it.priceMinor * it.qty, 0);
        const discount = Math.round(subtotal * DISCOUNT_PCT / 100);
        document.getElementById('bSubtotal').textContent = fmtMoney(subtotal);
        const bDisc = document.getElementById('bDiscount');
        if (bDisc) bDisc.textContent = '−' + fmtMoney(discount);
        document.getElementById('bTotal').textContent = fmtMoney(subtotal - discount);
        basketTotalsEl.style.display = 'block';
        basketEmailField.style.display = 'block';
        basketCheckout.style.display = 'block';
        const validEmail = basketEmail.value && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(basketEmail.value);
        basketCheckout.disabled = !validEmail;
        basketCheckout.textContent = 'Checkout · ' + fmtMoney(subtotal - discount);
      }
      basketItemsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        if (btn.dataset.act === 'inc') BASKET[i].qty = Math.min(50, BASKET[i].qty + 1);
        else if (btn.dataset.act === 'dec') BASKET[i].qty = Math.max(1, BASKET[i].qty - 1);
        else if (btn.dataset.act === 'rm') BASKET.splice(i, 1);
        saveBasket(BASKET);
        refreshBasketPill();
        renderBasket();
      });
      basketEmail.addEventListener('input', renderBasket);
      document.getElementById('basketClose').addEventListener('click', closeBasket);
      basketEl.addEventListener('click', (e) => { if (e.target === basketEl) closeBasket(); });
      basketCheckout.addEventListener('click', async () => {
        basketErr.innerHTML = '';
        basketCheckout.disabled = true;
        basketCheckout.textContent = 'Creating order…';
        try {
          const res = await fetch('/g/' + SLUG + '/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: basketEmail.value,
              items: BASKET.map((it) => ({ sku: it.sku, quantity: it.qty, photoId: it.photoId || undefined })),
            }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            // Clear basket — Stripe will redirect back to the gallery with ?ordered=1.
            BASKET = [];
            saveBasket(BASKET);
            window.location.href = data.url;
            return;
          }
          basketErr.innerHTML = '<div class="err">' + (data.message || ('Checkout failed (' + res.status + ')')) + '</div>';
        } catch (err) {
          basketErr.innerHTML = '<div class="err">Checkout failed: ' + err.message + '</div>';
        } finally {
          renderBasket();
        }
      });
      document.getElementById('openBasketBtn')?.addEventListener('click', openBasket);
      refreshBasketPill();

      // Initial paint
      refreshFavUi();
      applyFilter();
    </script>`;
  return layout({ title: gallery.clientName + ' — Gallery', body });
};

const renderMessagePage = ({ title, message }) => {
  const body = `<div class="pw"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div>`;
  return layout({ title, body });
};

module.exports = {
  renderPasswordPage,
  renderGalleryPage,
  renderMessagePage,
};
