# Google Drive Inventory Import & Avery Inkjet Price Tag Label Printing Studio

## Summary
Add a direct **Import from Google Drive** feature with a full folder navigation tree in Step 1, and introduce a dedicated **Avery Price Tag & Sticker Label Printing Studio** widget at the end of the page. The label studio delivers exact physical dimensions, margins, and pitches for the comprehensive Avery inkjet template catalog, rendering high-contrast price tags with company brand logos on the left, standardized product names with volumes, and prominent bold retail prices.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions and user preferences are confirmed based on your specifications:
> - **Google Drive Folder Navigation Tree**: Step 1 includes a dedicated "Import from Google Drive" action that opens a full folder navigation modal. Users can traverse their Google Drive folders with breadcrumbs, view CSV, XLSX, and Google Sheets files with modified dates, and import files into the catalog cleaning pipeline in one click.
> - **Comprehensive Avery Inkjet Template Catalog**: The template selector provides exact Avery original specifications for all standard inkjet label sheet formats:
>   - **Avery 5160 / 8160 / 94200**: Standard retail price tag & barcode label (30/sheet, 3×10, 2⅝″ × 1″)
>   - **Avery 5161 / 8161**: Wide address & price sticker (20/sheet, 2×10, 4″ × 1″)
>   - **Avery 5162 / 8162**: Medium shelf tag & bottle label (14/sheet, 2×7, 4″ × 1⅓″)
>   - **Avery 5163 / 8163**: Large product & shipping tag (10/sheet, 2×5, 4″ × 2″)
>   - **Avery 5164 / 8164**: Extra-large bin & box placard (6/sheet, 2×3, 4″ × 3⅓″)
>   - **Avery 5167 / 8167 / 94203**: Slim return address / bottle neck tag (80/sheet, 4×20, 1¾″ × ½″)
>   - **Avery 22806**: Square retail sticker (12/sheet, 3×4, 2″ × 2″)
>   - **Avery 22807**: Round retail sticker (12/sheet, 3×4, 2″ diameter)
>   - **Avery 5165 / 8165**: Full sheet retail sign / manifest (1/sheet, 1×1, 8.5″ × 11″)
> - **Price Sticker Layout & Branding**: Each sticker features the **company brand logo large on the left**, followed by the **standardized product name with volume** (e.g., `11oz`, `1 L`, `750ml`), and a **large bold price** on the right/bottom for immediate customer legibility.
> - **Partially Used Sheet Recovery (Start Label Offset)**: Operators can pick a starting label slot (1 to N) so partially used sticker sheets are never wasted.

---

### 1. Overview & Core Concept

1. **Google Drive Cloud Integration**:
   - Allows users whose inventory files reside on Google Drive or shared drives to import them directly without downloading them locally first.
   - Uses Firebase Google Authentication and Google Drive API (`drive.readonly` and `spreadsheets.readonly`).
   - Supports Google Drive files (.csv, .xlsx, and native Google Sheets converted to CSV on the fly).
2. **Avery Price Tag & Sticker Label Printing Studio**:
   - Located at the end of the page as a dedicated workspace module (Step 6 / Print Studio).
   - Automatically synchronizes with current inventory data (both original imported items and cleaned/approved catalog items).
   - Implements pixel- and millimeter-precise Avery sheet geometry via CSS `@media print` and `@page` rules, ensuring 100% true-to-scale alignment on standard inkjet printers without "Fit to Page" scaling distortion.
   - Includes custom company logo upload with live preview and persistent client-side storage.

---

### 2. User Experience & Visual Design

#### Visual Layout & Section Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 1: Upload Inventory or Import from Cloud                               │
│  [ Choose File / Drag & Drop ]    [ 📁 Import from Google Drive ]          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ (Steps 2–5: Clean, Review, Toast Export)
                                       │
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 6: Avery Price Tag & Sticker Label Printing Studio                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌───────────────────────┐ │
│ │ 1. Label Template    │ │ 2. Store Brand Logo  │ │ 3. Print Controls     │ │
│ │ [ Avery 5160 (30/sh)▼] │ [ Upload Logo / Reset] │ Filter: [All Approved▼]│ │
│ │ 2-5/8" x 1" (3x10)   │ Logo Preview: [ 🏪 ]   │ Start Slot: [ 1 ] (1-30)│ │
│ └──────────────────────┘ └──────────────────────┘ [ 🖨️ Print Labels ]     │ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Live Interactive Sheet Preview (US Letter 8.5" x 11" Actual Proportion)     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │ │
│ │ │ [LOGO] Name 11oz │  │ [LOGO] Name 1 L  │  │ [LOGO] Name 750ml│        │ │
│ │ │        $14.99    │  │        $29.99    │  │        $19.99    │        │ │
│ │ └──────────────────┘  └──────────────────┘  └──────────────────┘        │ │
│ │  ... (Exact 3x10 grid with physical Avery margins and pitches)          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed User Flows

1. **Google Drive Import Flow**:
   - User clicks **"Import from Google Drive"** in Step 1.
   - If not signed in with Google, initiates Firebase Google Auth popup with `drive.readonly` and `spreadsheets.readonly` scopes.
   - The **Google Drive Navigation Tree** modal opens:
     - Top breadcrumbs bar shows current folder path: `My Drive > Retail Files > 2026 Inventory`.
     - Left/main tree view renders subfolders with folder icons and file items with icons (.csv, .xlsx, Google Sheets).
     - Selecting a folder navigates deeper; clicking "Up / Root" navigates back.
     - Clicking an inventory file shows a 1-click **"Load Inventory File"** action.
     - For Google Sheets, exports data using the Sheets API; for CSV/XLSX, downloads content via Drive media endpoint and feeds directly into the CSV/Excel parser.
     - Modal closes automatically, and catalog statistics populate Step 1.

2. **Avery Price Tag Label Printing Flow**:
   - User navigates to the **Avery Price Tag Label Studio** at the end of the page.
   - **Template Selection**: User selects an Avery code from the comprehensive dropdown. The preview immediately updates to the exact grid layout (columns, rows, margins, and label dimensions).
   - **Company Logo**: User can upload their store/brand logo (PNG/SVG/JPG) or use the preset default. The logo renders prominently on the left of every label.
   - **Item Filtering & Quantity**: User can filter by category (e.g. `Beer`, `Wine`, `Spirits`), choose to print only approved items or flagged items, and set copies per item (default 1).
   - **Start Slot Offset**: If the user has a partially used sheet (e.g., 5 labels previously peeled), they enter `6` in the start offset field. Slots 1–5 render as empty outlines on the preview and print sheet.
   - **Print Execution**: Clicking **"Print Price Labels"** opens the browser print dialog with `@page { size: letter portrait; margin: 0; }`. All UI chrome is hidden, and only the exact label sheet prints at 100% scale.

---

### 3. Key Product Decisions & Trade-Offs

- **Exact CSS Physical Print Engine vs. Heavy PDF Library (jsPDF)**:
  - *Chosen*: Native CSS `@media print` with exact physical dimensions in inches (`in`), millimeters (`mm`), and CSS grid geometry.
  - *Why*: Eliminates large client-side PDF rendering dependencies, delivers crisp vector typography and SVG logos at native printer DPI, and offers instant WYSIWYG screen preview without waiting for PDF compilation.
- **Starting Slot Offset for Partial Sheets**:
  - *Chosen*: Provide a starting position selector (`1` to `Total Labels`).
  - *Why*: Label sheets are expensive; operators frequently print small batches (e.g., 5 new shelf tags) and need to reuse the remaining labels on the sheet without paper jams or waste.
- **Company Logo on Left with Proportional Typography**:
  - *Chosen*: Fixed left column for logo with `object-fit: contain` and auto-proportioned right column for product name, volume, and large price.
  - *Why*: Satisfies the user's explicit design requirement (`Item brand logo large on the left. product name with volume. Large price`) across all label sizes, adapting font size dynamically for ultra-compact labels (5167) versus large shipping/shelf tags (5163).
- **Drive Tree Navigation with In-App Modal**:
  - *Chosen*: In-app breadcrumb folder explorer powered by Google Drive REST API.
  - *Why*: Provides a seamless, branded experience without iframe popup restrictions, allowing rapid folder browsing and instant preview of compatible inventory spreadsheets.

---

### 4. Technical Architecture & Data Strategy

#### System Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Browser UI (Single Page App)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  app.js (Workflow Controller)                                               │
│    ├── src/workspace.js                                                     │
│    │     ├── listDriveFoldersAndFiles(accessToken, folderId)                │
│    │     ├── fetchDriveFileContent(accessToken, fileId, mimeType)           │
│    │     └── renderDriveFolderTreeModal()                                   │
│    ├── src/avery_templates.js                                               │
│    │     ├── AVERY_TEMPLATES (5160, 5161, 5162, 5163, 5164, 5167, etc.)     │
│    │     ├── calculateAveryLayout(templateId, startSlot, items)             │
│    │     └── renderAverySheetHtml(template, slots, logoUrl)                 │
│    └── src/firebase.js                                                      │
│          └── GoogleAuthProvider with drive.readonly & spreadsheets.readonly │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Authorized Bearer Token
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Google Workspace Cloud APIs                           │
│  • Google Drive API v3: /drive/v3/files (list folders & files, download)   │
│  • Google Sheets API v4: /spreadsheets/v4/values (export sheet as CSV)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Avery Template Specifications Model (`src/avery_templates.js`)

```javascript
export const AVERY_TEMPLATES = {
  '5160': {
    code: '5160',
    alias: '8160 / 94200',
    description: 'Standard Address & Retail Price Tag',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 2.625,
    labelHeight: 1.0,
    columns: 3,
    rows: 10,
    labelsPerSheet: 30,
    topMargin: 0.5,
    leftMargin: 0.1875,
    horizontalPitch: 2.75,
    verticalPitch: 1.0,
    shape: 'rectangle',
    fontSize: { name: '10pt', volume: '9pt', price: '14pt' }
  },
  '5161': {
    code: '5161',
    alias: '8161',
    description: 'Wide Address & Shelf Tag',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 4.0,
    labelHeight: 1.0,
    columns: 2,
    rows: 10,
    labelsPerSheet: 20,
    topMargin: 0.5,
    leftMargin: 0.156,
    horizontalPitch: 4.25,
    verticalPitch: 1.0,
    shape: 'rectangle',
    fontSize: { name: '11pt', volume: '10pt', price: '16pt' }
  },
  '5162': {
    code: '5162',
    alias: '8162',
    description: 'Medium Shipping & Shelf Tag',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 4.0,
    labelHeight: 1.333,
    columns: 2,
    rows: 7,
    labelsPerSheet: 14,
    topMargin: 0.833,
    leftMargin: 0.156,
    horizontalPitch: 4.1875,
    verticalPitch: 1.333,
    shape: 'rectangle',
    fontSize: { name: '12pt', volume: '10pt', price: '18pt' }
  },
  '5163': {
    code: '5163',
    alias: '8163',
    description: 'Large Shipping & Product Tag',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 4.0,
    labelHeight: 2.0,
    columns: 2,
    rows: 5,
    labelsPerSheet: 10,
    topMargin: 0.5,
    leftMargin: 0.156,
    horizontalPitch: 4.1875,
    verticalPitch: 2.0,
    shape: 'rectangle',
    fontSize: { name: '14pt', volume: '12pt', price: '24pt' }
  },
  '5164': {
    code: '5164',
    alias: '8164',
    description: 'Extra-Large Shipping & Box Placard',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 4.0,
    labelHeight: 3.333,
    columns: 2,
    rows: 3,
    labelsPerSheet: 6,
    topMargin: 0.5,
    leftMargin: 0.156,
    horizontalPitch: 4.1875,
    verticalPitch: 3.333,
    shape: 'rectangle',
    fontSize: { name: '18pt', volume: '14pt', price: '32pt' }
  },
  '5167': {
    code: '5167',
    alias: '8167 / 94203',
    description: 'Compact Return Address & Slim Tag',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 1.75,
    labelHeight: 0.5,
    columns: 4,
    rows: 20,
    labelsPerSheet: 80,
    topMargin: 0.5,
    leftMargin: 0.281,
    horizontalPitch: 2.062,
    verticalPitch: 0.5,
    shape: 'rectangle',
    fontSize: { name: '7pt', volume: '6pt', price: '9pt' }
  },
  '22806': {
    code: '22806',
    alias: 'Square 2"x2"',
    description: 'Square Print-to-the-Edge Sticker',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 2.0,
    labelHeight: 2.0,
    columns: 3,
    rows: 4,
    labelsPerSheet: 12,
    topMargin: 0.75,
    leftMargin: 0.625,
    horizontalPitch: 2.625,
    verticalPitch: 2.50,
    shape: 'square',
    fontSize: { name: '12pt', volume: '10pt', price: '20pt' }
  },
  '22807': {
    code: '22807',
    alias: 'Round 2" Diameter',
    description: 'Round Print-to-the-Edge Sticker',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 2.0,
    labelHeight: 2.0,
    columns: 3,
    rows: 4,
    labelsPerSheet: 12,
    topMargin: 0.75,
    leftMargin: 0.625,
    horizontalPitch: 2.625,
    verticalPitch: 2.50,
    shape: 'round',
    fontSize: { name: '11pt', volume: '9pt', price: '18pt' }
  },
  '5165': {
    code: '5165',
    alias: '8165 / Full Sheet',
    description: 'Full Page Sign & Manifest',
    paperSize: 'letter',
    sheetWidth: 8.5,
    sheetHeight: 11.0,
    labelWidth: 8.5,
    labelHeight: 11.0,
    columns: 1,
    rows: 1,
    labelsPerSheet: 1,
    topMargin: 0.0,
    leftMargin: 0.0,
    horizontalPitch: 8.5,
    verticalPitch: 11.0,
    shape: 'rectangle',
    fontSize: { name: '28pt', volume: '20pt', price: '48pt' }
  }
};
```

#### Detailed Execution Steps
1. **Google Drive Integration**:
   - Update `src/workspace.js`:
     - Implement `listDriveFolderContents(accessToken, folderId = 'root')` to query files and subfolders with pagination.
     - Implement `downloadDriveSpreadsheetOrCsv(accessToken, file)` to handle both binary files (XLSX, CSV) and Google Sheets.
   - Update `index.html`:
     - Add the "Import from Google Drive" button in the Step 1 upload zone.
     - Add the Google Drive Folder Explorer modal with breadcrumbs, search filter, and list view.
   - Update `app.js`:
     - Wire Google Sign-In and folder navigation handlers.
     - Handle file selection, parse the incoming file, and update `S.records` and `S.rows`.
2. **Avery Price Tag Label Studio Widget**:
   - Create `src/avery_templates.js` defining all Avery inkjet templates, sheet geometry, and layout generation.
   - Add Step 6 markup to `index.html` at the end of the page:
     - Template dropdown with Avery specifications.
     - Store logo uploader (file input, live preview, preset selector).
     - Filter controls (category, approved status, search term).
     - Starting label slot selector (1 to N) and copies-per-item control.
     - Live interactive print preview container.
     - "Print Price Labels" primary button.
   - Add printing styles to `style.css`:
     - `@media print` rules setting `@page { size: letter portrait; margin: 0; }`.
     - Exact label container grids using template-defined inches and millimeters.
     - High-contrast typography optimized for 300/600 DPI inkjet printers.
3. **Automated Verification & Tests**:
   - Add unit tests in `tests/avery_templates.test.js` verifying:
     - Dimension calculations and slot mapping for all Avery template codes.
     - Start offset behavior (slot 1 vs slot 5).
     - Label content scaling and volume formatting extraction.
     - Drive folder listing and response parsing.
   - Run `npm test`, `lint_applet`, and verify end-to-end.
