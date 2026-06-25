const escapeHtml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = ({ title, body, extraHead = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#0b0b0d;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
  a{color:#fff}
  header{padding:24px 20px;border-bottom:1px solid #1c1c20;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
  header h1{margin:0;font-size:18px;letter-spacing:0.02em;font-weight:600}
  header .meta{font-size:13px;color:#9a9aa3}
  main{max-width:1400px;margin:0 auto;padding:20px;position:relative}
  .filters{display:flex;gap:8px;margin-bottom:18px}
  .filters button{background:#15151a;color:#f5f5f7;border:1px solid #232329;padding:8px 14px;border-radius:999px;font-size:13px;cursor:pointer;font-weight:600}
  .filters button.active{background:#fff;color:#000;border-color:#fff}
  .actions{display:flex;gap:8px;flex-wrap:wrap}
  .actions a,.actions button{background:#fff;color:#000;border:none;padding:9px 14px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none}
  .actions .ghost{background:transparent;color:#f5f5f7;border:1px solid #2a2a31}
  .grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
  .tile{position:relative;aspect-ratio:1;background:#15151a;border-radius:6px;overflow:hidden;cursor:zoom-in}
  .tile img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;pointer-events:none}
  .tile.hi::after{content:"★";position:absolute;top:8px;right:10px;color:#ffd84a;font-size:18px;text-shadow:0 1px 3px rgba(0,0,0,0.6)}
  .tile.hidden{display:none}
  .empty{color:#7a7a83;text-align:center;padding:60px 0;font-size:14px}
  .pw{max-width:380px;margin:80px auto;padding:32px 28px;background:#15151a;border:1px solid #232329;border-radius:14px}
  .pw h2{margin:0 0 8px;font-size:20px}
  .pw p{color:#9a9aa3;font-size:13px;margin:0 0 18px}
  .pw input{width:100%;padding:11px 12px;background:#0b0b0d;border:1px solid #2a2a31;border-radius:8px;color:#fff;font-size:14px;margin-bottom:12px}
  .pw button{width:100%;padding:11px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer}
  .pw .err{color:#ff7a7a;font-size:13px;margin-bottom:10px}
  /* Faint CSS watermark overlay — repeats over the grid in addition to the
     burned-in watermark. Honest comment: this only deters casual screenshotting;
     a determined user can disable CSS or inspect images. */
  .wm-overlay{pointer-events:none;position:absolute;inset:0;background-image:repeating-linear-gradient(-30deg,rgba(255,255,255,0.06) 0 1px,transparent 1px 140px);mix-blend-mode:overlay}
  /* Lightbox */
  .lb{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:none;align-items:center;justify-content:center;z-index:50}
  .lb.open{display:flex}
  .lb img{max-width:96vw;max-height:92vh;object-fit:contain;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}
  .lb .close{position:absolute;top:14px;right:18px;color:#fff;background:transparent;border:none;font-size:30px;cursor:pointer}
  .lb .nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.08);color:#fff;border:none;font-size:34px;width:48px;height:48px;border-radius:50%;cursor:pointer}
  .lb .prev{left:18px}.lb .next{right:18px}
  .lb .lb-actions{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:10px}
  .lb .lb-actions a,.lb .lb-actions button{background:#fff;color:#000;border:none;padding:9px 14px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none}
  /* mobile long-press save deterrent */
  img,.tile{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
  /* Store modal */
  .store{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;z-index:60;padding:20px}
  .store.open{display:flex}
  .store-card{background:#15151a;border:1px solid #232329;border-radius:14px;max-width:680px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;color:#f5f5f7}
  .store-card h2{margin:0 0 4px;font-size:20px}
  .store-card .sub{color:#9a9aa3;font-size:13px;margin:0 0 18px}
  .store-card .close{position:absolute;top:18px;right:22px;background:transparent;color:#fff;border:none;font-size:24px;cursor:pointer}
  .store-card .empty{color:#7a7a83;text-align:center;padding:30px 0;font-size:14px}
  .products{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:18px}
  .product{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#0b0b0d;border:1px solid #232329;border-radius:10px;cursor:pointer}
  .product.selected{border-color:#fff;background:#1a1a20}
  .product .name{font-weight:600;font-size:14px}
  .product .desc{color:#9a9aa3;font-size:12px;margin-top:2px}
  .product .price{margin-left:auto;font-weight:700;font-size:15px}
  .qty{display:flex;align-items:center;gap:8px}
  .qty button{width:32px;height:32px;border:1px solid #2a2a31;background:#0b0b0d;color:#fff;border-radius:6px;cursor:pointer;font-size:16px}
  .qty span{min-width:24px;text-align:center;font-weight:600}
  .field{margin-bottom:12px}
  .field label{display:block;font-size:12px;font-weight:600;color:#9a9aa3;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em}
  .field input{width:100%;padding:11px 12px;background:#0b0b0d;border:1px solid #2a2a31;border-radius:8px;color:#fff;font-size:14px}
  .photo-pick{display:flex;align-items:center;gap:10px;padding:10px;background:#0b0b0d;border:1px solid #232329;border-radius:8px;margin-bottom:12px}
  .photo-pick img{width:48px;height:48px;object-fit:cover;border-radius:4px}
  .summary{padding:12px 14px;background:#0b0b0d;border:1px solid #232329;border-radius:10px;margin-bottom:16px;display:flex;justify-content:space-between;font-weight:700}
  .store-card .btn{display:block;width:100%;padding:13px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:15px}
  .store-card .btn:disabled{opacity:0.4;cursor:not-allowed}
  .store-card .err{color:#ff7a7a;font-size:13px;margin-bottom:10px}
  footer{padding:30px 20px;text-align:center;color:#5a5a63;font-size:12px}
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
        <button type="submit">View gallery</button>
      </form>
    </div>`;
  return layout({ title: 'Private gallery', body });
};

const renderGalleryPage = ({ gallery, photos, downloadEnabled, watermarkOverlay, products, currency }) => {
  const photosJson = JSON.stringify(photos);
  const productsJson = JSON.stringify(products || []);
  const shoot = new Date(gallery.shootDate).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const body = `
    <header>
      <div>
        <h1>${escapeHtml(gallery.clientName)}</h1>
        <div class="meta">${escapeHtml(shoot)} · ${photos.length} photo${photos.length === 1 ? '' : 's'}</div>
      </div>
      <div class="actions">
        ${downloadEnabled ? `<a href="/g/${escapeHtml(gallery.slug)}/download-all">Download all</a>` : ''}
        ${(products || []).length ? `<button class="ghost" id="openStoreBtn">Order prints</button>` : ''}
      </div>
    </header>
    <main>
      ${watermarkOverlay ? '<div class="wm-overlay" aria-hidden="true"></div>' : ''}
      <div class="filters">
        <button class="active" data-filter="all">All</button>
        <button data-filter="highlights">Highlights ★</button>
      </div>
      <div class="grid" id="grid">
        ${photos
          .map(
            (p) =>
              `<div class="tile ${p.isHighlight ? 'hi' : ''}" data-id="${p._id}" data-highlight="${p.isHighlight ? '1' : '0'}">
                <img src="${escapeHtml(p.url)}" alt="" loading="lazy" draggable="false" />
              </div>`
          )
          .join('')}
      </div>
      ${photos.length === 0 ? '<div class="empty">No photos in this gallery yet.</div>' : ''}
    </main>

    <div class="lb" id="lb" role="dialog" aria-modal="true">
      <button class="close" aria-label="Close">×</button>
      <button class="nav prev" aria-label="Previous">‹</button>
      <img id="lbImg" alt="" draggable="false" />
      <button class="nav next" aria-label="Next">›</button>
      <div class="lb-actions" id="lbActions"></div>
    </div>

    <div class="store" id="store" role="dialog" aria-modal="true">
      <div class="store-card" style="position:relative">
        <button class="close" id="storeClose" aria-label="Close">×</button>
        <h2>Order prints</h2>
        <p class="sub">Choose a print size and we'll handle the rest.</p>
        <div id="storeErr"></div>

        <div id="storePhotoPick"></div>

        <div class="field">
          <label>Print</label>
          <div class="products" id="storeProducts"></div>
        </div>

        <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">
          <div style="flex:0 0 auto">
            <label style="display:block;font-size:12px;font-weight:600;color:#9a9aa3;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em">Quantity</label>
            <div class="qty">
              <button type="button" id="qtyMinus">−</button>
              <span id="qtyVal">1</span>
              <button type="button" id="qtyPlus">+</button>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Email (for order confirmation)</label>
          <input type="email" id="storeEmail" required placeholder="you@example.com" />
        </div>

        <div class="summary"><span>Subtotal</span><span id="storeTotal">—</span></div>

        <button type="button" class="btn" id="storeCheckout" disabled>Continue to payment →</button>
      </div>
    </div>

    <footer>Photos are watermarked and shared privately. Please don't redistribute without permission.</footer>
    <script>
      // Deterrents only — honest about this:
      //  - context menu disabled, image drag disabled, user-select disabled
      // A determined visitor can still screenshot or inspect element.
      document.addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });

      const PHOTOS = ${photosJson};
      const PRODUCTS = ${productsJson};
      const SLUG = ${JSON.stringify(gallery.slug)};
      const DOWNLOAD = ${downloadEnabled ? 'true' : 'false'};
      const CURRENCY = ${JSON.stringify(currency || 'gbp')};

      const fmtMoney = (minor) => (minor / 100).toLocaleString('en-GB', { style: 'currency', currency: CURRENCY.toUpperCase() });

      const grid = document.getElementById('grid');
      document.querySelectorAll('.filters button').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filters button').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const f = btn.dataset.filter;
          grid.querySelectorAll('.tile').forEach((t) => {
            const show = f === 'all' || t.dataset.highlight === '1';
            t.classList.toggle('hidden', !show);
          });
        });
      });

      // Lightbox
      const lb = document.getElementById('lb');
      const lbImg = document.getElementById('lbImg');
      const lbActions = document.getElementById('lbActions');
      let lbIndex = 0;
      const visiblePhotos = () => PHOTOS.filter((p) => {
        const tile = grid.querySelector('.tile[data-id="' + p._id + '"]');
        return tile && !tile.classList.contains('hidden');
      });
      function openAt(id) {
        const list = visiblePhotos();
        lbIndex = Math.max(0, list.findIndex((p) => p._id === id));
        renderLb();
        lb.classList.add('open');
      }
      function renderLb() {
        const list = visiblePhotos();
        if (!list.length) return;
        const p = list[lbIndex];
        lbImg.src = p.url;
        lbActions.innerHTML = '';
        if (DOWNLOAD) {
          const a = document.createElement('a');
          a.href = '/g/' + SLUG + '/download/' + p._id;
          a.textContent = 'Download full size';
          lbActions.appendChild(a);
        }
        if (PRODUCTS.length) {
          const b = document.createElement('button');
          b.textContent = 'Order print of this photo';
          b.addEventListener('click', () => openStore(p._id));
          lbActions.appendChild(b);
        }
      }
      grid.addEventListener('click', (e) => {
        const tile = e.target.closest('.tile');
        if (tile) openAt(tile.dataset.id);
      });
      lb.querySelector('.close').addEventListener('click', () => lb.classList.remove('open'));
      lb.querySelector('.prev').addEventListener('click', () => {
        const list = visiblePhotos();
        lbIndex = (lbIndex - 1 + list.length) % list.length;
        renderLb();
      });
      lb.querySelector('.next').addEventListener('click', () => {
        const list = visiblePhotos();
        lbIndex = (lbIndex + 1) % list.length;
        renderLb();
      });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lb.classList.remove('open');
        if (e.key === 'ArrowLeft') lb.querySelector('.prev').click();
        if (e.key === 'ArrowRight') lb.querySelector('.next').click();
      });

      // ---- Store modal ----
      const storeEl = document.getElementById('store');
      const storeErr = document.getElementById('storeErr');
      const storeProducts = document.getElementById('storeProducts');
      const storePhotoPick = document.getElementById('storePhotoPick');
      const storeEmail = document.getElementById('storeEmail');
      const storeTotal = document.getElementById('storeTotal');
      const storeCheckout = document.getElementById('storeCheckout');
      const qtyMinus = document.getElementById('qtyMinus');
      const qtyPlus = document.getElementById('qtyPlus');
      const qtyVal = document.getElementById('qtyVal');
      const storeClose = document.getElementById('storeClose');
      let storeState = { photoId: null, sku: null, qty: 1 };

      function openStore(photoId) {
        if (!PRODUCTS.length) return;
        // Close lightbox if open so the store sits cleanly on top.
        lb.classList.remove('open');
        storeState = { photoId: photoId || null, sku: PRODUCTS[0]?.sku || null, qty: 1 };
        renderStore();
        storeEl.classList.add('open');
      }

      function renderStore() {
        storeErr.innerHTML = '';

        if (storeState.photoId) {
          const p = PHOTOS.find((x) => x._id === storeState.photoId);
          storePhotoPick.innerHTML = p
            ? '<div class="photo-pick"><img src="' + p.url + '" alt="" /><div><div style="font-weight:600;font-size:13px">Print of this photo</div><div style="color:#9a9aa3;font-size:12px">Photo #' + p._id.slice(-6) + '</div></div></div>'
            : '';
        } else {
          storePhotoPick.innerHTML = '<div class="photo-pick" style="color:#9a9aa3;font-size:13px">Open a photo from the gallery to attach it to your order.</div>';
        }

        storeProducts.innerHTML = PRODUCTS.map((p) =>
          '<div class="product ' + (storeState.sku === p.sku ? 'selected' : '') + '" data-sku="' + p.sku + '">' +
            '<div><div class="name">' + p.name + '</div>' +
              (p.description ? '<div class="desc">' + p.description + '</div>' : '') +
            '</div>' +
            '<div class="price">' + fmtMoney(p.priceMinor) + '</div>' +
          '</div>'
        ).join('');
        storeProducts.querySelectorAll('.product').forEach((el) => {
          el.addEventListener('click', () => {
            storeState.sku = el.dataset.sku;
            renderStore();
          });
        });

        qtyVal.textContent = storeState.qty;
        const product = PRODUCTS.find((p) => p.sku === storeState.sku);
        storeTotal.textContent = product ? fmtMoney(product.priceMinor * storeState.qty) : '—';

        const valid = Boolean(product && storeEmail.value && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(storeEmail.value));
        storeCheckout.disabled = !valid;
      }

      qtyMinus.addEventListener('click', () => { storeState.qty = Math.max(1, storeState.qty - 1); renderStore(); });
      qtyPlus.addEventListener('click', () => { storeState.qty = Math.min(50, storeState.qty + 1); renderStore(); });
      storeEmail.addEventListener('input', renderStore);
      storeClose.addEventListener('click', () => storeEl.classList.remove('open'));
      storeEl.addEventListener('click', (e) => { if (e.target === storeEl) storeEl.classList.remove('open'); });

      storeCheckout.addEventListener('click', async () => {
        storeErr.innerHTML = '';
        storeCheckout.disabled = true;
        storeCheckout.textContent = 'Creating order…';
        try {
          const res = await fetch('/g/' + SLUG + '/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: storeEmail.value,
              items: [{ sku: storeState.sku, quantity: storeState.qty, photoId: storeState.photoId || undefined }],
            }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            window.location.href = data.url;
            return;
          }
          storeErr.innerHTML = '<div class="err">' + (data.message || ('Checkout failed (' + res.status + ')')) + '</div>';
        } catch (err) {
          storeErr.innerHTML = '<div class="err">Checkout failed: ' + err.message + '</div>';
        } finally {
          storeCheckout.disabled = false;
          storeCheckout.textContent = 'Continue to payment →';
        }
      });

      const storeBtn = document.getElementById('openStoreBtn');
      if (storeBtn) storeBtn.addEventListener('click', () => openStore(null));
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
