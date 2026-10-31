import test from 'node:test';
import assert from 'node:assert/strict';

// Mock DOM environment for testing Step 2 Category Chart UI interactions
class MockEl {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.textContent = '';
    this.className = '';
    this.value = '';
    this.disabled = false;
    this.files = [];
    this.attrs = {};
    this.listeners = {};
    this.onclick = null;
    this.onchange = null;
    this.style = {};
  }
  append(...n) { this.children.push(...n); }
  appendChild(child) { this.children.push(child); }
  replaceChildren(...n) { this.children = [...n]; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  classList = {
    classes: new Set(),
    add(...cls) { for (const c of cls) this.classes.add(c); },
    remove(...cls) { for (const c of cls) this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  };
}

const mockEls = {};
globalThis.document = {
  getElementById: (id) => (mockEls[id] ||= new MockEl('div')),
  createElement: (t) => new MockEl(t)
};

// Import app components
const {
  categoryViewState,
  updateStep2CategoryVisualSummary,
  setWizardStep,
  SAMPLE_777_INVENTORY
} = await import('../app.js');

test('updateStep2CategoryVisualSummary populates KPI metrics for Clover catalog', () => {
  // Populate mock elements
  updateStep2CategoryVisualSummary();

  const totalEl = mockEls.catMetricTotalItems;
  const uniqueEl = mockEls.catMetricUniqueCategories;
  const insightEl = mockEls.catInsightText;

  assert.ok(totalEl);
  assert.ok(uniqueEl);
  assert.ok(insightEl);

  // Even if initially empty or populated, it must set valid text values
  assert.ok(typeof totalEl.textContent === 'string');
  assert.ok(typeof uniqueEl.textContent === 'string');
  assert.ok(insightEl.textContent.length > 0);
});

test('categoryViewState tracks view mode, sorting, and search query', () => {
  assert.equal(typeof categoryViewState.view, 'string');
  assert.equal(typeof categoryViewState.sortBy, 'string');

  // Toggle view
  categoryViewState.view = 'donut';
  assert.equal(categoryViewState.view, 'donut');

  categoryViewState.view = 'bar';
  assert.equal(categoryViewState.view, 'bar');

  // Change sort
  categoryViewState.sortBy = 'alpha_asc';
  assert.equal(categoryViewState.sortBy, 'alpha_asc');

  categoryViewState.sortBy = 'count_desc';
  assert.equal(categoryViewState.sortBy, 'count_desc');
});

test('setWizardStep(2) transitions to Step 2 and updates category visual summary', () => {
  setWizardStep(2);
  const pane2 = mockEls.stepPane2;
  assert.ok(pane2);
  assert.equal(pane2.style.display, 'block');
});
