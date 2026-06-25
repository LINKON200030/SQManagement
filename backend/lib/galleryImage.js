const sharp = require('sharp');

const WEB_LONG_EDGE = 1600;
const WEB_QUALITY = 82;
const WATERMARK_TEXT = process.env.GALLERY_WATERMARK_TEXT || 'Surrey Quays Photo Studio';

// Build a tiled diagonal SVG watermark sized to the photo. Repeated text at low
// opacity, rotated ~-30deg. Kept deliberately subtle — meant to discourage
// casual reuse, not to defeat a determined editor.
const buildWatermarkSvg = (width, height, text) => {
  const tileWidth = Math.max(260, Math.round(width / 4));
  const tileHeight = Math.max(140, Math.round(height / 6));
  const fontSize = Math.max(16, Math.round(width / 55));
  const safeText = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse" width="${tileWidth}" height="${tileHeight}" patternTransform="rotate(-30)">
          <text x="0" y="${Math.round(tileHeight / 2)}"
                font-family="Helvetica, Arial, sans-serif"
                font-size="${fontSize}"
                font-weight="600"
                fill="rgba(255,255,255,0.28)"
                stroke="rgba(0,0,0,0.18)"
                stroke-width="0.6">${safeText}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>`
  );
};

// Generate the web-sized JPEG. If watermarkEnabled, burn a subtle diagonal
// repeated watermark into the web variant only — never the full-res original.
const buildWebVariant = async (sourceBuffer, { watermarkEnabled, watermarkText = WATERMARK_TEXT } = {}) => {
  const base = sharp(sourceBuffer, { failOn: 'none' })
    .rotate() // honor EXIF orientation
    .resize({
      width: WEB_LONG_EDGE,
      height: WEB_LONG_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (!watermarkEnabled) {
    return base.jpeg({ quality: WEB_QUALITY, mozjpeg: true }).toBuffer();
  }

  // Resize first, get dimensions, then composite the watermark sized to the result.
  const resized = await base.jpeg({ quality: 95 }).toBuffer();
  const meta = await sharp(resized).metadata();
  const wm = buildWatermarkSvg(meta.width, meta.height, watermarkText);

  return sharp(resized)
    .composite([{ input: wm, gravity: 'center' }])
    .jpeg({ quality: WEB_QUALITY, mozjpeg: true })
    .toBuffer();
};

// Normalize originals to JPEG so the "full" download is a single predictable
// format. Strips no metadata (keeps EXIF) — clients may want it.
const normalizeFullVariant = async (sourceBuffer) => {
  const meta = await sharp(sourceBuffer, { failOn: 'none' }).metadata();
  if (meta.format === 'jpeg' || meta.format === 'jpg') return sourceBuffer;
  return sharp(sourceBuffer, { failOn: 'none' })
    .rotate()
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();
};

module.exports = {
  buildWebVariant,
  normalizeFullVariant,
  WEB_LONG_EDGE,
  WEB_QUALITY,
};
