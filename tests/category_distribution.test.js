import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCategoryDistribution,
  sortDistribution,
  filterDistribution,
  generateCategoryInsight,
  inferToastDepartment,
  isUncategorized
} from '../src/category_distribution.js';

test('isUncategorized identifies empty and placeholder categories', () => {
  assert.equal(isUncategorized(''), true);
  assert.equal(isUncategorized(null), true);
  assert.equal(isUncategorized(undefined), true);
  assert.equal(isUncategorized('uncategorized'), true);
  assert.equal(isUncategorized('None'), true);
  assert.equal(isUncategorized('Misc'), true);
  assert.equal(isUncategorized('Spirits - Vodka'), false);
  assert.equal(isUncategorized('Beer'), false);
});

test('inferToastDepartment maps diverse retail categories to Toast departments', () => {
  assert.equal(inferToastDepartment('Spirits - Bourbon', ['Maker\'s Mark']), 'Liquor / Spirits');
  assert.equal(inferToastDepartment('Beer - Craft & Micro', ['Sierra Nevada IPA']), 'Beer & Cider');
  assert.equal(inferToastDepartment('Wine - Red', ['Cabernet Sauvignon']), 'Wine');
  assert.equal(inferToastDepartment('Seltzers & Canned Cocktails', ['White Claw Black Cherry']), 'RTD (Ready to Drink)');
  assert.equal(inferToastDepartment('Snacks & Chips', ['Doritos Nacho Cheese']), 'Candy & Snacks');
  assert.equal(inferToastDepartment('Non-Alcoholic', ['Red Bull Energy Drink']), 'Non-Alcoholic Drinks');
  assert.equal(inferToastDepartment('Tobacco & Cigars', ['Marlboro Gold']), 'Tobacco & Vapes');
  assert.equal(inferToastDepartment('Store Supplies', ['Ice Bag 10lb']), 'General Retail');
});

test('computeCategoryDistribution correctly aggregates Clover inventory records', () => {
  const records = [
    { name: 'TITOS VODKA 750ML', category: 'Spirits - Vodka' },
    { name: 'GREY GOOSE 750ML', category: 'Spirits - Vodka' },
    { name: 'CORONA EXTRA 6PK', category: 'Beer - Imports' },
    { name: 'HEINEKEN 6PK', category: 'Beer - Imports' },
    { name: 'GUINNESS STOUT 6PK', category: 'Beer - Imports' },
    { name: 'CABERNET SAUVIGNON', category: 'Wine - Red' },
    { name: 'MYSTERY ITEM', category: '' }
  ];

  const result = computeCategoryDistribution(records);

  assert.equal(result.totalItems, 7);
  assert.equal(result.uniqueCategoryCount, 3);
  assert.equal(result.categorizedCount, 6);
  assert.equal(result.uncategorizedCount, 1);
  assert.equal(result.topCategory.name, 'Beer - Imports');
  assert.equal(result.topCategory.count, 3);
  assert.equal(result.topCategory.percentage, 42.9);

  // Check categories list
  const vodka = result.categories.find((c) => c.name === 'Spirits - Vodka');
  assert.ok(vodka);
  assert.equal(vodka.count, 2);
  assert.equal(vodka.percentage, 28.6);
  assert.equal(vodka.toastDepartment, 'Liquor / Spirits');
  assert.equal(vodka.sampleItems.length, 2);

  const uncat = result.categories.find((c) => c.isUncategorized);
  assert.ok(uncat);
  assert.equal(uncat.count, 1);
});

test('computeCategoryDistribution handles empty and invalid inputs gracefully', () => {
  const emptyRes = computeCategoryDistribution([]);
  assert.equal(emptyRes.totalItems, 0);
  assert.equal(emptyRes.uniqueCategoryCount, 0);
  assert.equal(emptyRes.categories.length, 0);
  assert.equal(emptyRes.varietyRating, 'No Data');

  const nullRes = computeCategoryDistribution(null);
  assert.equal(nullRes.totalItems, 0);
});

test('sortDistribution sorts by count descending, ascending, and alphabetical', () => {
  const cats = [
    { name: 'Wine', count: 5, isUncategorized: false },
    { name: 'Beer', count: 12, isUncategorized: false },
    { name: 'Spirits', count: 8, isUncategorized: false },
    { name: '(Uncategorized)', count: 2, isUncategorized: true }
  ];

  const sortedDesc = sortDistribution(cats, 'count_desc');
  assert.equal(sortedDesc[0].name, 'Beer');
  assert.equal(sortedDesc[1].name, 'Spirits');
  assert.equal(sortedDesc[2].name, 'Wine');
  assert.equal(sortedDesc[3].name, '(Uncategorized)');

  const sortedAsc = sortDistribution(cats, 'count_asc');
  assert.equal(sortedAsc[0].name, '(Uncategorized)');
  assert.equal(sortedAsc[1].name, 'Wine');

  const sortedAlpha = sortDistribution(cats, 'alpha_asc');
  assert.equal(sortedAlpha[0].name, '(Uncategorized)');
  assert.equal(sortedAlpha[1].name, 'Beer');
  assert.equal(sortedAlpha[2].name, 'Spirits');
  assert.equal(sortedAlpha[3].name, 'Wine');
});

test('filterDistribution filters categories by name and toast department', () => {
  const cats = [
    { name: 'Spirits - Bourbon', toastDepartment: 'Liquor / Spirits' },
    { name: 'Beer - IPA', toastDepartment: 'Beer & Cider' },
    { name: 'Wine - White', toastDepartment: 'Wine' }
  ];

  const beerMatch = filterDistribution(cats, 'ipa');
  assert.equal(beerMatch.length, 1);
  assert.equal(beerMatch[0].name, 'Beer - IPA');

  const toastMatch = filterDistribution(cats, 'liquor');
  assert.equal(toastMatch.length, 1);
  assert.equal(toastMatch[0].name, 'Spirits - Bourbon');

  const emptyMatch = filterDistribution(cats, '');
  assert.equal(emptyMatch.length, 3);
});

test('generateCategoryInsight produces clear, informative analytical text', () => {
  const summary = {
    totalItems: 25,
    uniqueCategoryCount: 6,
    categorizedCount: 24,
    uncategorizedCount: 1,
    varietyRating: 'Balanced Variety',
    topCategory: { name: 'Spirits - Vodka', count: 8, percentage: 32.0, isUncategorized: false }
  };

  const insight = generateCategoryInsight(summary);
  assert.ok(insight.includes('Detected 6 distinct Clover categories across 25 products'));
  assert.ok(insight.includes('Spirits - Vodka'));
  assert.ok(insight.includes('1 items need classification'));
});
