import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCategory } from '../src/categories.js';
import {
  buildRows,
  computeRowCertainty,
  approvePrice,
  rejectPrice,
  setFieldDecision,
  isApproved
} from '../src/review.js';
import {
  applyAiChanges,
  revertAiChanges
} from '../src/ai_assistant.js';

test('balanced POS categories categorize diverse inventory into clean departments', () => {
  // Spirits
  assert.equal(evaluateCategory('Patron Silver Tequila 750ml', '').suggestion, 'LIQUOR/SPIRITS');
  assert.equal(evaluateCategory('Woodford Reserve Bourbon 750ml', '').suggestion, 'LIQUOR/SPIRITS');

  // Beer
  assert.equal(evaluateCategory('Corona Extra 12pk Bottles', '').suggestion, 'BEER');
  assert.equal(evaluateCategory('Modelo Especial 12pk Can', '').suggestion, 'BEER');

  // RTD / Seltzers
  assert.equal(evaluateCategory('White Claw Black Cherry 12pk', '').suggestion, 'RTD (READY TO DRINK)');
  assert.equal(evaluateCategory('High Noon Vodka Seltzer 8pk', '').suggestion, 'RTD (READY TO DRINK)');

  // Wine
  assert.equal(evaluateCategory('Kendall Jackson Chardonnay 750ml', '').suggestion, 'WINE');
  assert.equal(evaluateCategory('Josh Cellars Cabernet Sauvignon', '').suggestion, 'WINE');

  // Snacks & Candy
  assert.equal(evaluateCategory('Doritos Nacho Cheese 9.25oz', '').suggestion, 'CANDY/SNACKS');
  assert.equal(evaluateCategory('Skittles Wild Berry 2.17oz', '').suggestion, 'CANDY/SNACKS');

  // Non-Alcoholic Drinks
  assert.equal(evaluateCategory('Red Bull Energy Drink 12oz', '').suggestion, 'DRINKS');
  assert.equal(evaluateCategory('Coca-Cola 2 Liter Bottle', '').suggestion, 'DRINKS');
});

test('pricing engine computes gross margin percentage and tracks price status', () => {
  const records = [
    { name: 'MODELO 12PK CAN', barcode: '080660957579', category: 'Beer', price: '25.00', cost: '15.00' },
    { name: 'NO PRICE ITEM', barcode: '088320000002', category: 'General', price: '', cost: '5.00' },
    { name: 'ZERO PRICE ITEM', barcode: '088320000003', category: 'General', price: '0.00', cost: '' }
  ];

  const rows = buildRows(records);

  // Row 1: Valid price and cost -> 40% margin, verified
  assert.equal(rows[0].price, '25.00');
  assert.equal(rows[0].margin, '40.0');
  assert.equal(rows[0].price_status, 'verified');

  // Row 2 & 3: Missing price -> price_status 'missing'
  assert.equal(rows[1].price_status, 'missing');
  assert.equal(rows[2].price_status, 'missing');

  // Row Certainty check flags missing prices
  const cert1 = computeRowCertainty(rows[0]);
  assert.equal(cert1.flagged, false);

  const cert2 = computeRowCertainty(rows[1]);
  assert.equal(cert2.flagged, true);
  assert.ok(cert2.reasons.some((r) => r.includes('missing or $0.00')));
});

test('AI price changes are strictly held for manual operator approval before committing', () => {
  const records = [
    { name: 'TITOS 750ML', barcode: '088320000001', category: 'Spirits', price: '20.00', cost: '15.00' }
  ];
  const rows = buildRows(records);
  rows[0].decisions.barcode = 'accept';
  rows[0].decisions.name = 'accept';
  rows[0].decisions.category = 'accept';

  // Initially approved because barcode & proposals are decided
  assert.equal(isApproved(rows[0]), true);

  // Gemini proposes a price increase from $20.00 to $24.99
  const changes = [
    {
      id: rows[0].id,
      field: 'price',
      originalValue: '20.00',
      proposedValue: '24.99',
      reason: 'Market pricing adjustment based on online retail query'
    }
  ];

  // Apply with default requireManualPriceApproval: true
  applyAiChanges(records, rows, changes, { requireManualPriceApproval: true });

  // Original price MUST NOT be mutated automatically!
  assert.equal(rows[0].price, '20.00');
  assert.equal(rows[0].proposed_price, '24.99');
  assert.equal(rows[0].price_status, 'pending_approval');
  assert.equal(rows[0].price_proposal_reason, 'Market pricing adjustment based on online retail query');

  // Item MUST NOT be approved while price approval is pending
  assert.equal(isApproved(rows[0]), false);

  const cert = computeRowCertainty(rows[0]);
  assert.equal(cert.flagged, true);
  assert.ok(cert.reasons.some((r) => r.includes('manual approval')));

  // Rejecting price keeps original and returns to verified
  rejectPrice(rows, rows[0].id);
  assert.equal(rows[0].price, '20.00');
  assert.equal(rows[0].proposed_price, null);
  assert.equal(rows[0].price_status, 'verified');
  assert.equal(isApproved(rows[0]), true);

  // Re-apply proposal and approve price
  applyAiChanges(records, rows, changes, { requireManualPriceApproval: true });
  assert.equal(isApproved(rows[0]), false);

  approvePrice(rows, rows[0].id);
  assert.equal(rows[0].price, '24.99');
  assert.equal(rows[0].proposed_price, null);
  assert.equal(rows[0].price_status, 'verified');
  assert.equal(isApproved(rows[0]), true);
  assert.equal(records[0].price, '24.99');
});

test('setFieldDecision allows granular individual accept/reject for each field', () => {
  const records = [
    { name: 'OLD NAME', barcode: '088320000001', category: 'OLD CAT', price: '10.00' }
  ];
  const rows = buildRows(records);

  setFieldDecision(rows, rows[0].id, 'name', 'reject');
  assert.equal(rows[0].decisions.name, 'reject');

  setFieldDecision(rows, rows[0].id, 'category', 'accept');
  assert.equal(rows[0].decisions.category, 'accept');

  setFieldDecision(rows, rows[0].id, 'barcode', 'accept');
  assert.equal(rows[0].decisions.barcode, 'accept');
});
