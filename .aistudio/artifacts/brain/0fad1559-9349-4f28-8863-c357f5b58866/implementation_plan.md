# Grounded Gemini Retail Cleaning Engine with Mandatory Price Approval & Finalization Review

## Summary
Establish Gemini 3.8 Flash with live Google Search grounding as the core inventory cleaning engine for Clover-to-Toast POS migrations, while enforcing strict supervisory controls: **mandatory manual approval for any pricing changes** before committing, **individual row- and field-level acceptance or rejection** of any proposed adjustments, and an explicit **Pre-Export Finalization Review Gate** before generating Toast POS files.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following supervisory safeguards and governance rules are established based on your directive:
> - **Mandatory Manual Approval for Pricing Changes**: Gemini and autopilot can detect pricing errors, audit profit margins, and propose price standardizations, but **pricing changes are NEVER auto-committed**. Every price modification requires explicit operator review and manual approval before being committed to the catalog.
> - **Granular Individual Accept / Reject Controls**: Every single proposed modification (name, category, price, barcode) features individual row-level and field-level "✓ Accept" and "✕ Reject / Revert" buttons, allowing last-minute fine-tuning of each item before finalizing.
> - **Pre-Export Finalization Review Gate**: Before committing and exporting Toast POS files in Step 4, an interactive final review modal/drawer displays all proposed vs. committed values, highlights any unreviewed price proposals or missing prices, and requires explicit operator sign-off.
> - **Live Web Search Grounding (`googleSearch`)**: Server-side Gemini 3.8 Flash uses Google Search grounding to verify unknown barcodes, brand spellings, packaging, and retail MSRPs against live registries online.
> - **Balanced Category Hierarchy**: Standardizes categories into clean, high-performing Toast POS departments (**Beer**, **Wine**, **Spirits**, **RTD (Ready to Drink)**, **Non-Alcoholic Drinks**, **Candy & Snacks**, **Tobacco & Vapes**, and **General Retail**).

---

### 1. Overview & Core Concept

While Gemini provides extraordinary speed and semantic intelligence in cleaning messy Clover catalogs, financial and inventory integrity requires strict human-in-the-loop governance:

1. **Mandatory Manual Price Approval**:
   - Any price change proposed by Gemini (e.g., standardizing `$19.9` → `$19.90`, calculating a price from cost markup, or fixing decimal misplacements) is flagged with an amber **"Pending Price Approval"** badge.
   - Operators can review the wholesale cost, calculated margin, and proposed retail price, then explicitly click "Approve Price" or edit the value manually.
2. **Last-Minute Individual Accept / Reject Controls**:
   - In Step 3 Review and in the AI Diff Drawer, every item row includes granular controls:
     - **Accept Change**: Commits the proposed value to the item and marks it ready for Toast.
     - **Reject / Revert Change**: Immediately discards the proposal and restores the original imported Clover value.
     - **Inline Editing**: Allows immediate custom typing for item name, category, barcode, and price.
3. **Pre-Export Finalization Review Gate**:
   - Positioned between Step 3 (Review) and Step 4 (Export):
   - A comprehensive pre-export checklist summarizes total approved items, items with pending unapproved changes, items missing prices, and items with unpad barcodes.
   - Allows instant resolution before downloading the official Toast Retail CSV or Onboarding Template.
4. **Gemini 3.8 Flash Core Cleaning Backbone**:
   - Processes the full dataset with Google Search grounding.
   - Analyzes barcodes, standardizes bottle sizes and pack specifications (`750ml`, `1.75L`, `12-Pack`), and normalizes brand names into professional retail Title Case.

---

### 2. User Experience & Visual Design

#### End-to-End Workflow & Governance Gates
```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ 1. Upload Clover File   │ ──> │ 2. Smart Autopilot Clean│ ──> │ 3. Confident Review     │ ──> │ 4. Final Review & Export│
│   • Parse .xlsx / .csv  │     │   • Gemini Core Clean   │     │   • Mandatory Price Appr│     │   • Pre-Export Gate     │
│   • Detect Price Status │     │   • Web Search Grounding│     │   • Individual Accept/Rej│    │   • Final Sign-Off      │
│   • Auto-Pad Barcodes   │     │   • Balanced Categories │     │   • Inline Field Editing │    │   • Toast POS CSVs      │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
                                                ▲                                   ▲
                                                │                                   │
                                                └───────────┬───────────────────────┘
                                                            │
                                            ┌──────────────────────────────┐
                                            │ ✨ Gemini AI Copilot (Right)  │
                                            │   • Web Grounded Context     │
                                            │   • Multi-Field AI Proposals │
                                            │   • 1-Click Item Diff Cards  │
                                            │   • Reversible Undo Snapshots│
                                            └──────────────────────────────┘
```

#### Step-by-Step Experience
1. **Step 1 (Upload & Diagnostic Audit)**:
   - Upload Clover file. Diagnostic audit flags items missing prices, missing barcodes, or with non-standard categories.
2. **Step 2 (Gemini Autopilot Cleaning Backbone)**:
   - "🚀 Run Gemini Autopilot Normalization" executes grounded search and category rules.
   - Non-pricing proposals (names, categories, volume formatting) are queued with certainty scores.
   - Pricing proposals are explicitly flagged as **"Pending Manual Review"**.
3. **Step 3 (Confident Review & Mandatory Price Approval)**:
   - **Dedicated Price Filter**: Filter table by `⚠️ Pending Price Approval`, `Flagged for Review`, `Modified Items`, or `All Items`.
   - **Interactive Row Controls**:
     - **Item Name**: Current vs. Proposed with inline input.
     - **Category**: Current vs. Proposed with inline input.
     - **Barcode**: Digit validation and padding status.
     - **Price**: Displays current price, wholesale cost, profit margin (`%`), and proposed price. If modified, displays a prominent amber button: **`✓ Approve Price ($XX.XX)`** alongside **`↩️ Keep Orig Price`**.
     - **Row Actions**: **`✓ Accept All Row Changes`** | **`↩️ Revert Row`**.
4. **Step 4 (Pre-Export Finalization Gate & Toast Handoff)**:
   - Prior to exporting, displays a **"Final Import Quality Audit"**:
     - Verified: 100% Toast-ready items with valid barcodes and confirmed prices.
     - Warnings: Unapproved pricing changes or items without active prices.
     - Option: "Review Unapproved Items" or "Export Verified Items Only".
   - Generates direct Toast Retail CSV (barcode mapped as SKU and Barcode) and Toast Onboarding Template (matching 777 Retail Template).

---

### 3. Key Product Decisions & Trade-Offs

- **Mandatory Manual Approval for Pricing**:
  - *Chosen*: Pricing proposals require explicit operator sign-off before being applied to export rows.
  - *Why*: Retail pricing directly impacts store revenue and margin integrity. Automating pricing changes without human verification poses unnecessary operational risk.
- **Granular Row & Field Acceptance vs. All-or-Nothing Commit**:
  - *Chosen*: Support individual acceptance or rejection of changes on an item-by-item and field-by-field basis.
  - *Why*: Operators frequently want to keep an AI-improved product name while rejecting a proposed category change, or vice versa.
- **Pre-Export Finalization Gate**:
  - *Chosen*: Introduce an explicit final review summary before generating CSV exports.
  - *Why*: Provides the operator with complete confidence that no unexpected changes or missing prices will slip into Toast Web or be handed off to the onboarding consultant.
- **Server-Side Google Search Grounding**:
  - *Chosen*: Enable `googleSearch: {}` on server-side Gemini 3.8 Flash calls.
  - *Why*: Grounds AI recommendations in real-world retail product data, ensuring accurate bottle sizes, packaging counts, and brand spellings.

---

### 4. Technical Architecture & Data Strategy

#### Component Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Browser / Client Application                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  app.js (Workflow Controller)                                               │
│    ├── src/review.js       <── Row decisions (name, category, price, barcode│
│    │                           individual accept/reject/revert handlers)    │
│    ├── src/categories.js   <── Balanced retail taxonomy & local evaluator   │
│    ├── src/barcode.js      <── 13-digit EAN/UPC-A padding & check digit math │
│    ├── src/ai_assistant.js <── Full-catalog dataset mapper, multi-field     │
│    │                           diff preview, applyAiChanges & undo engine   │
│    └── src/toast.js        <── Dual export (Retail Import + Consultant)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /api/ai/format (Full Dataset)
                                       │ POST /api/ai/chat (Full Context)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            Node.js Express Server                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  server.js                                                                  │
│    ├── /api/ai/format <── Gemini batch cleaning with Google Search grounding│
│    ├── /api/ai/chat   <── Unrestricted conversational copilot with grounding│
│    └── @google/genai  <── Gemini 3.8 Flash SDK                              │
│         └── tools: [{ googleSearch: {} }] (Live web search & lookup)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Google Search Grounding                            │
│  • Live web searches for unknown barcodes (UPC-A / EAN-13 registries)        │
│  • Verification of brand spellings, packaging sizes, and retail MSRPs        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Implementation Plan
1. **`src/review.js`**:
   - Update `buildRows` and row decision state:
     - `row.decisions`: `{ name: 'pending', category: 'pending', barcode: 'pending', price: 'pending' }`.
     - `row.proposed_price`: string or null.
     - `row.price_status`: `'verified'` | `'pending_approval'` | `'missing'`.
     - `row.cost`: wholesale cost from Clover.
     - `row.margin`: calculated profit margin `((price - cost) / price) * 100`.
   - Add granular decision functions:
     - `setFieldDecision(rows, id, field, 'accept' | 'reject')`: updates single field decision.
     - `approvePrice(rows, id)`: explicitly approves proposed price and marks `row.decisions.price = 'accept'`.
     - `rejectPrice(rows, id)`: rejects proposed price and restores original Clover price.
     - `revertRowEdit(rows, id)`: restores entire row to initial Clover values.
2. **`src/ai_assistant.js`**:
   - Update `applyAiChanges`:
     - If `field === 'price'`, mark `row.proposed_price = proposed`, set `row.price_status = 'pending_approval'`, and require explicit operator confirmation before updating `row.price`.
     - For `name`, `category`, `barcode`, `cost`, `sku`, `brand`, update proposed values and track in reversible `undoSnapshot`.
   - Update `computeDiffPreview`: include price proposal status and calculated margins.
3. **`server.js`**:
   - Configure `@google/genai` Gemini 3.8 Flash with `tools: [{ googleSearch: {} }]`.
   - System instruction directs Gemini to analyze the complete catalog, verify items online, calculate margins, suggest clean retail names and categories, and output structured proposals.
   - Explicitly instructs Gemini to present price adjustments as proposals for operator approval.
4. **`src/categories.js`**:
   - Balanced category ruleset covering **Beer**, **Wine**, **Spirits**, **RTD (Ready to Drink)**, **Non-Alcoholic Drinks**, **Candy & Snacks**, **Tobacco & Vapes**, and **General Retail**.
5. **Step 3 UI & Pre-Export Quality Gate (`index.html` & `app.js`)**:
   - Step 3 Table: Render individual field accept/reject buttons, price approval button with margin display, and row-level revert.
   - Step 4 Final Review Gate: Display pre-export audit card summarizing total ready items, pending price approvals, and missing prices before download buttons are unlocked.
6. **Testing & Verification**:
   - Add automated test suites in `tests/` verifying mandatory price approval state transitions, individual row/field accept and reject operations, and pre-export readiness checks.
   - Verify that all 73 existing test suites continue to pass.
