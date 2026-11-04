import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVERY_TEMPLATES,
  DEFAULT_STORE_LOGO_SVG,
  extractNameAndVolume,
  formatLabelPrice,
  calculateAverySheetSlots,
  extractItemBrand,
  groupItemsByBrand,
  createAveryQueueItem
} from '../src/avery_templates.js';

test('Avery Templates Catalog covers all standard retail inkjet sizes', () => {
  const expectedCodes = ['5160', '5161', '5162', '5163', '5164', '5167', '22806', '22807', '5165'];

  for (const code of expectedCodes) {
    const tmpl = AVERY_TEMPLATES[code];
    assert.ok(tmpl, `Template ${code} should exist in AVERY_TEMPLATES`);
    assert.equal(tmpl.paperSize, 'letter');
    assert.equal(tmpl.sheetWidthIn, 8.5);
    assert.equal(tmpl.sheetHeightIn, 11.0);
    assert.equal(tmpl.labelsPerSheet, tmpl.columns * tmpl.rows, `${code} labels per sheet must equal columns * rows`);

    // Verify mathematical bounds on physical US Letter sheet
    const totalContentWidth = tmpl.leftMarginIn + (tmpl.columns * tmpl.labelWidthIn) + ((tmpl.columns - 1) * tmpl.colGapIn);
    const totalContentHeight = tmpl.topMarginIn + (tmpl.rows * tmpl.labelHeightIn) + ((tmpl.rows - 1) * tmpl.rowGapIn);

    assert.ok(totalContentWidth <= 8.5, `${code} width ${totalContentWidth} exceeds 8.5" sheet width`);
    assert.ok(totalContentHeight <= 11.0, `${code} height ${totalContentHeight} exceeds 11.0" sheet height`);

    // Verify font scale definitions
    assert.ok(tmpl.fontScale.namePt > 0);
    assert.ok(tmpl.fontScale.pricePt > 0);
    assert.ok(tmpl.fontScale.logoWidthIn > 0);
  }
});

test('Avery 5160 exact original retail dimensions & margins', () => {
  const t = AVERY_TEMPLATES['5160'];
  assert.equal(t.labelWidthIn, 2.625);
  assert.equal(t.labelHeightIn, 1.0);
  assert.equal(t.columns, 3);
  assert.equal(t.rows, 10);
  assert.equal(t.labelsPerSheet, 30);
  assert.equal(t.topMarginIn, 0.5);
  assert.equal(t.leftMarginIn, 0.1875);
  assert.equal(t.horizontalPitchIn, 2.75);
  assert.equal(t.verticalPitchIn, 1.0);
  assert.equal(t.colGapIn, 0.125);
});

test('Avery 5167 slim return address & bottle neck tag specifications', () => {
  const t = AVERY_TEMPLATES['5167'];
  assert.equal(t.labelWidthIn, 1.75);
  assert.equal(t.labelHeightIn, 0.5);
  assert.equal(t.columns, 4);
  assert.equal(t.rows, 20);
  assert.equal(t.labelsPerSheet, 80);
  assert.equal(t.topMarginIn, 0.5);
  assert.equal(t.leftMarginIn, 0.281);
});

test('Avery 22806 & 22807 square and round print-to-the-edge stickers', () => {
  const sq = AVERY_TEMPLATES['22806'];
  const rd = AVERY_TEMPLATES['22807'];

  assert.equal(sq.labelsPerSheet, 12);
  assert.equal(sq.shape, 'square');
  assert.equal(sq.labelWidthIn, 2.0);
  assert.equal(sq.labelHeightIn, 2.0);

  assert.equal(rd.labelsPerSheet, 12);
  assert.equal(rd.shape, 'round');
  assert.equal(rd.labelWidthIn, 2.0);
  assert.equal(rd.labelHeightIn, 2.0);
});

test('extractNameAndVolume enforces normalization capitalization rules (11oz, 1 L, etc.)', () => {
  // Ounce capitalization
  const res1 = extractNameAndVolume('bud light 12 oz cans');
  assert.equal(res1.volume, '12oz');
  assert.equal(res1.cleanName, 'Bud Light Cans');

  const res2 = extractNameAndVolume('GUINNESS EXTRA STOUT 11OZ BOTTLE');
  assert.equal(res2.volume, '11oz');
  assert.equal(res2.cleanName, 'Guinness Extra Stout Bottle');

  // Liter capitalization
  const res3 = extractNameAndVolume('titos handmade vodka 1.75 l');
  assert.equal(res3.volume, '1.75 L');
  assert.equal(res3.cleanName, 'Titos Handmade Vodka');

  const res4 = extractNameAndVolume('jameson irish whiskey 1 liter');
  assert.equal(res4.volume, '1 L');
  assert.equal(res4.cleanName, 'Jameson Irish Whiskey');

  // Milliliter capitalization
  const res5 = extractNameAndVolume('casamigos reposado tequila 750ml');
  assert.equal(res5.volume, '750ml');
  assert.equal(res5.cleanName, 'Casamigos Reposado Tequila');

  // Multi-pack formatting
  const res6 = extractNameAndVolume('coors light 12pk cans');
  assert.equal(res6.volume, '12-Pack');
  assert.equal(res6.cleanName, 'Coors Light Cans');
});

test('formatLabelPrice formats dollar values cleanly', () => {
  assert.equal(formatLabelPrice('14.99'), '$14.99');
  assert.equal(formatLabelPrice('$14.99'), '$14.99');
  assert.equal(formatLabelPrice('19.9'), '$19.90');
  assert.equal(formatLabelPrice('0'), '$0.00');
  assert.equal(formatLabelPrice(null), '$0.00');
  assert.equal(formatLabelPrice(''), '$0.00');
});

test('calculateAverySheetSlots correctly positions labels and supports starting slot offset', () => {
  const sampleItems = [
    { id: '1', current_name: 'Bud Light 12oz', price: '14.99' },
    { id: '2', current_name: 'Titos Vodka 1.75 L', price: '29.99' },
    { id: '3', current_name: 'Casamigos 750ml', price: '49.99' }
  ];

  // Slot 1 (no offset)
  const resultSlot1 = calculateAverySheetSlots('5160', sampleItems, { startSlot: 1 });
  assert.equal(resultSlot1.sheets.length, 1);
  const slots1 = resultSlot1.sheets[0].slots;
  assert.equal(slots1.length, 30);
  assert.equal(slots1[0].isOffsetEmpty, false);
  assert.equal(slots1[0].item.displayName, 'Bud Light');
  assert.equal(slots1[0].item.volume, '12oz');
  assert.equal(slots1[1].isOffsetEmpty, false);
  assert.equal(slots1[1].item.displayName, 'Titos Vodka');
  assert.equal(slots1[1].item.volume, '1.75 L');
  assert.equal(slots1[2].isOffsetEmpty, false);
  assert.equal(slots1[2].item.displayName, 'Casamigos');
  assert.equal(slots1[2].item.volume, '750ml');
  assert.equal(slots1[3].isOffsetEmpty, true); // Remaining slots empty

  // Slot 5 offset (reusing partially used sticker sheet)
  const resultSlot5 = calculateAverySheetSlots('5160', sampleItems, { startSlot: 5 });
  const slots5 = resultSlot5.sheets[0].slots;
  assert.equal(slots5.length, 30);
  // Slots 1-4 should be offset empty
  assert.equal(slots5[0].isOffsetEmpty, true);
  assert.equal(slots5[1].isOffsetEmpty, true);
  assert.equal(slots5[2].isOffsetEmpty, true);
  assert.equal(slots5[3].isOffsetEmpty, true);
  // Slot 5 has item 1
  assert.equal(slots5[4].isOffsetEmpty, false);
  assert.equal(slots5[4].item.displayName, 'Bud Light');
  // Slot 6 has item 2
  assert.equal(slots5[5].isOffsetEmpty, false);
  assert.equal(slots5[5].item.displayName, 'Titos Vodka');
  // Slot 7 has item 3
  assert.equal(slots5[6].isOffsetEmpty, false);
  assert.equal(slots5[6].item.displayName, 'Casamigos');
});

test('calculateAverySheetSlots handles multi-sheet pagination when item count exceeds labels per sheet', () => {
  // Generate 45 items for Avery 5160 (30 per sheet)
  const items = Array.from({ length: 45 }, (_, i) => ({
    id: `item_${i + 1}`,
    current_name: `Product ${i + 1} 750ml`,
    price: '19.99'
  }));

  const res = calculateAverySheetSlots('5160', items, { startSlot: 1 });
  assert.equal(res.sheets.length, 2);
  assert.equal(res.sheets[0].slots.length, 30);
  assert.equal(res.sheets[1].slots.length, 30);

  // Sheet 1 has 30 items
  assert.equal(res.sheets[0].slots.filter((s) => !s.isOffsetEmpty).length, 30);
  // Sheet 2 has 15 items + 15 empty
  assert.equal(res.sheets[1].slots.filter((s) => !s.isOffsetEmpty).length, 15);
  assert.equal(res.sheets[1].slots.filter((s) => s.isOffsetEmpty).length, 15);
});

test('Default high-resolution SVG store logo is provided and valid', () => {
  assert.ok(DEFAULT_STORE_LOGO_SVG.startsWith('data:image/svg+xml;utf8,<svg'));
  assert.ok(DEFAULT_STORE_LOGO_SVG.includes('777 LIQUOR'));
});

test('extractItemBrand accurately detects explicit and title-based brands', () => {
  // Explicit brand field
  assert.equal(extractItemBrand({ brand: 'Patron', name: 'Silver 750ml' }), 'Patrón');
  assert.equal(extractItemBrand({ brand: 'titos', name: 'Handmade Vodka 1.75 L' }), "Tito's");
  assert.equal(extractItemBrand({ brand: 'Guinness', name: 'Draught Stout 11oz' }), 'Guinness');

  // Known multi-word brands parsed from title
  assert.equal(extractItemBrand('BUD LIGHT 12OZ CANS'), 'Bud Light');
  assert.equal(extractItemBrand('Stella Artois Belgian Lager 11oz'), 'Stella Artois');
  assert.equal(extractItemBrand('Jack Daniels Old No 7 750ml'), "Jack Daniel's");
  assert.equal(extractItemBrand('White Claw Black Cherry 12-Pack'), 'White Claw');
  assert.equal(extractItemBrand('Johnnie Walker Black Label 1 L'), 'Johnnie Walker');

  // Known single-word brands parsed from title
  assert.equal(extractItemBrand('TITOS HANDMADE VODKA 1.75 L'), "Tito's");
  assert.equal(extractItemBrand('Casamigos Blanco Tequila 750ml'), 'Casamigos');
  assert.equal(extractItemBrand('Jameson Irish Whiskey 1 Liter'), 'Jameson');
  assert.equal(extractItemBrand('Corona Extra 12pk Bottles'), 'Corona Extra');
  assert.equal(extractItemBrand('Corona 12pk Bottles'), 'Corona');
});

test('groupItemsByBrand groups catalog items by brand with item counts', () => {
  const items = [
    { name: 'Bud Light 12oz Cans' },
    { name: 'Bud Light Platinum 16oz' },
    { name: 'Bud Light Seltzer 12-Pack' },
    { name: 'Titos Handmade Vodka 1.75 L' },
    { name: 'Titos Handmade Vodka 750ml' },
    { name: 'Casamigos Reposado 750ml' }
  ];

  const groups = groupItemsByBrand(items);
  assert.ok(Array.isArray(groups));
  assert.equal(groups.length, 3);

  const budLightGroup = groups.find((g) => g.brand === 'Bud Light');
  assert.ok(budLightGroup);
  assert.equal(budLightGroup.count, 3);
  assert.equal(budLightGroup.items.length, 3);

  const titosGroup = groups.find((g) => g.brand === "Tito's");
  assert.ok(titosGroup);
  assert.equal(titosGroup.count, 2);

  const casamigosGroup = groups.find((g) => g.brand === 'Casamigos');
  assert.ok(casamigosGroup);
  assert.equal(casamigosGroup.count, 1);
});

test('createAveryQueueItem enforces volume capitalization rules (11oz, 1 L, etc.)', () => {
  const it1 = createAveryQueueItem({ name: 'guinness extra stout 11 oz bottle', price: '12.99' });
  assert.equal(it1.volume, '11oz');
  assert.equal(it1.displayName, 'Guinness Extra Stout Bottle');
  assert.equal(it1.price, '$12.99');
  assert.equal(it1.brand, 'Guinness');

  const it2 = createAveryQueueItem({ name: 'jameson whiskey 1 liter', price: '34.99' });
  assert.equal(it2.volume, '1 L');
  assert.equal(it2.displayName, 'Jameson Whiskey');

  const it3 = createAveryQueueItem({ name: 'casamigos reposado 750ml', price: '54.99' });
  assert.equal(it3.volume, '750ml');

  const it4 = createAveryQueueItem({ name: 'titos vodka 1.75 l', price: '29.99' });
  assert.equal(it4.volume, '1.75 L');

  const it5 = createAveryQueueItem({ name: 'coors light 12pk cans', price: '13.99' });
  assert.equal(it5.volume, '12-Pack');
});

test('calculateAverySheetSlots formats all 3 visible rows and preserves individual queue edits', () => {
  const queue = [
    {
      id: 'lbl-1',
      displayName: 'Custom High-End Bourbon',
      volume: '750ml',
      price: '$89.99',
      barcode: '085000014021',
      brand: 'Custom Distiller',
      copies: 2
    },
    {
      id: 'lbl-2',
      displayName: 'Guinness Extra Stout',
      volume: '11oz',
      price: '$12.99',
      barcode: '083820123456',
      brand: 'Guinness',
      copies: 1
    }
  ];

  const result = calculateAverySheetSlots('5160', queue, { startSlot: 1 });
  assert.equal(result.totalLabelsToPrint, 3); // 2 copies of item 1 + 1 copy of item 2

  const slot1 = result.sheets[0].slots[0];
  const slot2 = result.sheets[0].slots[1];
  const slot3 = result.sheets[0].slots[2];

  // Verify Row 1 (Name), Row 2 (Volume & Barcode), Row 3 (Price)
  assert.equal(slot1.item.displayName, 'Custom High-End Bourbon'); // Row 1
  assert.equal(slot1.item.volume, '750ml');                       // Row 2
  assert.equal(slot1.item.barcode, '085000014021');               // Row 2
  assert.equal(slot1.item.price, '$89.99');                       // Row 3

  assert.equal(slot2.item.displayName, 'Custom High-End Bourbon');
  assert.equal(slot2.item.price, '$89.99');

  assert.equal(slot3.item.displayName, 'Guinness Extra Stout');   // Row 1
  assert.equal(slot3.item.volume, '11oz');                       // Row 2
  assert.equal(slot3.item.price, '$12.99');                       // Row 3

  // Verify removing an item updates sheet slots
  const filteredQueue = queue.filter((it) => it.id !== 'lbl-1');
  const resAfterRemove = calculateAverySheetSlots('5160', filteredQueue, { startSlot: 1 });
  assert.equal(resAfterRemove.totalLabelsToPrint, 1);
  assert.equal(resAfterRemove.sheets[0].slots[0].item.displayName, 'Guinness Extra Stout');
  assert.equal(resAfterRemove.sheets[0].slots[1].isOffsetEmpty, true);
});

