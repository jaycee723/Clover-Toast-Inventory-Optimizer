import { analyzeBarcode } from './barcode.js';

/**
 * Extracts comprehensive dataset for the Gemini AI formatting assistant.
 * Default maxItems is 5000 to allow full catalog processing without artificial truncation.
 */
export function prepareDatasetForAi(records = [], rows = [], maxItems = 5000) {
  const list = [];
  const count = Math.min(records.length, maxItems);
  for (let i = 0; i < count; i++) {
    const rec = records[i] || {};
    const row = rows[i] || {};
    const rawPrice = row.price ?? rec.price ?? '';
    const rawCost = row.cost ?? rec.cost ?? '';
    const numPrice = Number(rawPrice);
    const numCost = Number(rawCost);
    const margin = (!isNaN(numPrice) && numPrice > 0 && !isNaN(numCost) && numCost > 0)
      ? (((numPrice - numCost) / numPrice) * 100).toFixed(1) + '%'
      : null;

    list.push({
      id: row.id || `r${i + 1}`,
      name: row.current_name || rec.name || '',
      original_name: row.original_name || rec.name || '',
      barcode: row.barcode?.digits || row.barcode?.original || rec.barcode || '',
      barcode_type: row.barcode?.type || '',
      category: row.category || rec.category || '',
      price: rawPrice,
      cost: rawCost,
      margin,
      sku: row.sku ?? rec.sku ?? '',
      brand: row.brand ?? rec.brand ?? '',
      unit: row.unit ?? rec.unit ?? '',
      supplier: row.supplier ?? rec.supplier ?? '',
      price_status: row.price_status || (!rawPrice || numPrice <= 0 ? 'missing' : 'verified'),
      proposed_price: row.proposed_price || null,
      is_flagged: row.certainty === 'review' || !!row.flagged
    });
  }
  return list;
}

/**
 * Computes a diff preview for display in the interactive side drawer / modal.
 */
export function computeDiffPreview(rows = [], changes = []) {
  if (!Array.isArray(changes)) return [];
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  return changes.map((ch, idx) => {
    const row = rowMap.get(ch.id);
    const itemName = row ? (row.current_name || row.original_name) : `Item ${ch.id}`;
    const field = ch.field || 'name';
    const isPrice = field === 'price';

    return {
      index: idx + 1,
      id: ch.id,
      itemName,
      field,
      originalValue: String(ch.originalValue ?? ''),
      proposedValue: String(ch.proposedValue ?? ''),
      reason: ch.reason || 'Formatting adjustment',
      isPrice,
      cost: row?.cost || '',
      requiresManualApproval: isPrice
    };
  });
}

/**
 * Applies approved AI changes directly to the active dataset (both records and rows).
 * RESTRICTION: Pricing changes require explicit manual approval before committing unless requireManualPriceApproval is false.
 * Creates a complete snapshot for single-click Undo capability.
 */
export function applyAiChanges(records = [], rows = [], changes = [], options = { requireManualPriceApproval: true }) {
  if (!Array.isArray(changes) || changes.length === 0) {
    return { appliedCount: 0, undoSnapshot: null, affectedIds: [] };
  }

  const undoSnapshot = {
    timestamp: Date.now(),
    changes: []
  };

  const rowMap = new Map(rows.map((r, i) => [r.id, { row: r, index: i }]));
  const affectedSet = new Set();

  for (const ch of changes) {
    const entry = rowMap.get(ch.id);
    if (!entry) continue;
    const { row, index } = entry;
    const rec = records[index];
    const field = ch.field;
    const proposed = ch.proposedValue;

    if (field === 'price') {
      if (options.requireManualPriceApproval) {
        // Safe Governance: Hold price changes in pending manual approval state
        undoSnapshot.changes.push({
          id: row.id,
          index,
          field: 'price_proposal',
          previousProposedPrice: row.proposed_price,
          previousPriceReason: row.price_proposal_reason,
          previousPriceStatus: row.price_status,
          previousPriceDecision: row.decisions?.price
        });
        row.proposed_price = String(proposed ?? '').trim();
        row.price_proposal_reason = ch.reason || 'AI proposed price standardization';
        row.price_status = 'pending_approval';
        if (row.decisions) row.decisions.price = 'pending';
        row.manuallyEdited = true;
        affectedSet.add(row.id);
      } else {
        // Direct commitment (when manually confirmed by operator)
        undoSnapshot.changes.push({
          id: row.id,
          index,
          field: 'price',
          previousRec: rec?.price,
          previousPrice: row.price,
          previousPriceStatus: row.price_status,
          previousPriceDecision: row.decisions?.price
        });
        if (rec) rec.price = proposed;
        row.price = String(proposed ?? '').trim();
        row.proposed_price = null;
        row.price_status = 'verified';
        if (row.decisions) row.decisions.price = 'accept';
        row.manuallyEdited = true;
        affectedSet.add(row.id);
      }
    } else if (field === 'name') {
      undoSnapshot.changes.push({
        id: row.id,
        index,
        field: 'name',
        previousCurrent: row.current_name,
        previousProposed: row.proposed_name,
        previousRec: rec?.name,
        previousDecision: row.decisions?.name
      });
      if (rec) rec.name = proposed;
      row.current_name = proposed;
      row.proposed_name = proposed;
      row.name_source = 'Gemini AI Assistant';
      if (row.decisions) row.decisions.name = 'accept';
      row.manuallyEdited = true;
      affectedSet.add(row.id);
    } else if (field === 'category') {
      undoSnapshot.changes.push({
        id: row.id,
        index,
        field: 'category',
        previousCurrent: row.category,
        previousProposed: row.proposed_category,
        previousRec: rec?.category,
        previousDecision: row.decisions?.category
      });
      if (rec) rec.category = proposed;
      row.category = proposed;
      row.proposed_category = proposed;
      if (row.decisions) row.decisions.category = 'accept';
      row.manuallyEdited = true;
      affectedSet.add(row.id);
    } else if (field === 'barcode') {
      undoSnapshot.changes.push({
        id: row.id,
        index,
        field: 'barcode',
        previousRec: rec?.barcode,
        previousBarcode: row.barcode,
        previousDecision: row.decisions?.barcode
      });
      if (rec) rec.barcode = proposed;
      row.barcode = analyzeBarcode(proposed);
      if (row.decisions) row.decisions.barcode = 'accept';
      row.manuallyEdited = true;
      affectedSet.add(row.id);
    } else {
      // Dynamic support for sku, cost, brand, unit, supplier, etc.
      undoSnapshot.changes.push({
        id: row.id,
        index,
        field,
        previousRec: rec ? rec[field] : undefined,
        previousVal: row[field]
      });
      if (rec) rec[field] = proposed;
      row[field] = proposed;
      row.manuallyEdited = true;
      affectedSet.add(row.id);
    }
  }

  return {
    appliedCount: affectedSet.size,
    affectedIds: Array.from(affectedSet),
    undoSnapshot
  };
}

/**
 * Restores dataset to previous state prior to AI application.
 */
export function revertAiChanges(records = [], rows = [], undoSnapshot) {
  if (!undoSnapshot || !Array.isArray(undoSnapshot.changes)) return 0;
  const rowMap = new Map(rows.map((r, i) => [r.id, { row: r, index: i }]));
  let reverted = 0;

  for (const item of undoSnapshot.changes) {
    const entry = rowMap.get(item.id);
    if (!entry) continue;
    const { row, index } = entry;
    const rec = records[index];

    if (item.field === 'name') {
      if (rec) rec.name = item.previousRec;
      row.current_name = item.previousCurrent;
      row.proposed_name = item.previousProposed;
      if (row.decisions) row.decisions.name = item.previousDecision || 'pending';
      reverted++;
    } else if (item.field === 'category') {
      if (rec) rec.category = item.previousRec;
      row.category = item.previousCurrent;
      row.proposed_category = item.previousProposed;
      if (row.decisions) row.decisions.category = item.previousDecision || 'pending';
      reverted++;
    } else if (item.field === 'barcode') {
      if (rec) rec.barcode = item.previousRec;
      row.barcode = item.previousBarcode;
      if (row.decisions) row.decisions.barcode = item.previousDecision || 'pending';
      reverted++;
    } else if (item.field === 'price') {
      if (rec) rec.price = item.previousRec;
      row.price = item.previousPrice;
      row.proposed_price = null;
      row.price_status = item.previousPriceStatus || 'verified';
      if (row.decisions) row.decisions.price = item.previousPriceDecision || 'accept';
      reverted++;
    } else if (item.field === 'price_proposal') {
      row.proposed_price = item.previousProposedPrice || null;
      row.price_proposal_reason = item.previousPriceReason || null;
      row.price_status = item.previousPriceStatus || 'verified';
      if (row.decisions) row.decisions.price = item.previousPriceDecision || 'pending';
      reverted++;
    } else {
      if (rec) rec[item.field] = item.previousRec;
      row[item.field] = item.previousVal;
      reverted++;
    }
  }

  return reverted;
}

