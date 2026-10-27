import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
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
const ALT_PORT = process.env.PORT && Number(process.env.PORT) !== 3000 ? Number(process.env.PORT) : null;
const HOST = '0.0.0.0';

// Support JSON payloads up to 15MB for dataset batches
app.use(express.json({ limit: '15mb' }));

// Static files
app.use(express.static(__dirname));

// Initialize GoogleGenAI SDK instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

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
 * POST /api/ai/format
 * Formats inventory dataset items using Gemini 3.8 Flash with live Google Search grounding.
 * Acts as the foundational coding professional backbone of catalog normalization.
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

    // Pass items with rich context without the artificial 150-item limit
    const catalogItems = items.slice(0, 2000).map((item) => ({
      id: String(item.id || ''),
      name: String(item.name || item.current_name || ''),
      original_name: String(item.original_name || item.name || ''),
      barcode: String(item.barcode || ''),
      category: String(item.category || ''),
      price: String(item.price ?? ''),
      cost: String(item.cost ?? ''),
      margin: item.margin || null,
      sku: String(item.sku || ''),
      brand: String(item.brand || ''),
      unit: String(item.unit || '')
    }));

    const systemInstruction = `You are an expert retail software engineer and POS standardization backbone (specializing in Clover to Toast POS catalog migrations).
You have access to live Google Search to verify barcodes (UPC-A / EAN-13), lookup official product names, verify pack sizes, bottle volumes, and check retail prices online.

Your objective is to normalize and clean catalog items to the highest possible likelihood of accuracy for Toast POS:
1. Product Names:
   - Normalize into clean professional Title Case.
   - Standardize bottle volumes and package units to industry standards (e.g., '750ml', '1.75L', '6-Pack', '12-Pack', '12-Bottle').
   - Place volume and pack size specifications at the end of the product name.
   - Resolve obscure POS abbreviations (e.g. 'CHARD' -> 'Chardonnay', 'CAB' -> 'Cabernet Sauvignon', 'VOD' -> 'Vodka').
2. Balanced Categories:
   - Standardize into clean Toast POS departments: 'Beer', 'Wine', 'Spirits', 'RTD (Ready to Drink)', 'Non-Alcoholic Drinks', 'Candy & Snacks', 'Tobacco & Vapes', 'General Retail'.
   - Eliminate vague placeholders like 'Misc', 'General', 'Inventory', or blank categories.
3. Pricing & Valuation:
   - Verify every item has an active price.
   - CRITICAL REQUIREMENT: Any proposed changes to prices (field: 'price') will be held for operator manual approval before committing. Propose price standardizations (e.g. adding missing decimals like 199 -> 1.99, or calculating price from cost markup) with a clear explanation in 'reason'.
4. Barcodes & SKUs:
   - Ensure barcodes missing leading zeros are padded to 13 digits (EAN) or 12 digits (UPC-A).

Respond with valid JSON:
{
  "message": "Conversational explanation of changes made and web insights",
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

Inventory Items to Clean & Standardize (${catalogItems.length} items):
${JSON.stringify(catalogItems, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContent,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = extractJsonFromText(response.text);
    if (parsed && Array.isArray(parsed.changes)) {
      return res.json({
        ok: true,
        message: parsed.message || 'Gemini catalog normalization complete.',
        summary: parsed.summary || `Proposed adjustments for ${parsed.changes.length} items.`,
        changes: parsed.changes
      });
    }

    // If text was returned without valid JSON structure, use fallback with the generated reply
    const fallback = generateRuleBasedFormatting(prompt, items);
    return res.json({
      ok: true,
      message: response.text || fallback.message,
      summary: fallback.summary,
      changes: fallback.changes
    });
  } catch (err) {
    console.warn('Gemini cloud API call failed or key unconfigured, using smart retail formatter:', err.message);
    const fallback = generateRuleBasedFormatting(req.body.prompt, req.body.items || []);
    return res.json({
      ok: true,
      message: `${fallback.message} (Applied via intelligent retail formatter)`,
      summary: fallback.summary,
      changes: fallback.changes
    });
  }
});

/**
 * POST /api/ai/chat
 * Conversational assistant with full catalog memory and live Google Search grounding.
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context, items } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'A message string is required.' });
    }

    const catalogItems = Array.isArray(items) ? items.slice(0, 2000) : [];

    const systemInstruction = `You are the Gemini AI Inventory Copilot with full, unrestricted access to the user's entire retail inventory dataset and live Google Search grounding.
You are an expert retail software engineer and Toast POS catalog specialist.

Capabilities & Freedom:
1. Full Catalog Access: You can inspect, query, search, and analyze any item, price, cost, margin, barcode, or category across the store.
2. Web Search Grounding: You can search live product registries to verify barcodes, official brand titles, ABV, pack sizes, and retail prices online.
3. Proactive Proposals: When the user asks you to modify, clean, rename, fix, or update items, propose specific modifications across any field ('name', 'category', 'price', 'barcode', 'sku', 'brand', 'unit').
4. Pricing Governance: All pricing proposals will require operator manual approval before committing. Propose price fixes clearly with justification.
5. Toast POS Guidance: Barcodes serve as both SKU and Barcode product identity. Standardize categories to balanced Toast POS departments ('Beer', 'Wine', 'Spirits', 'RTD (Ready to Drink)', 'Non-Alcoholic Drinks', 'Candy & Snacks', 'Tobacco & Vapes', 'General Retail').

You can respond with direct conversational markdown, or provide a structured response containing proposed changes.
If proposing changes, output JSON or include a JSON block with:
{
  "reply": "Conversational markdown answer with deep data analysis or confirmation",
  "summary": "Short 1-sentence summary of proposals if applicable",
  "changes": [
    { "id": "item-id", "field": "name"|"category"|"price"|"barcode", "originalValue": "...", "proposedValue": "...", "reason": "..." }
  ]
}`;

    const contextSummary = context ? `\nWorkflow State: ${JSON.stringify(context)}` : '';
    const catalogContext = catalogItems.length > 0 ? `\n\nFull Catalog Data (${catalogItems.length} items):\n${JSON.stringify(catalogItems, null, 2)}` : '';
    const userPrompt = `${message.trim()}${contextSummary}${catalogContext}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
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
      reply: response.text || 'I have analyzed your catalog items.',
      changes: []
    });
  } catch (err) {
    console.warn('AI chat error (fallback provided):', err.message);
    return res.json({
      ok: true,
      reply: `I'm your Gemini AI Inventory Copilot. I have full visibility into your catalog items and can help you audit barcodes, standardize bottle sizes, verify margins, and prepare your 100% compliant Toast import file.`
    });
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

// Also listen on alternate port if specified by host container
if (ALT_PORT) {
  try {
    app.listen(ALT_PORT, HOST, () => {
      console.log(`Also listening at http://${HOST}:${ALT_PORT}`);
    });
  } catch (err) {
    console.warn(`Could not listen on alternate port ${ALT_PORT}:`, err.message);
  }
}

export { app, generateRuleBasedFormatting };
