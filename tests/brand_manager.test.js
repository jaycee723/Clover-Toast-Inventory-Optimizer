import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveBrandToFirestore,
  loadBrandsFromFirestore,
  deleteBrandFromFirestore,
  savePersistentCatalogToFirestore,
  loadPersistentCatalogFromFirestore
} from '../src/firebase.js';

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

test('saveBrandToFirestore and loadBrandsFromFirestore persist brands offline and maintain metadata', async () => {
  globalThis.localStorage.clear();

  const brandRecord = {
    name: 'Bud Light',
    logoUrl: 'https://example.com/budlight.png',
    source: 'gemini',
    category: 'Beer',
    itemCount: 14
  };

  const saved = await saveBrandToFirestore(brandRecord);
  assert.equal(saved.name, 'Bud Light');
  assert.equal(saved.logoUrl, 'https://example.com/budlight.png');
  assert.equal(saved.source, 'gemini');
  assert.equal(saved.itemCount, 14);

  const allBrands = await loadBrandsFromFirestore();
  assert.ok(Array.isArray(allBrands));
  assert.equal(allBrands.length, 1);
  assert.equal(allBrands[0].name, 'Bud Light');
  assert.equal(allBrands[0].logoUrl, 'https://example.com/budlight.png');

  // Add second brand
  await saveBrandToFirestore({
    name: "Tito's",
    logoUrl: 'data:image/svg+xml;utf8,...',
    source: 'custom',
    category: 'Vodka',
    itemCount: 8
  });

  const updatedBrands = await loadBrandsFromFirestore();
  assert.equal(updatedBrands.length, 2);

  // Delete brand
  await deleteBrandFromFirestore('Bud Light');
  const afterDelete = await loadBrandsFromFirestore();
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].name, "Tito's");
});

test('savePersistentCatalogToFirestore and loadPersistentCatalogFromFirestore preserve cleaned catalog', async () => {
  globalThis.localStorage.clear();

  const cleanedItems = [
    {
      id: 'c1',
      name: 'Bud Light 12oz Cans',
      displayName: 'Bud Light Cans',
      price: '$14.99',
      volume: '12oz',
      category: 'Beer',
      barcode: '018200530470',
      brand: 'Bud Light'
    },
    {
      id: 'c2',
      name: 'Titos Vodka 1.75 L',
      displayName: 'Titos Vodka',
      price: '$29.99',
      volume: '1.75 L',
      category: 'Liquor',
      barcode: '619947000020',
      brand: "Tito's"
    }
  ];

  const meta = await savePersistentCatalogToFirestore(cleanedItems, 'Store 777 Cleaned Catalog');
  assert.equal(meta.itemCount, 2);
  assert.equal(meta.name, 'Store 777 Cleaned Catalog');

  const loaded = await loadPersistentCatalogFromFirestore();
  assert.ok(loaded);
  assert.equal(loaded.itemCount, 2);
  assert.equal(loaded.items.length, 2);
  assert.equal(loaded.items[0].displayName, 'Bud Light Cans');
  assert.equal(loaded.items[0].volume, '12oz');
  assert.equal(loaded.items[1].displayName, 'Titos Vodka');
  assert.equal(loaded.items[1].volume, '1.75 L');
});
