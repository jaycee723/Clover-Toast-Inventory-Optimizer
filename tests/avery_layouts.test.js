import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAveryLayoutToFirestore,
  listAveryLayoutsFromFirestore,
  loadAveryLayoutFromFirestore,
  deleteAveryLayoutFromFirestore
} from '../src/firebase.js';
import {
  AVERY_PRESET_LAYOUTS,
  averyStudioState
} from '../app.js';
import { extractNameAndVolume } from '../src/avery_templates.js';

// Setup mock localStorage for Node testing environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

test('AVERY_PRESET_LAYOUTS defines all standard built-in templates with exact configurations', () => {
  const weekly = AVERY_PRESET_LAYOUTS.preset_weekly_shelf_tags;
  assert.ok(weekly, 'preset_weekly_shelf_tags must exist');
  assert.equal(weekly.name, 'Weekly Shelf Tags');
  assert.equal(weekly.templateId, '5160');
  assert.equal(weekly.filterStatus, 'approved');
  assert.equal(weekly.copies, 1);
  assert.equal(weekly.showGuide, false);

  const launch = AVERY_PRESET_LAYOUTS.preset_new_product_launch;
  assert.ok(launch, 'preset_new_product_launch must exist');
  assert.equal(launch.name, 'New Product Launch Stickers');
  assert.equal(launch.templateId, '5162');
  assert.equal(launch.copies, 2);
  assert.equal(launch.showGuide, true);

  const clearance = AVERY_PRESET_LAYOUTS.preset_clearance_blowout;
  assert.ok(clearance, 'preset_clearance_blowout must exist');
  assert.equal(clearance.name, 'Clearance & Promo Labels');
  assert.equal(clearance.templateId, '5161');
  assert.equal(clearance.copies, 1);

  const bottle = AVERY_PRESET_LAYOUTS.preset_bottle_neck_tags;
  assert.ok(bottle, 'preset_bottle_neck_tags must exist');
  assert.equal(bottle.name, 'Bottle Neck & Return Tags');
  assert.equal(bottle.templateId, '5167');
  assert.equal(bottle.copies, 1);
});

test('saveAveryLayoutToFirestore persists layout with normalized items and offline caching', async () => {
  globalThis.localStorage.clear();

  // Test item volume normalization according to user rules (11oz, 1 L, 750ml, 12-Pack)
  const norm1 = extractNameAndVolume('Bud Light 11oz Can');
  assert.equal(norm1.volume, '11oz');

  const norm2 = extractNameAndVolume('Grey Goose 1l Bottle');
  assert.equal(norm2.volume, '1 L');

  const sampleItems = [
    {
      id: 'item_1',
      name: 'Bud Light 11oz Can',
      displayName: 'Bud Light',
      volume: norm1.volume,
      price: '$2.99',
      barcode: '018200530470',
      brand: 'Bud Light',
      copies: 1
    },
    {
      id: 'item_2',
      name: 'Grey Goose 1l Bottle',
      displayName: 'Grey Goose Vodka',
      volume: norm2.volume,
      price: '$42.99',
      barcode: '080480280024',
      brand: 'Grey Goose',
      copies: 2
    }
  ];

  const layoutPayload = {
    name: 'Weekend Spirits Special',
    templateId: '5160',
    filterCategory: 'Spirits',
    filterStatus: 'all',
    startSlot: 3,
    copies: 1,
    showGuide: true,
    selectedBrand: 'Grey Goose',
    items: sampleItems
  };

  const saved = await saveAveryLayoutToFirestore(layoutPayload);
  assert.ok(saved.id, 'Must generate unique layout ID');
  assert.equal(saved.name, 'Weekend Spirits Special');
  assert.equal(saved.templateId, '5160');
  assert.equal(saved.itemCount, 2);
  assert.equal(saved.config.startSlot, 3);
  assert.equal(saved.config.selectedBrand, 'Grey Goose');
  assert.equal(saved.config.items[0].volume, '11oz');
  assert.equal(saved.config.items[1].volume, '1 L');

  // Verify listAveryLayoutsFromFirestore retrieves it from offline cache
  const allLayouts = await listAveryLayoutsFromFirestore();
  assert.ok(Array.isArray(allLayouts));
  assert.equal(allLayouts.length, 1);
  assert.equal(allLayouts[0].name, 'Weekend Spirits Special');
  assert.equal(allLayouts[0].templateId, '5160');

  // Verify loadAveryLayoutFromFirestore loads full config
  const loaded = await loadAveryLayoutFromFirestore(saved.id);
  assert.ok(loaded);
  assert.equal(loaded.id, saved.id);
  assert.equal(loaded.config.items.length, 2);
  assert.equal(loaded.config.items[0].displayName, 'Bud Light');
  assert.equal(loaded.config.items[1].displayName, 'Grey Goose Vodka');

  // Delete layout
  const deleted = await deleteAveryLayoutFromFirestore(saved.id);
  assert.equal(deleted, true);

  const afterDelete = await listAveryLayoutsFromFirestore();
  assert.equal(afterDelete.length, 0);

  const loadedAfterDelete = await loadAveryLayoutFromFirestore(saved.id);
  assert.equal(loadedAfterDelete, null);
});

test('averyStudioState tracks active layout and userSavedLayouts', () => {
  assert.ok(averyStudioState);
  assert.ok('activeLayoutId' in averyStudioState);
  assert.ok('activeLayoutName' in averyStudioState);
  assert.ok(Array.isArray(averyStudioState.userSavedLayouts));
});
