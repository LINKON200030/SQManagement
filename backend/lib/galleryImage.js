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

// Predict the output dimensions of fit:'inside' + withoutEnlargement so we
// can size the watermark SVG exactly right. EXIF orientation 5-8 swaps the
// physical W/H, so account for that since the pipeline calls .rotate().
const predictWebDimensions = (meta) => {
  let srcW = meta.width || WEB_LONG_EDGE;
  let srcH = meta.height || WEB_LONG_EDGE;
  if (meta.orientation && meta.orientation >= 5 && meta.orientation <= 8) {
    [srcW, srcH] = [srcH, srcW];
  }
  const ratio = Math.min(WEB_LONG_EDGE / srcW, WEB_LONG_EDGE / srcH, 1);
  return {
    width: Math.max(1, Math.round(srcW * ratio)),
    height: Math.max(1, Math.round(srcH * ratio)),
  };
};

// Generate the web-sized JPEG. If watermarkEnabled, burn a subtle diagonal
// repeated watermark into the web variant only — never the full-res original.
//
// Single sharp pipeline (one decode) instead of resize → re-decode → composite
// → re-encode. metadata() is a cheap header read, not a decode.
const buildWebVariant = async (sourceBuffer, { watermarkEnabled, watermarkText = WATERMARK_TEXT } = {}) => {
  let pipeline = sharp(sourceBuffer, { failOn: 'none' })
    .rotate() // honor EXIF orientation
    .resize({
      width: WEB_LONG_EDGE,
      height: WEB_LONG_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (watermarkEnabled) {
    const meta = await sharp(sourceBuffer, { failOn: 'none' }).metadata();
    const { width, height } = predictWebDimensions(meta);
    const wm = buildWatermarkSvg(width, height, watermarkText);
    pipeline = pipeline.composite([{ input: wm, gravity: 'center' }]);
  }

  return pipeline.jpeg({ quality: WEB_QUALITY, mozjpeg: true }).toBuffer();
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
