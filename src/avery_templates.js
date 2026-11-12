/**
 * Avery Inkjet Label Templates & Physical Sheet Specifications
 * Comprehensive catalog covering standard retail price tags, shelf labels,
 * bottle tags, and stickers for inkjet printers with exact physical dimensions.
 */

export const AVERY_TEMPLATES = {
  '5160': {
    id: '5160',
    code: '5160',
    family: 'Address & Retail Price Tags',
    alias: '8160 / 5260 / 94200',
    description: 'Standard Retail Price Tag (30 per sheet, 3 × 10)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 2.625,   // 2-5/8"
    labelHeightIn: 1.0,    // 1"
    columns: 3,
    rows: 10,
    labelsPerSheet: 30,
    topMarginIn: 0.5,
    leftMarginIn: 0.1875,  // 3/16"
    horizontalPitchIn: 2.75, // 2-3/4"
    verticalPitchIn: 1.0,
    colGapIn: 0.125,       // 1/8"
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.0625in',
    fontScale: {
      namePt: 8.5,
      volumePt: 7,
      pricePt: 12,
      logoWidthIn: 0.65,
      paddingIn: '0.03in 0.05in'
    }
  },
  '5161': {
    id: '5161',
    code: '5161',
    family: 'Wide Address & Shelf Tags',
    alias: '8161 / 5261',
    description: 'Wide Shelf Edge & Barcode Tag (20 per sheet, 2 × 10)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 4.0,     // 4"
    labelHeightIn: 1.0,    // 1"
    columns: 2,
    rows: 10,
    labelsPerSheet: 20,
    topMarginIn: 0.5,
    leftMarginIn: 0.15625, // 5/32"
    horizontalPitchIn: 4.25,
    verticalPitchIn: 1.0,
    colGapIn: 0.25,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.0625in',
    fontScale: {
      namePt: 9.5,
      volumePt: 8,
      pricePt: 14.5,
      logoWidthIn: 0.85,
      paddingIn: '0.04in 0.07in'
    }
  },
  '5162': {
    id: '5162',
    code: '5162',
    family: 'Medium Shelf & Shipping Labels',
    alias: '8162 / 5262',
    description: 'Medium Shelf Tag & Bottle Label (14 per sheet, 2 × 7)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 4.0,     // 4"
    labelHeightIn: 1.333,  // 1-1/3"
    columns: 2,
    rows: 7,
    labelsPerSheet: 14,
    topMarginIn: 0.833,    // 5/6"
    leftMarginIn: 0.156,   // 5/32"
    horizontalPitchIn: 4.1875,
    verticalPitchIn: 1.333,
    colGapIn: 0.1875,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.08in',
    fontScale: {
      namePt: 10.5,
      volumePt: 9.5,
      pricePt: 18,
      logoWidthIn: 1.1,
      paddingIn: '0.06in 0.1in'
    }
  },
  '5163': {
    id: '5163',
    code: '5163',
    family: 'Large Product & Shipping Labels',
    alias: '8163 / 5263',
    description: 'Large Shelf Tag & Case Label (10 per sheet, 2 × 5)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 4.0,     // 4"
    labelHeightIn: 2.0,    // 2"
    columns: 2,
    rows: 5,
    labelsPerSheet: 10,
    topMarginIn: 0.5,
    leftMarginIn: 0.156,   // 5/32"
    horizontalPitchIn: 4.1875,
    verticalPitchIn: 2.0,
    colGapIn: 0.1875,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.08in',
    fontScale: {
      namePt: 13,
      volumePt: 11,
      pricePt: 24,
      logoWidthIn: 1.35,
      paddingIn: '0.08in 0.12in'
    }
  },
  '5164': {
    id: '5164',
    code: '5164',
    family: 'Extra Large Bin & Box Placards',
    alias: '8164 / 5264',
    description: 'Extra-Large Bin Placard & Case Tag (6 per sheet, 2 × 3)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 4.0,     // 4"
    labelHeightIn: 3.333,  // 3-1/3"
    columns: 2,
    rows: 3,
    labelsPerSheet: 6,
    topMarginIn: 0.5,
    leftMarginIn: 0.156,
    horizontalPitchIn: 4.1875,
    verticalPitchIn: 3.333,
    colGapIn: 0.1875,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.1in',
    fontScale: {
      namePt: 16,
      volumePt: 13,
      pricePt: 32,
      logoWidthIn: 1.6,
      paddingIn: '0.12in 0.16in'
    }
  },
  '5167': {
    id: '5167',
    code: '5167',
    family: 'Slim Return Address & Bottle Tags',
    alias: '8167 / 5267 / 94203',
    description: 'Slim Return Address & Bottle Neck Tag (80 per sheet, 4 × 20)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 1.75,    // 1-3/4"
    labelHeightIn: 0.5,    // 1/2"
    columns: 4,
    rows: 20,
    labelsPerSheet: 80,
    topMarginIn: 0.5,
    leftMarginIn: 0.281,   // ~9/32"
    horizontalPitchIn: 2.062,
    verticalPitchIn: 0.5,
    colGapIn: 0.312,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0.04in',
    fontScale: {
      namePt: 5.8,
      volumePt: 5.0,
      pricePt: 8.2,
      logoWidthIn: 0.36,
      paddingIn: '0.015in 0.025in'
    }
  },
  '22806': {
    id: '22806',
    code: '22806',
    family: 'Square Print-to-the-Edge Stickers',
    alias: 'Presta 22806',
    description: 'Square 2″ × 2″ Craft & Shelf Sticker (12 per sheet, 3 × 4)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 2.0,     // 2"
    labelHeightIn: 2.0,    // 2"
    columns: 3,
    rows: 4,
    labelsPerSheet: 12,
    topMarginIn: 0.75,     // 3/4"
    leftMarginIn: 0.625,   // 5/8"
    horizontalPitchIn: 2.625,
    verticalPitchIn: 2.50,
    colGapIn: 0.625,
    rowGapIn: 0.50,
    shape: 'square',
    cornerRadius: '0.1in',
    fontScale: {
      namePt: 10,
      volumePt: 8.5,
      pricePt: 18,
      logoWidthIn: 0.85,
      paddingIn: '0.06in 0.08in'
    }
  },
  '22807': {
    id: '22807',
    code: '22807',
    family: 'Round Print-to-the-Edge Stickers',
    alias: 'Presta 22807',
    description: 'Round 2″ Diameter Bottle Cap & Jar Sticker (12 per sheet, 3 × 4)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 2.0,     // 2"
    labelHeightIn: 2.0,    // 2"
    columns: 3,
    rows: 4,
    labelsPerSheet: 12,
    topMarginIn: 0.75,     // 3/4"
    leftMarginIn: 0.625,   // 5/8"
    horizontalPitchIn: 2.625,
    verticalPitchIn: 2.50,
    colGapIn: 0.625,
    rowGapIn: 0.50,
    shape: 'round',
    cornerRadius: '50%',
    fontScale: {
      namePt: 9.5,
      volumePt: 8,
      pricePt: 16,
      logoWidthIn: 0.8,
      paddingIn: '0.08in 0.08in'
    }
  },
  '5165': {
    id: '5165',
    code: '5165',
    family: 'Full Sheet Signage',
    alias: '8165 / 5265',
    description: 'Full Page Retail Sign & Manifest (1 per sheet, 1 × 1)',
    paperSize: 'letter',
    sheetWidthIn: 8.5,
    sheetHeightIn: 11.0,
    labelWidthIn: 8.5,
    labelHeightIn: 11.0,
    columns: 1,
    rows: 1,
    labelsPerSheet: 1,
    topMarginIn: 0.0,
    leftMarginIn: 0.0,
    horizontalPitchIn: 8.5,
    verticalPitchIn: 11.0,
    colGapIn: 0.0,
    rowGapIn: 0.0,
    shape: 'rectangle',
    cornerRadius: '0',
    fontScale: {
      namePt: 26,
      volumePt: 20,
      pricePt: 52,
      logoWidthIn: 2.8,
      paddingIn: '0.5in 0.5in'
    }
  }
};

/**
 * Default High-Resolution Store Brand Logo (777 Liquor & Fine Wine)
 * Styled vector SVG brand mark with distinctive retail iconography.
 */
export const DEFAULT_STORE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" rx="24" fill="%230f172a"/><circle cx="100" cy="100" r="88" fill="none" stroke="%23f59e0b" stroke-width="6"/><path d="M60 48 L140 48 L108 92 L108 140 L92 140 L92 92 Z" fill="%23f8fafc" stroke="%23f59e0b" stroke-width="4"/><circle cx="100" cy="74" r="14" fill="%23ef4444"/><text x="100" y="172" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="%23f59e0b" text-anchor="middle" letter-spacing="3">777 LIQUOR</text></svg>`;

/**
 * Specialized color schemes and iconography for top beverage & retail brands.
 */
const BRAND_PRESET_PALETTES = {
  'bud light': { bg: '#002855', accent: '#00a3e0', text: '#ffffff', motif: 'beer', badge: 'BL' },
  'budweiser': { bg: '#b91c1c', accent: '#fbbf24', text: '#ffffff', motif: 'crown', badge: 'BUD' },
  'coors light': { bg: '#334155', accent: '#dc2626', text: '#ffffff', motif: 'mountain', badge: 'COORS' },
  'miller lite': { bg: '#1e293b', accent: '#fbbf24', text: '#ffffff', motif: 'crest', badge: 'LITE' },
  'corona': { bg: '#002855', accent: '#f59e0b', text: '#ffffff', motif: 'crown', badge: 'CORONA' },
  'corona extra': { bg: '#002855', accent: '#f59e0b', text: '#ffffff', motif: 'crown', badge: 'CORONA' },
  'modelo': { bg: '#0f172a', accent: '#fbbf24', text: '#ffffff', motif: 'crest', badge: 'MODELO' },
  'modelo especial': { bg: '#0f172a', accent: '#fbbf24', text: '#ffffff', motif: 'crest', badge: 'MODELO' },
  'heineken': { bg: '#007a33', accent: '#dc2626', text: '#ffffff', motif: 'star', badge: 'HEINEKEN' },
  'guinness': { bg: '#000000', accent: '#d4af37', text: '#ffffff', motif: 'harp', badge: 'GUINNESS' },
  'stella artois': { bg: '#991b1b', accent: '#eab308', text: '#ffffff', motif: 'star', badge: 'STELLA' },
  'white claw': { bg: '#1e293b', accent: '#06b6d4', text: '#ffffff', motif: 'wave', badge: 'CLAW' },
  'high noon': { bg: '#0284c7', accent: '#f59e0b', text: '#ffffff', motif: 'sun', badge: 'NOON' },
  'twisted tea': { bg: '#854d0e', accent: '#facc15', text: '#ffffff', motif: 'leaf', badge: 'TEA' },
  'blue moon': { bg: '#1e3a8a', accent: '#f97316', text: '#ffffff', motif: 'moon', badge: 'MOON' },
  "tito's": { bg: '#451a03', accent: '#d97706', text: '#ffffff', motif: 'still', badge: "TITO'S" },
  'titos': { bg: '#451a03', accent: '#d97706', text: '#ffffff', motif: 'still', badge: "TITO'S" },
  'grey goose': { bg: '#1e3a8a', accent: '#93c5fd', text: '#ffffff', motif: 'goose', badge: 'GOOSE' },
  'casamigos': { bg: '#78350f', accent: '#fbbf24', text: '#ffffff', motif: 'agave', badge: 'CASA' },
  'patrón': { bg: '#064e3b', accent: '#fbbf24', text: '#ffffff', motif: 'bee', badge: 'PATRÓN' },
  'patron': { bg: '#064e3b', accent: '#fbbf24', text: '#ffffff', motif: 'bee', badge: 'PATRÓN' },
  'don julio': { bg: '#14532d', accent: '#eab308', text: '#ffffff', motif: 'agave', badge: 'JULIO' },
  "jack daniel's": { bg: '#09090b', accent: '#e4e4e7', text: '#ffffff', motif: 'filigree', badge: 'JACK' },
  'jameson': { bg: '#064e3b', accent: '#fef08a', text: '#ffffff', motif: 'crest', badge: 'JAMESON' },
  'crown royal': { bg: '#581c87', accent: '#fbbf24', text: '#ffffff', motif: 'crown', badge: 'CROWN' },
  'hennessy': { bg: '#451a03', accent: '#fbbf24', text: '#ffffff', motif: 'crest', badge: 'HENNESSY' },
  'captain morgan': { bg: '#7f1d1d', accent: '#fbbf24', text: '#ffffff', motif: 'anchor', badge: 'CAPTAIN' },
  'fireball': { bg: '#c2410c', accent: '#facc15', text: '#ffffff', motif: 'flame', badge: 'FIREBALL' },
  'smirnoff': { bg: '#991b1b', accent: '#ffffff', text: '#ffffff', motif: 'crest', badge: 'SMIRNOFF' },
  'bacardi': { bg: '#7f1d1d', accent: '#facc15', text: '#ffffff', motif: 'bat', badge: 'BACARDI' },
  'absolut': { bg: '#0284c7', accent: '#ffffff', text: '#ffffff', motif: 'bottle', badge: 'ABSOLUT' },
  'red bull': { bg: '#1e3a8a', accent: '#ef4444', text: '#fbbf24', motif: 'sun', badge: 'RED BULL' },
  'monster energy': { bg: '#09090b', accent: '#22c55e', text: '#ffffff', motif: 'claw', badge: 'MONSTER' },
  'coca-cola': { bg: '#dc2626', accent: '#ffffff', text: '#ffffff', motif: 'wave', badge: 'COKE' }
};

/**
 * Deterministically derives a rich two-tone palette for any craft or unlisted brand.
 */
function deriveBrandColors(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const hues = [
    { bg: '#0f172a', accent: '#38bdf8' }, // deep slate / sky
    { bg: '#1e1b4b', accent: '#818cf8' }, // indigo / violet
    { bg: '#064e3b', accent: '#34d399' }, // emerald / mint
    { bg: '#701a75', accent: '#f472b6' }, // fuchsia / pink
    { bg: '#451a03', accent: '#fbbf24' }, // warm amber / gold
    { bg: '#14532d', accent: '#a3e635' }, // forest / lime
    { bg: '#1c1917', accent: '#fb923c' }, // charcoal / orange
    { bg: '#1e3a8a', accent: '#60a5fa' }, // royal blue / cyan
    { bg: '#7f1d1d', accent: '#f87171' }  // crimson / coral
  ];
  const idx = Math.abs(hash) % hues.length;
  return hues[idx];
}

/**
 * Generates an authentic, crisp vector SVG logo data URI for an individual brand.
 *
 * @param {string} brandName - Name of the brand (e.g. "Bud Light", "Tito's", "Casamigos")
 * @param {string} category - Optional item category (e.g. "Beer", "Liquor", "Wine")
 * @returns {string} SVG Data URI ready for <img> src or printing
 */
export function generateBrandedVectorLogo(brandName = 'Retail Item', category = '') {
  const cleanBrand = String(brandName || 'Retail Item').trim();
  const lower = cleanBrand.toLowerCase();
  const preset = BRAND_PRESET_PALETTES[lower] || deriveBrandColors(cleanBrand);

  const bg = preset.bg || '#0f172a';
  const accent = preset.accent || '#38bdf8';
  const textCol = preset.text || '#ffffff';

  // Format initials or badge text
  let badgeText = preset.badge;
  if (!badgeText) {
    const words = cleanBrand.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      badgeText = cleanBrand.slice(0, Math.min(8, cleanBrand.length)).toUpperCase();
    } else {
      badgeText = words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    }
  }

  // Sanitize for XML attributes
  const escName = cleanBrand.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escBadge = badgeText.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  // SVG dimensions: 200x200
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g_${Math.abs(cleanBrand.length)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="28" fill="url(#g_${Math.abs(cleanBrand.length)})" />
  <circle cx="100" cy="100" r="86" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="6 3" />
  <circle cx="100" cy="100" r="76" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.6" />
  <path d="M100 28 L108 44 L126 44 L112 56 L118 72 L100 62 L82 72 L88 56 L74 44 L92 44 Z" fill="${accent}" />
  <text x="100" y="112" font-family="system-ui, -apple-system, sans-serif" font-size="${badgeText.length > 5 ? 24 : 32}" font-weight="900" fill="${textCol}" text-anchor="middle" letter-spacing="1.5">${escBadge}</text>
  <line x1="45" y1="126" x2="155" y2="126" stroke="${accent}" stroke-width="2" />
  <text x="100" y="152" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="1">${escName.length > 16 ? escName.slice(0, 15) + '…' : escName}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Extracts and capitalizes item volume/packaging using exact capitalization rules:
 * Examples: '11oz', '1 L', '750ml', '1.75L', '12-Pack', '16oz', '375ml'
 */
export function extractNameAndVolume(rawName = '') {
  if (!rawName || typeof rawName !== 'string') {
    return { cleanName: '', volume: '' };
  }

  let text = rawName.trim();

  // Pattern matching volume units: oz, ml, l, liter, cl, qt, gal, pk, pack
  // Captures: 11 oz, 11oz, 1 L, 1L, 750ml, 1.75 L, 12pk, 6-pack, etc.
  const volRegex = /\b(\d+(?:\.\d+)?)\s*(oz|fl\s*oz|ml|l|liter|liters|cl|gal|gallon|pk|pack)\b/i;
  const match = text.match(volRegex);

  let volume = '';
  if (match) {
    const num = match[1];
    const unitRaw = match[2].toLowerCase().replace(/\s+/g, '');

    if (unitRaw === 'oz' || unitRaw === 'floz') {
      volume = `${num}oz`; // e.g. 11oz, 12oz, 16oz
    } else if (unitRaw === 'l' || unitRaw === 'liter' || unitRaw === 'liters') {
      volume = `${num} L`; // e.g. 1 L, 1.75 L
    } else if (unitRaw === 'ml') {
      volume = `${num}ml`; // e.g. 750ml, 375ml, 50ml
    } else if (unitRaw === 'cl') {
      volume = `${num}cl`; // e.g. 70cl
    } else if (unitRaw === 'pk' || unitRaw === 'pack') {
      volume = `${num}-Pack`; // e.g. 12-Pack, 6-Pack
    } else if (unitRaw === 'gal' || unitRaw === 'gallon') {
      volume = `${num} Gal`;
    } else {
      volume = `${num} ${unitRaw.toUpperCase()}`;
    }
  }

  // Remove the matched volume substring from title if it's cleanly isolated
  let cleanName = text;
  if (match) {
    cleanName = text.replace(match[0], '').replace(/\s{2,}/g, ' ').trim();
    // Clean up trailing punctuation or dashes left over
    cleanName = cleanName.replace(/[-–—,]+$/, '').trim();
  }

  // Capitalization normalization for title:
  // Title Case with special POS handling
  cleanName = cleanName
    .split(' ')
    .map((w) => {
      if (!w) return '';
      // Retain abbreviations like IPA, RTD, USA, ABV
      if (/^(IPA|RTD|ABV|USA|POS|BBQ|UV)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

  return { cleanName: cleanName || text, volume };
}

/**
 * Standardizes retail price format
 */
export function formatLabelPrice(rawPrice) {
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
    return '$0.00';
  }
  const cleanStr = String(rawPrice).replace(/[$,]/g, '').trim();
  const num = parseFloat(cleanStr);
  if (isNaN(num) || num < 0) return '$0.00';
  return `$${num.toFixed(2)}`;
}

/**
 * Known multi-word and single-word brand dictionary for retail catalog categorization.
 */
const KNOWN_BRANDS = [
  "Jack Daniel's", "Jim Beam", "Maker's Mark", "Johnnie Walker", "Grey Goose",
  "Ketel One", "Don Julio", "Casamigos", "Stella Artois", "Michelob Ultra",
  "Blue Moon", "White Claw", "High Noon", "Twisted Tea", "Bud Light", "Budweiser",
  "Coors Light", "Miller Lite", "Modelo Especial", "Corona Extra", "Crown Royal",
  "Captain Morgan", "Fireball", "Tanqueray", "Bombay Sapphire", "Patrón", "Patron",
  "Jose Cuervo", "Kendall Jackson", "Kim Crawford", "Josh Cellars", "Meiomi",
  "Red Bull", "Monster Energy", "Coca-Cola", "Mountain Dew", "Dr Pepper",
  "Sour Patch", "American Spirit", "Geek Bar", "Elf Bar", "Kanva Botanicals",
  "Lost Mary", "Guinness", "Tito's", "Titos", "Jameson", "Hennessy", "Smirnoff",
  "Bacardi", "Absolut", "Heineken", "Woodbridge", "Sutter Home", "Barefoot",
  "Yellow Tail", "La Crema", "Corona", "Modelo", "Coors", "Miller", "Lagunitas",
  "Sierra Nevada", "Sam Adams", "Samuel Adams", "19 Crimes", "Bread & Butter"
];

/**
 * Extracts and standardizes an item's brand name.
 * Uses item.brand if present, matches against known liquor & beverage brands,
 * or derives the brand prefix from product title.
 *
 * @param {Object|string} itemOrName
 * @returns {string} Standardized brand name (e.g. 'Bud Light', 'Tito\'s', 'Casamigos')
 */
export function extractItemBrand(itemOrName) {
  if (!itemOrName) return 'Other';
  const item = typeof itemOrName === 'string' ? { name: itemOrName } : itemOrName;

  // 1. If explicit brand is supplied, clean and return
  if (item.brand && typeof item.brand === 'string' && item.brand.trim()) {
    const b = item.brand.trim();
    if (b.toLowerCase() === 'titos') return "Tito's";
    if (b.toLowerCase() === 'patron') return 'Patrón';
    return b.charAt(0).toUpperCase() + b.slice(1);
  }

  const rawTitle = String(item.current_name || item.name || item.original_name || '').trim();
  if (!rawTitle) return 'Other';

  const upperTitle = rawTitle.toUpperCase();

  // 2. Match against known brand dictionary (longest match first)
  for (const kb of KNOWN_BRANDS) {
    const kbUpper = kb.toUpperCase();
    const regex = new RegExp(`(^|[\\s,;(-])${kbUpper.replace(/['’]/g, "['’]?")}([\\s,;)-]|$)`, 'i');
    if (regex.test(upperTitle)) {
      if (kb.toLowerCase() === 'titos') return "Tito's";
      if (kb.toLowerCase() === 'patron') return 'Patrón';
      return kb;
    }
  }

  // 3. Fallback: Take the first 1 or 2 significant title tokens before generic descriptors
  const { cleanName } = extractNameAndVolume(rawTitle);
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (!words.length) return 'Other';

  // Exclude leading stopwords or generic descriptors
  const GENERIC_TYPES = new Set(['VODKA', 'WHISKEY', 'BOURBON', 'TEQUILA', 'RUM', 'GIN', 'BEER', 'WINE', 'CAN', 'CANS', 'BOTTLE', 'BOTTLES']);
  const firstWord = words[0];
  if (GENERIC_TYPES.has(firstWord.toUpperCase()) && words.length > 1) {
    return words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase();
  }

  if (words.length >= 2 && !GENERIC_TYPES.has(words[1].toUpperCase())) {
    // 2-word brand (e.g. "House Wine", "Lost Coast")
    return `${words[0]} ${words[1]}`
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

/**
 * Groups inventory items by their extracted brand name.
 * Returns sorted brand summary with counts and item arrays.
 *
 * @param {Array} items
 * @returns {Array<{ brand: string, count: number, items: Array }>}
 */
export function groupItemsByBrand(items = []) {
  const brandMap = new Map();

  for (const item of items) {
    const brand = extractItemBrand(item);
    if (!brandMap.has(brand)) {
      brandMap.set(brand, []);
    }
    brandMap.get(brand).push(item);
  }

  return Array.from(brandMap.entries())
    .map(([brand, brandItems]) => ({
      brand,
      count: brandItems.length,
      items: brandItems
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand));
}

/**
 * Creates a normalized queue item for Avery print sheets.
 * Strictly respects capitalization rules for volume notation (e.g. 11oz, 1 L, 750ml).
 */
export function createAveryQueueItem(rawItem = {}, overrides = {}) {
  const rawName = overrides.name || rawItem.current_name || rawItem.name || rawItem.original_name || 'Retail Item';
  const { cleanName, volume } = extractNameAndVolume(rawName);

  const finalVolume = overrides.volume !== undefined
    ? (overrides.volume ? extractNameAndVolume(`Item ${overrides.volume}`).volume || overrides.volume : '')
    : (volume || rawItem.unit || '');

  const brand = overrides.brand || rawItem.brand || extractItemBrand(rawItem);
  const rawPrice = overrides.price !== undefined ? overrides.price : rawItem.price;
  const logoUrl = overrides.logoUrl || rawItem.logoUrl || (brand ? generateBrandedVectorLogo(brand, overrides.category || rawItem.category) : DEFAULT_STORE_LOGO_SVG);

  return {
    id: overrides.id || rawItem.id || `lbl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    sourceId: rawItem.id || null,
    name: rawName,
    displayName: overrides.displayName || cleanName || rawName,
    volume: finalVolume,
    price: formatLabelPrice(rawPrice),
    barcode: overrides.barcode !== undefined
      ? overrides.barcode
      : (rawItem.barcode?.digits || rawItem.barcode?.original || rawItem.barcode || ''),
    brand,
    category: overrides.category || rawItem.category || '',
    copies: Math.max(1, Math.min(100, Number(overrides.copies || rawItem.copies || 1))),
    logoUrl
  };
}

/**
 * Calculates print sheet pages and slot layout.
 * Supports startSlot offset (1-indexed) to reuse partially printed sheets.
 * Works seamlessly with both raw catalog items and user-edited queue items.
 *
 * @param {string} templateId - Avery code (e.g. '5160')
 * @param {Array} items - List of inventory or queue items
 * @param {Object} options - { startSlot: 1, copiesPerItem: 1, brandLogos: Map|Object }
 * @returns {Object} { template, sheets: [ { sheetIndex, slots: [ { slotNumber, isOffsetEmpty, item } ] } ], totalLabelsToPrint, totalSheets, startSlot }
 */
export function calculateAverySheetSlots(templateId = '5160', items = [], options = {}) {
  const template = AVERY_TEMPLATES[templateId] || AVERY_TEMPLATES['5160'];
  const labelsPerSheet = template.labelsPerSheet;

  const startSlot = Math.max(1, Math.min(labelsPerSheet, Number(options.startSlot) || 1));
  const globalCopies = Math.max(1, Math.min(100, Number(options.copiesPerItem) || 1));
  const brandLogos = options.brandLogos || null;

  function resolveItemLogo(brandName, category, explicitLogo) {
    if (explicitLogo && explicitLogo !== DEFAULT_STORE_LOGO_SVG) return explicitLogo;
    if (brandLogos) {
      const lower = String(brandName || '').toLowerCase().trim();
      if (brandLogos instanceof Map) {
        if (brandLogos.has(lower)) return brandLogos.get(lower);
        if (brandLogos.has(brandName)) return brandLogos.get(brandName);
      } else if (typeof brandLogos === 'object') {
        if (brandLogos[lower]) return brandLogos[lower];
        if (brandLogos[brandName]) return brandLogos[brandName];
      }
    }
    return generateBrandedVectorLogo(brandName, category);
  }

  // Expand items by copies (either item-level copies or global copies)
  const expandedItems = [];
  for (const item of items) {
    const itemCopies = item.copies ? Math.max(1, Number(item.copies)) : globalCopies;
    for (let c = 0; c < itemCopies; c++) {
      expandedItems.push(item);
    }
  }

  const sheets = [];
  let itemIdx = 0;
  let sheetIdx = 0;

  while (itemIdx < expandedItems.length || sheets.length === 0) {
    const slots = [];
    const isFirstSheet = sheetIdx === 0;

    for (let slot = 1; slot <= labelsPerSheet; slot++) {
      // If first sheet and slot is before user's startSlot, mark as empty offset
      if (isFirstSheet && slot < startSlot) {
        slots.push({
          slotNumber: slot,
          isOffsetEmpty: true,
          item: null
        });
      } else if (itemIdx < expandedItems.length) {
        const it = expandedItems[itemIdx++];

        // If it's already an edited queue item, use its prepared attributes
        const { cleanName, volume } = extractNameAndVolume(it.current_name || it.name || it.original_name || '');
        const displayName = it.displayName || cleanName || it.name || 'Retail Item';
        const finalVolume = it.volume !== undefined && it.volume !== '' ? it.volume : volume;
        const finalPrice = it.price ? (String(it.price).startsWith('$') ? String(it.price) : formatLabelPrice(it.price)) : '$0.00';
        const barcodeVal = it.barcode?.digits || it.barcode?.original || it.barcode || '';
        const brandVal = it.brand || extractItemBrand(it);
        const logoUrl = resolveItemLogo(brandVal, it.category, it.logoUrl);

        slots.push({
          slotNumber: slot,
          isOffsetEmpty: false,
          item: {
            id: it.id,
            sourceId: it.sourceId || it.id,
            name: it.name || displayName,
            displayName,
            volume: finalVolume,
            price: finalPrice,
            category: it.category || '',
            barcode: barcodeVal,
            brand: brandVal,
            copies: it.copies || 1,
            logoUrl
          }
        });
      } else {
        // Remaining slots on final sheet
        slots.push({
          slotNumber: slot,
          isOffsetEmpty: true,
          item: null
        });
      }
    }

    sheets.push({
      sheetIndex: sheetIdx + 1,
      slots
    });

    sheetIdx++;
    if (expandedItems.length === 0) break;
  }

  return {
    template,
    sheets,
    totalLabelsToPrint: expandedItems.length,
    totalSheets: sheets.length,
    startSlot
  };
}

