// Mirrors surreyquaysphotostudio.com/printings as of 2026-06-26.
// Prices are the cheapest tier shown on the studio website (1-10 prints / 1 item),
// which is the realistic case for an individual gallery customer. Admin can
// edit any of these once seeded.
//
// One PrintProduct per row. SKU is stable so re-running the seed is a no-op.

const photoPrints = [
  { sku: 'print-4x4', name: '4×4" Photo Print', priceMinor: 149, sortOrder: 10 },
  { sku: 'print-4x6', name: '4×6" Photo Print', priceMinor: 149, sortOrder: 11 },
  { sku: 'print-5x5', name: '5×5" Photo Print', priceMinor: 199, sortOrder: 12 },
  { sku: 'print-5x7', name: '5×7" Photo Print', priceMinor: 199, sortOrder: 13 },
  { sku: 'print-6x6', name: '6×6" Photo Print', priceMinor: 249, sortOrder: 14 },
  { sku: 'print-6x8', name: '6×8" Photo Print', priceMinor: 249, sortOrder: 15 },
  { sku: 'print-8x8', name: '8×8" Photo Print', priceMinor: 699, sortOrder: 16 },
  { sku: 'print-8x10', name: '8×10" Photo Print', priceMinor: 799, sortOrder: 17 },
  { sku: 'print-8x12', name: '8×12" Photo Print', priceMinor: 899, sortOrder: 18 },
].map((p) => ({
  ...p,
  description: 'Gloss / matte / lustre — same-day collection available',
  kind: 'print',
}));

const largePrints = [
  { sku: 'poster-10x12', name: '10×12" Poster Print', priceMinor: 1299, sortOrder: 20 },
  { sku: 'poster-12x16', name: '12×16" Poster Print', priceMinor: 1499, sortOrder: 21 },
  { sku: 'poster-16x20', name: '16×20" Poster Print', priceMinor: 1799, sortOrder: 22 },
  { sku: 'poster-20x24', name: '20×24" Poster Print', priceMinor: 1899, sortOrder: 23 },
  { sku: 'poster-20x30', name: '20×30" Poster Print', priceMinor: 1999, sortOrder: 24 },
  { sku: 'poster-24x36', name: '24×36" Poster Print', priceMinor: 2499, sortOrder: 25 },
  { sku: 'poster-a4', name: 'A4 Poster Print', priceMinor: 999, sortOrder: 26 },
  { sku: 'poster-a3', name: 'A3 Poster Print', priceMinor: 1599, sortOrder: 27 },
  { sku: 'poster-a2', name: 'A2 Poster Print', priceMinor: 1999, sortOrder: 28 },
  { sku: 'poster-a1', name: 'A1 Poster Print', priceMinor: 2499, sortOrder: 29 },
  { sku: 'poster-50x70cm', name: '50×70 cm Poster Print', priceMinor: 1799, sortOrder: 30 },
  { sku: 'poster-60x90cm', name: '60×90 cm Poster Print', priceMinor: 2199, sortOrder: 31 },
].map((p) => ({ ...p, description: 'Large format poster print', kind: 'print' }));

const canvases = [
  { sku: 'canvas-8x10', name: '8×10" Canvas Print', priceMinor: 2999, sortOrder: 40 },
  { sku: 'canvas-8x12', name: '8×12" Canvas Print', priceMinor: 3499, sortOrder: 41 },
  { sku: 'canvas-10x10', name: '10×10" Canvas Print', priceMinor: 3499, sortOrder: 42 },
  { sku: 'canvas-10x12', name: '10×12" Canvas Print', priceMinor: 3999, sortOrder: 43 },
  { sku: 'canvas-12x12', name: '12×12" Canvas Print', priceMinor: 4499, sortOrder: 44 },
  { sku: 'canvas-12x16', name: '12×16" Canvas Print', priceMinor: 4999, sortOrder: 45 },
  { sku: 'canvas-16x16', name: '16×16" Canvas Print', priceMinor: 5999, sortOrder: 46 },
  { sku: 'canvas-16x20', name: '16×20" Canvas Print', priceMinor: 6999, sortOrder: 47 },
  { sku: 'canvas-16x24', name: '16×24" Canvas Print', priceMinor: 7999, sortOrder: 48 },
  { sku: 'canvas-20x20', name: '20×20" Canvas Print', priceMinor: 8499, sortOrder: 49 },
  { sku: 'canvas-20x24', name: '20×24" Canvas Print', priceMinor: 8999, sortOrder: 50 },
  { sku: 'canvas-20x30', name: '20×30" Canvas Print', priceMinor: 9999, sortOrder: 51 },
].map((p) => ({ ...p, description: 'Gallery-wrapped canvas print', kind: 'print' }));

const gifts = [
  { sku: 'gift-mug', name: 'Personalised Mug', priceMinor: 1499, sortOrder: 60 },
  { sku: 'gift-tshirt', name: 'Personalised T-Shirt (incl. garment)', priceMinor: 1499, sortOrder: 61 },
  { sku: 'gift-pillow', name: 'Personalised Pillow', priceMinor: 1999, sortOrder: 62 },
].map((p) => ({ ...p, description: 'Photo printed in-store', kind: 'physical' }));

const DEFAULT_CATALOGUE = [...photoPrints, ...largePrints, ...canvases, ...gifts].map((p) => ({
  ...p,
  currency: 'gbp',
  active: true,
}));

module.exports = { DEFAULT_CATALOGUE };
