const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
export const NON_PRODUCT = new Set(['no barcode', 'bottle/can tax', 'deals/specials', 'allocated bottles', 'misc', 'general', 'inventory', 'uncategorized', 'unknown']);

// Balanced POS Category Rules: specific enough to distinguish retail departments without micro-fragmentation
const RULES = [
  // 1. Candies & Snacks
  { id: 'snack-puffs', test: /\b(cheetos|doritos|fritos|lays|pringles|takis|ruffles|tostitos)\b/i, to: 'CANDY/SNACKS' },
  { id: 'trail-mix', test: /\btrail mix\b/i, to: 'CANDY/SNACKS' },
  { id: 'snacks', test: /\b(chips|candy|chocolate|cookies?|jerky|crackers|popcorn|pretzels?|nuts|snack|gummies|m&m|snickers|skittles)\b/i, to: 'CANDY/SNACKS' },
  { id: 'ice-cream', test: /\bice cream\b/i, to: 'ICE CREAM' },

  // 2. RTD (Ready to Drink) & Canned Cocktails & Hard Seltzers
  { id: 'rtd-tea-ice', test: /\b(hard tea|twisted tea|smirnoff ice|hard seltzer|white claw|truly|high noon|cutwater|canned cocktail|monaco|cayman jack|beatbox|mikes hard|simply spiked)\b/i, to: 'RTD (READY TO DRINK)' },

  // 3. Smoke Shop & Tobacco & Alternatives
  { id: 'pipe-tobacco', test: /\bpipe tobacco\b/i, to: 'TOBACCO PRODUCTS' },
  { id: 'vape', test: /\b(geek ?bar|lost mary|elf bar|vape|disposable|e-?liquid|cartridge|raz vape|breeze)\b/i, to: 'VAPES' },
  { id: 'hemp', test: /\b(thca|delta ?[89]|cbd)\b/i, to: 'HEMP/THCA' },
  { id: 'kava', test: /\b(kratom|kava)\b/i, to: 'KAVA/KRATOM' },
  { id: 'pouch', test: /\b(zyn|nicotine pouch\w*|on! pouch|velo|lucy)\b/i, to: 'NICOTINE POUCHES' },
  { id: 'smoke-acc', test: /\b(grinder|rolling papers?|torch|lighter|hookah|bong|bubbler|raw cones?|bic lighter)\b/i, to: 'Smoke Shop' },
  { id: 'tobacco', test: /\b(cigar|cigarette|marlboro|newport|american spirit|copenhagen|swisher|backwoods)\b/i, to: 'TOBACCO PRODUCTS' },

  // 4. Liquor / Spirits
  { id: 'spirits', test: /\b(whiske?y|bourbon|vodka|tequila|rum|gin|cognac|brandy|liqueur|scotch|mezcal|cordials?|moonshine|schnapps|triple sec|vermouth|hennessy|grey goose|titos?|patr[oó]n|jameson|jack daniel|johnnie walker|crown royal|fireball|smirnoff|bacardi|captain morgan|don julio|casamigos|macallan|maker'?s mark|woodford|glenfiddich|bombay|tanqueray|baileys|kahlua|jagermeister)\b/i, to: 'LIQUOR/SPIRITS' },

  // 5. Wine
  { id: 'wine', test: /\b(wine|cabernet|merlot|chardonnay|pinot|prosecco|champagne|sparkling wine|ros[eé]|sauvignon|moscato|malbec|riesling|syrah|zinfandel|chianti|red wine|white wine|house vintage|kendall jackson|barefoot|mondavi|yellow tail|sutter home|josh cellars)\b/i, to: 'WINE' },

  // 6. Beer & Ciders
  { id: 'beer', test: /\b(beer|lager|ipa|stout|pilsner|budweiser|bud light|coors|heineken|modelo|corona|michelob|miller|stella artois|blue moon|guinness|pacifico|sierra nevada|dogfish|goose island|sam adams|cider|angry orchard|shacksbury|craft beer|ale|porter|wheat beer)\b/i, to: 'BEER' },

  // 7. Non-Alcoholic Drinks & Mixers
  { id: 'drinks', test: /\b(soda|cola|juice|water|energy drink|red bull|monster|gatorade|powerade|tea|coffee|tonic|club soda|mixer|ginger ale|coca-?cola|pepsi|sprite|dr pepper|canada dry|sparkling water|liquid death|celsius)\b/i, to: 'DRINKS' },

  // 8. General Retail & Barware
  { id: 'general-retail', test: /\b(ice bag|bag of ice|plastic cups?|red solo|party cups?|shot glass|corkscrew|bottle opener|cooler|straws?)\b/i, to: 'General Retail' }
];

const FORBIDDEN = [
  { id: 'snack-vs-vape', name: /\b(cheetos|doritos|fritos|lays|pringles)\b/i, category: /vape/i },
  { id: 'food-vs-drinks', name: /\b(trail mix|jerky)\b/i, category: /^drinks$/i },
  { id: 'pipe-tobacco-vs-paraphernalia', name: /\bpipe tobacco\b/i, category: /smoke shop/i },
  { id: 'rtd-vs-tea-or-spirits', name: /\b(hard tea|twisted tea|smirnoff ice)\b/i, category: /^(drinks|liquor\/spirits)$/i }
];

export function findCanonical(list, wanted) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const w = collapse(wanted);
  return list.find((c) => collapse(c) === w) || null;
}

export function splitCategories(value) {
  return String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export function evaluateCategory(name, existingValue, canonical = []) {
  const existing = splitCategories(existingValue);
  const conflicts = [];
  for (const f of FORBIDDEN) {
    if (f.name.test(name) && existing.some((c) => f.category.test(collapse(c)))) {
      conflicts.push(f.id);
    }
  }

  const hasProductCategory = existing.some((c) => !NON_PRODUCT.has(collapse(c)));
  let suggestion = null, rule = null;

  // If no product category or existing category is generic non-product placeholder
  if (!hasProductCategory) {
    for (const r of RULES) {
      if (r.test.test(name)) {
        if (Array.isArray(canonical) && canonical.length > 0) {
          suggestion = findCanonical(canonical, r.to);
        } else {
          suggestion = r.to;
        }
        rule = r.id;
        break;
      }
    }
  }

  return { existing, conflicts, suggestion, rule };
}

