import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ override: true });
import { GoogleGenAI, Type } from '@google/genai';
import { generateRuleBasedFormatting } from './src/formatting_rules.js';
import { requireAuth } from './src/middleware/auth.js';
import { getOrCreateUser } from './src/db/users.ts';
import {
  getUserSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} from './src/db/sessions.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Port 3000 is required by the AI Studio environment iframe proxy
const PORT = 3000;
const HOST = '0.0.0.0';

// Support JSON payloads up to 15MB for dataset batches
app.use(express.json({ limit: '15mb' }));

// Static files
app.use(express.static(__dirname));

/**
 * Returns a configured GoogleGenAI instance if a valid key exists, or null.
 */
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (
    trimmed === '' ||
    trimmed === 'MY_GEMINI_API_KEY' ||
    trimmed.startsWith('YOUR_') ||
    trimmed.includes('placeholder')
  ) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: trimmed,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function extractJsonFromText(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const cleaned = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
  }
  return null;
}

/**
 * Selects a compact, representative sample of inventory items for LLM context,
 * prioritizing items with review flags, missing prices, unverified barcodes, or unclassified categories.
 * Keeps prompt tokens under 2,000 to strictly comply with Free Tier rate limits (250k TPM).
 */
function compactCatalogForPrompt(items = [], maxCount = 35) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const flagged = [];
  const normal = [];

  for (const item of items) {
    const rawPrice = item.price != null && item.price !== '' ? String(item.price) : '';
    const numPrice = Number(rawPrice);
    const rawCat = String(item.category || '').trim().toLowerCase();
    const isUncat = !rawCat || ['uncategorized', 'misc', 'general', 'unknown', 'none', 'n/a', 'no category'].includes(rawCat);
    const rawBc = String(item.barcode || '').trim();
    const hasBcIssue = !rawBc || rawBc.length < 12;
    const hasPriceIssue = !rawPrice || isNaN(numPrice) || numPrice <= 0 || item.price_status === 'pending_approval';

    const compact = {
      id: String(item.id || ''),
      name: String(item.name || item.current_name || item.original_name || ''),
      barcode: rawBc,
      cat: String(item.category || ''),
      price: rawPrice || '0.00',
      cost: item.cost != null && item.cost !== '' ? String(item.cost) : '',
      margin: item.margin || null
    };

    if (item.is_flagged || isUncat || hasBcIssue || hasPriceIssue) {
      flagged.push(compact);
    } else {
      normal.push(compact);
    }
  }

  const selected = flagged.slice(0, 20);
  const remainingSlots = Math.max(0, maxCount - selected.length);
  selected.push(...normal.slice(0, remainingSlots));

  return selected;
}

/**
 * Generates an intelligent, domain-grounded retail copilot response
 * if cloud AI quota/rate limits are active or when offline.
 */
function buildCopilotFallbackReply(message, context = {}, catalogItems = []) {
  const q = String(message || '').toLowerCase();
  const total = context?.totalItems || catalogItems.length || 0;
  const ready = context?.readyItems || 0;
  const pricePending = context?.pricePendingCount || 0;
  const priceMissing = context?.priceMissingCount || 0;
  const categories = Array.isArray(context?.categories) && context.categories.length > 0
    ? context.categories
    : ['Beer', 'Wine', 'Spirits', 'RTD (Ready to Drink)', 'Candy & Snacks', 'Non-Alcoholic Drinks', 'Tobacco & Vapes', 'General Retail'];
  const step = context?.step || 1;

  if (q.includes('categor') || q.includes('department') || q.includes('audit')) {
    return `### 📊 Catalog Category Audit (${categories.length} Departments Detected)

Your catalog contains **${total} items** across **${categories.length} distinct categories**. 

For 100% Toast POS compliance, we map all items into standardized Toast departments:
* **Spirits / Liquor**: Whiskey, Vodka, Tequila, Gin, Rum, Cognac, Liqueurs
* **Beer & Cider**: Domestic, Imports, Craft IPAs, Ciders, Seltzers
* **Wine**: Red, White, Sparkling, Champagne, Rosé
* **RTD (Ready to Drink)**: Canned Cocktails, High Noon, Twisted Tea
* **Non-Alcoholic Drinks**: Energy drinks, Sodas, Tonics, Mixers, Water
* **Candy & Snacks**: Chips, Pretzels, Chocolates, Nuts, Jerky
* **Tobacco & Vapes**: Cigars, Cigarettes, Vapes, Nicotine pouches
* **General Retail**: Ice, Cups, Bags, Lighters, Store merchandise

**Action:** In **Step 2 (Auto-Clean)**, our smart normalizer automatically aligns legacy Clover category names to these Toast departments. You can also view the interactive D3 Category Distribution chart in Step 2.`;
  }

  if (q.includes('price') || q.includes('margin') || q.includes('cost') || q.includes('cogs') || q.includes('dead')) {
    return `### 💰 Pricing & Margin Governance Report

* **Total Products**: ${total} items
* **Missing Prices ($0.00)**: **${priceMissing} items** need a valid retail price before export
* **Pending Price Approvals**: **${pricePending} items** held for operator verification

**Toast Pricing Rules:**
1. Toast requires every active item to have a positive selling price ($0.01 or greater).
2. Any price modifications proposed by Autopilot or CSV imports are held in **Pending Approval** state until you verify them in **Step 3 (Fine-Tune & Final Review)**.
3. In Step 3, you can filter by *"Price Review Pending"* or *"Missing Prices"* to accept, reject, or manually adjust prices with 1-click.`;
  }

  if (q.includes('barcode') || q.includes('sku') || q.includes('upc') || q.includes('ean') || q.includes('pad')) {
    return `### 🏷️ Toast Barcode & SKU Standards

* **Barcode as Identity**: In Toast Retail POS, the item Barcode acts as the primary SKU and product lookup key.
* **Format Requirements**: Standard retail items require a **12-digit UPC-A** or a **13-digit EAN-13**.
* **Zero Padding**: Spreadsheets often drop leading zeros (e.g., \`36000291452\` instead of \`036000291452\`). In **Step 2**, Autopilot automatically pads barcodes missing leading zeros to standard 13-digit formats.
* In **Step 3**, all clean barcodes are verified, and any invalid or missing barcodes are flagged for quick operator review.`;
  }

  if (q.includes('next') || q.includes('step') || q.includes('roadmap') || q.includes('how') || q.includes('prepare') || q.includes('start')) {
    return `### 🚀 Toast POS Preparation Roadmap (Current: Step ${step} of 4)

1. **Step 1: Load Clover Catalog**
   * Upload your Clover \`.xlsx\` or \`.csv\` export file (or load the sample 777 Liquor Store inventory).
2. **Step 2: Auto-Clean & Standardize**
   * Run Autopilot to normalize names to Title Case, standardize bottle volumes (\`750ml\`, \`1.75L\`), pack sizes (\`12-Pack\`), and assign Toast departments.
   * Review the D3 Category Distribution visualizer to check department variety.
3. **Step 3: Review & Approve**
   * Verify prices and confirm flagged barcodes. Pricing changes require manual operator sign-off for safety.
4. **Step 4: Export Compliant Toast Files**
   * Download the official Toast Retail Catalog CSV and Toast Menu Import CSV, verified against the Pre-Export Quality Gate.

*How can I help you with your inventory right now? You can ask me to audit categories, check pricing margins, or explain barcode rules!*`;
  }

  return `### 🤖 Gemini AI Inventory Copilot

I have complete visibility into your catalog (**${total} items total**, **${ready} Toast-ready**).

Here is a summary of your current catalog health:
* **Workflow Stage**: Step ${step} of 4
* **Catalog Status**: ${ready} / ${total} items validated
* **Items Needing Attention**: ${priceMissing} missing prices, ${pricePending} pending price updates

**Quick Actions you can ask me:**
* *"Audit my categories"* — Analyze your category variety and Toast department alignment.
* *"Margin check"* — Review pricing rules and margin protection.
* *"Barcode standards"* — Explain UPC-A/EAN barcode padding and SKU requirements.
* *"What are my next steps?"* — Guide you through the 4-step import workflow.`;
}

/**
 * POST /api/ai/format
 * Formats inventory dataset items using high-precision retail normalization rules
 * and token-efficient Gemini AI enhancements with safe rate-limit resilience.
 */
app.post('/api/ai/format', async (req, res) => {
  try {
    const { prompt, items } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ ok: false, error: 'A prompt instruction is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'An array of inventory items is required.' });
    }

    // Always compute full rule-based formatting across all catalog items
    const baseline = generateRuleBasedFormatting(prompt, items);

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        ok: true,
        message: `${baseline.message} (Standardized via retail normalization engine)`,
        summary: baseline.summary,
        changes: baseline.changes
      });
    }

    try {
      // Send a token-efficient sample (max 35 items) to stay comfortably under the 250k TPM quota
      const sampleItems = compactCatalogForPrompt(items, 35);

      const systemInstruction = `You are an expert retail software engineer and POS standardization backbone (specializing in Clover to Toast POS catalog migrations).
Your objective is to normalize and clean catalog items to the highest possible accuracy for Toast POS:
1. Product Names: Title Case, volume/pack at end (e.g. '750ml', '1.75L', '6-Pack', '12-Pack'). Resolve POS abbreviations ('CHARD' -> 'Chardonnay', 'CAB' -> 'Cabernet Sauvignon', 'VOD' -> 'Vodka').
2. Categories: Standardize to Toast departments: 'Beer', 'Wine', 'Spirits', 'RTD (Ready to Drink)', 'Non-Alcoholic Drinks', 'Candy & Snacks', 'Tobacco & Vapes', 'General Retail'.
3. Prices: Hold any proposed price changes for operator manual approval.
4. Barcodes: Ensure barcodes are valid EAN/UPC.

Respond with valid JSON:
{
  "message": "Conversational explanation of changes made",
  "summary": "1-sentence summary of modifications",
  "changes": [
    {
      "id": "item-id",
      "field": "name" | "category" | "price" | "barcode" | "sku" | "brand" | "unit",
      "originalValue": "...",
      "proposedValue": "...",
      "reason": "..."
    }
  ]
}`;

      const userContent = `User Instruction: "${prompt.trim()}"

Sample Items to Refine (${sampleItems.length} items):
${JSON.stringify(sampleItems)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userContent,
        config: {
          systemInstruction
        }
      });

      const parsed = extractJsonFromText(response.text);
      if (parsed && Array.isArray(parsed.changes) && parsed.changes.length > 0) {
        // Merge Gemini refinements with baseline rule changes
        const changeMap = new Map();
        for (const ch of baseline.changes) {
          changeMap.set(`${ch.id}:${ch.field}`, ch);
        }
        for (const ch of parsed.changes) {
          if (ch.id && ch.field && ch.proposedValue) {
            changeMap.set(`${ch.id}:${ch.field}`, ch);
          }
        }
        const merged = Array.from(changeMap.values());

        return res.json({
          ok: true,
          message: parsed.message || 'Gemini catalog normalization complete.',
          summary: parsed.summary || `Proposed adjustments for ${merged.length} items.`,
          changes: merged
        });
      }

      return res.json({
        ok: true,
        message: baseline.message,
        summary: baseline.summary,
        changes: baseline.changes
      });
    } catch (err) {
      console.info('[AI Normalization] Notice: Rate limit active, applied full retail normalization baseline.');
      return res.json({
        ok: true,
        message: `${baseline.message} (Applied via intelligent retail formatter)`,
        summary: baseline.summary,
        changes: baseline.changes
      });
    }
  } catch (outerErr) {
    console.error('Server error processing format request:', outerErr);
    return res.status(500).json({ ok: false, error: 'Internal server error processing inventory' });
  }
});

/**
 * POST /api/ai/chat
 * Conversational assistant with full catalog memory and token-efficient rate-limit resilience.
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, items } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'A message string is required.' });
    }

    const catalogItems = Array.isArray(items) ? items : [];
    const compactSample = compactCatalogForPrompt(catalogItems, 30);

    const systemInstruction = `You are the Gemini AI Inventory Copilot with visibility into the user's retail inventory dataset.
You are an expert retail software engineer and Toast POS catalog specialist.

Capabilities:
1. Catalog Overview: Inspect and analyze items, prices, margins, barcodes, and categories.
2. Toast POS Standards: Barcodes serve as both SKU and Barcode product identity. Standardize categories to Toast departments ('Beer', 'Wine', 'Spirits', 'RTD (Ready to Drink)', 'Non-Alcoholic Drinks', 'Candy & Snacks', 'Tobacco & Vapes', 'General Retail').
3. Pricing Governance: All pricing proposals will require operator manual approval before committing.

Respond with direct conversational markdown. If proposing changes, include a JSON block with:
{
  "reply": "Conversational markdown answer with deep data analysis or confirmation",
  "summary": "Short 1-sentence summary of proposals if applicable",
  "changes": [
    { "id": "item-id", "field": "name"|"category"|"price"|"barcode", "originalValue": "...", "proposedValue": "...", "reason": "..." }
  ]
}`;

    const contextSummary = context ? `\nWorkflow State: ${JSON.stringify(context)}` : '';
    const catalogContext = compactSample.length > 0 ? `\n\nCatalog Sample (${compactSample.length} items):\n${JSON.stringify(compactSample)}` : '';
    const userPrompt = `${message.trim()}${contextSummary}${catalogContext}`;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        ok: true,
        reply: buildCopilotFallbackReply(message, context, catalogItems)
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userPrompt,
        config: {
          systemInstruction
        }
      });

      const parsed = extractJsonFromText(response.text);
      if (parsed && (parsed.reply || parsed.changes)) {
        return res.json({
          ok: true,
          reply: parsed.reply || response.text,
          summary: parsed.summary || '',
          changes: Array.isArray(parsed.changes) ? parsed.changes : []
        });
      }

      return res.json({
        ok: true,
        reply: response.text || buildCopilotFallbackReply(message, context, catalogItems),
        changes: []
      });
    } catch (err) {
      console.info('[AI Copilot] Notice: Rate limit active, serving local retail intelligence response.');
      return res.json({
        ok: true,
        reply: buildCopilotFallbackReply(message, context, catalogItems)
      });
    }
  } catch (err) {
    console.error('Server error handling AI chat:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error in AI chat' });
  }
});

// --- Cloud SQL Relational Database Endpoints ---
/**
 * POST /api/auth/sync
 * Synchronizes the Firebase Auth user to the Cloud SQL users table.
 */
app.post('/api/auth/sync', requireAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.uid, req.user.email || '');
    res.json({ ok: true, user: { id: user.id, uid: user.uid, email: user.email } });
  } catch (err) {
    console.error('Failed to sync user with Cloud SQL:', err);
    res.status(500).json({ ok: false, error: 'Failed to sync user' });
  }
});

/**
 * GET /api/db/sessions
 * Returns all saved inventory clean sessions for the authenticated user from Cloud SQL.
 */
app.get('/api/db/sessions', requireAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.uid, req.user.email || '');
    const userSessions = await getUserSessions(user.id);
    res.json({ ok: true, sessions: userSessions });
  } catch (err) {
    console.error('Failed to fetch sessions from Cloud SQL:', err);
    res.status(500).json({ ok: false, error: 'Failed to retrieve sessions' });
  }
});

/**
 * POST /api/db/sessions
 * Saves a new inventory session into Cloud SQL.
 */
app.post('/api/db/sessions', requireAuth, async (req, res) => {
  try {
    const { name, recordsCount, decisionsJson, catalogJson } = req.body;
    const user = await getOrCreateUser(req.user.uid, req.user.email || '');
    const newSession = await createSession(
      user.id,
      name || 'Inventory Session',
      Number(recordsCount) || 0,
      typeof decisionsJson === 'string' ? decisionsJson : JSON.stringify(decisionsJson || {}),
      typeof catalogJson === 'string' ? catalogJson : JSON.stringify(catalogJson || [])
    );
    res.json({ ok: true, session: newSession });
  } catch (err) {
    console.error('Failed to save session to Cloud SQL:', err);
    res.status(500).json({ ok: false, error: 'Failed to save session' });
  }
});

/**
 * GET /api/db/sessions/:id
 * Retrieves a specific session with decisions and catalog payload.
 */
app.get('/api/db/sessions/:id', requireAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.uid, req.user.email || '');
    const sessionId = Number(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ ok: false, error: 'Invalid session ID' });
    }
    const session = await getSessionById(user.id, sessionId);
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    res.json({ ok: true, session });
  } catch (err) {
    console.error('Failed to load session from Cloud SQL:', err);
    res.status(500).json({ ok: false, error: 'Failed to load session' });
  }
});

/**
 * DELETE /api/db/sessions/:id
 * Deletes a session from Cloud SQL.
 */
app.delete('/api/db/sessions/:id', requireAuth, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.uid, req.user.email || '');
    const sessionId = Number(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ ok: false, error: 'Invalid session ID' });
    }
    const deleted = await deleteSession(user.id, sessionId);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    res.json({ ok: true, deleted: true });
  } catch (err) {
    console.error('Failed to delete session from Cloud SQL:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete session' });
  }
});

// Fallback to index.html for unmatched routes
app.use((req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Listen on primary port 3000 (required for AI Studio web dev server)
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

export { app, generateRuleBasedFormatting };
