import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "infinite-lacing-b01dl",
  appId: "1:73867399145:web:dca496c6c07ee858ef0578",
  apiKey: "AIzaSyAdvYVYf4TM7X-olVKt7_ikc5VWQQM6TrE",
  authDomain: "infinite-lacing-b01dl.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-cloneclovertoast-0fad1559-9349-4f28-8863-c357f5b58866",
  storageBucket: "infinite-lacing-b01dl.firebasestorage.app",
  messagingSenderId: "73867399145",
  measurementId: "",
  oAuthClientId: "73867399145-7bs4lk0nsupbf07a5njq7h0sk6tuom7n.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const user = auth?.currentUser;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId ?? null,
      providerInfo: user?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on initial boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

import { WORKSPACE_SCOPES } from './workspace.js';

let cachedAccessToken = null;

export function getAccessToken() {
  return cachedAccessToken;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  for (const s of WORKSPACE_SCOPES) {
    provider.addScope(s);
  }
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(cred);
  if (credential?.accessToken) {
    cachedAccessToken = credential.accessToken;
  }
  const user = cred.user;
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email || '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('User profile initial sync notice:', err);
    }
  }
  return { user, accessToken: cachedAccessToken };
}

export async function signOutUser() {
  await signOut(auth);
  cachedAccessToken = null;
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function saveSqlSession(name, sessionPayload, itemCount = 0, catalogData = []) {
  if (!auth.currentUser) throw new Error('Please sign in to save sessions to Cloud SQL');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch('/api/db/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      recordsCount: itemCount,
      decisionsJson: typeof sessionPayload === 'string' ? sessionPayload : JSON.stringify(sessionPayload),
      catalogJson: JSON.stringify(catalogData || [])
    })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save session to Cloud SQL');
  return data.session;
}

export async function listSqlSessions() {
  if (!auth.currentUser) return [];
  const token = await auth.currentUser.getIdToken();
  const res = await fetch('/api/db/sessions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch sessions from Cloud SQL');
  return data.sessions || [];
}

export async function loadSqlSession(sessionId) {
  if (!auth.currentUser) throw new Error('Please sign in to load sessions from Cloud SQL');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`/api/db/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load session from Cloud SQL');
  return data.session;
}

export async function deleteSqlSession(sessionId) {
  if (!auth.currentUser) throw new Error('Please sign in');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`/api/db/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to delete session from Cloud SQL');
  return true;
}

export async function saveCloudSession(name, sessionPayload, itemCount = 0, approvedCount = 0) {
  if (!auth.currentUser) throw new Error('Please sign in to save sessions to the cloud');
  // First attempt saving to Cloud SQL relational database backend
  try {
    const sqlSession = await saveSqlSession(name, sessionPayload, itemCount);
    if (sqlSession) return { id: String(sqlSession.id), name: sqlSession.name };
  } catch (sqlErr) {
    console.warn('Cloud SQL session save fallback to Firestore:', sqlErr?.message);
  }

  const userId = auth.currentUser.uid;
  const safeName = (name || `Session ${new Date().toLocaleDateString()}`).trim().slice(0, 128);
  const sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const sessionPath = `users/${userId}/sessions/${sessionId}`;

  const payload = {
    id: sessionId,
    userId,
    name: safeName,
    decisionsJson: typeof sessionPayload === 'string' ? sessionPayload : JSON.stringify(sessionPayload),
    itemCount: Number(itemCount) || 0,
    approvedCount: Number(approvedCount) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), payload);
    return { id: sessionId, name: safeName };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, sessionPath);
  }
}

export async function listCloudSessions() {
  if (!auth.currentUser) return [];
  // First attempt listing from Cloud SQL
  try {
    const sqlSessions = await listSqlSessions();
    if (sqlSessions && sqlSessions.length > 0) {
      return sqlSessions.map((s) => ({
        id: String(s.id),
        name: s.name,
        itemCount: s.recordsCount,
        approvedCount: s.recordsCount,
        updatedAt: s.updatedAt
      }));
    }
  } catch (sqlErr) {
    console.warn('Cloud SQL list fallback to Firestore:', sqlErr?.message);
  }

  const userId = auth.currentUser.uid;
  const sessionsPath = `users/${userId}/sessions`;
  try {
    const q = query(collection(db, 'users', userId, 'sessions'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, sessionsPath);
  }
}

export async function loadCloudSession(sessionId) {
  if (!auth.currentUser) throw new Error('Please sign in to load sessions from the cloud');
  // If session is a numeric ID, load from Cloud SQL
  if (/^\d+$/.test(String(sessionId))) {
    try {
      const sqlSession = await loadSqlSession(sessionId);
      if (sqlSession) {
        return {
          id: String(sqlSession.id),
          name: sqlSession.name,
          decisionsJson: sqlSession.decisionsJson,
          catalogJson: sqlSession.catalogJson,
          itemCount: sqlSession.recordsCount
        };
      }
    } catch (sqlErr) {
      console.warn('Cloud SQL load fallback to Firestore:', sqlErr?.message);
    }
  }

  const userId = auth.currentUser.uid;
  const docPath = `users/${userId}/sessions/${sessionId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'sessions', sessionId));
    if (!snap.exists()) throw new Error('Session not found');
    return snap.data();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

export async function deleteCloudSession(sessionId) {
  if (!auth.currentUser) throw new Error('Please sign in');
  if (/^\d+$/.test(String(sessionId))) {
    try {
      await deleteSqlSession(sessionId);
      return;
    } catch (sqlErr) {
      console.warn('Cloud SQL delete fallback to Firestore:', sqlErr?.message);
    }
  }

  const userId = auth.currentUser.uid;
  const docPath = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// ==========================================================================
// Brand & Logo Manager Firestore & Offline Cache Persistence
// ==========================================================================

const BRANDS_LOCAL_KEY = 'avery_brand_registry_cache';
const CATALOG_LOCAL_KEY = 'avery_persistent_catalog_cache';

/**
 * Saves a brand and its associated logo to Cloud Firestore with automatic offline cache.
 */
export async function saveBrandToFirestore(brand = {}) {
  const brandName = String(brand.name || brand.brand || '').trim().slice(0, 128);
  if (!brandName) throw new Error('Brand name is required');

  // Sanitize brand ID for Firestore doc ID
  const brandId = (brand.id || 'b_' + brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')).slice(0, 64);
  const logoUrl = String(brand.logoUrl || '').slice(0, 990000);

  const localRecord = {
    id: brandId,
    name: brandName,
    logoUrl,
    source: brand.source || 'custom',
    category: brand.category || '',
    website: brand.website || '',
    itemCount: Number(brand.itemCount) || 0,
    updatedAt: new Date().toISOString()
  };

  // Always update local cache
  try {
    const cached = JSON.parse(localStorage.getItem(BRANDS_LOCAL_KEY) || '{}');
    cached[brandName.toLowerCase()] = localRecord;
    localStorage.setItem(BRANDS_LOCAL_KEY, JSON.stringify(cached));
  } catch (cacheErr) {
    console.warn('Local brand cache update notice:', cacheErr);
  }

  // If signed in, persist to Cloud Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const docPath = `users/${userId}/brands/${brandId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'brands', brandId), {
        id: brandId,
        userId,
        name: brandName,
        logoUrl,
        source: brand.source || 'custom',
        category: brand.category || '',
        website: brand.website || '',
        itemCount: Number(brand.itemCount) || 0,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore brand save warning, kept in local offline cache:', err);
    }
  }

  return localRecord;
}

/**
 * Loads all brand and logo records from Cloud Firestore, merged with offline cache.
 */
export async function loadBrandsFromFirestore() {
  const brandMap = new Map();

  // 1. Read from local cache first
  try {
    const raw = localStorage.getItem(BRANDS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.values(parsed).forEach((b) => {
        if (b && b.name) brandMap.set(b.name.toLowerCase(), b);
      });
    }
  } catch (err) {
    console.warn('Error reading local brands cache:', err);
  }

  // 2. If signed in, sync from Cloud Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const path = `users/${userId}/brands`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'brands'));
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.name) {
          brandMap.set(data.name.toLowerCase(), {
            id: data.id || d.id,
            name: data.name,
            logoUrl: data.logoUrl || '',
            source: data.source || 'custom',
            category: data.category || '',
            website: data.website || '',
            itemCount: Number(data.itemCount) || 0,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
      });

      // Sync combined set back to local storage
      const exportObj = {};
      brandMap.forEach((val, key) => { exportObj[key] = val; });
      localStorage.setItem(BRANDS_LOCAL_KEY, JSON.stringify(exportObj));
    } catch (err) {
      console.warn('Cloud Firestore brand load warning, serving offline cache:', err);
    }
  }

  return Array.from(brandMap.values());
}

/**
 * Deletes a brand from Firestore and offline cache.
 */
export async function deleteBrandFromFirestore(brandName) {
  if (!brandName) return;
  const lower = brandName.toLowerCase();
  const brandId = 'b_' + lower.replace(/[^a-z0-9]/g, '_').slice(0, 60);

  try {
    const cached = JSON.parse(localStorage.getItem(BRANDS_LOCAL_KEY) || '{}');
    delete cached[lower];
    localStorage.setItem(BRANDS_LOCAL_KEY, JSON.stringify(cached));
  } catch {}

  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', userId, 'brands', brandId));
    } catch (err) {
      console.warn('Cloud Firestore brand delete warning:', err);
    }
  }
}

/**
 * Persists cleaned catalog items into Cloud Firestore with automatic offline cache.
 */
export async function savePersistentCatalogToFirestore(items = [], catalogName = 'Cleaned Inventory Catalog') {
  if (!Array.isArray(items)) items = [];
  const safeName = String(catalogName || 'Cleaned Inventory Catalog').trim().slice(0, 128);
  const catalogId = 'current';

  // Compact item representation to keep payload size well within Firestore document limits
  const compactItems = items.map((it) => ({
    id: it.id,
    name: it.current_name || it.name || it.original_name || '',
    displayName: it.displayName || '',
    price: it.price || '0.00',
    volume: it.volume || '',
    category: it.category || '',
    barcode: it.barcode?.digits || it.barcode?.original || it.barcode || '',
    brand: it.brand || '',
    logoUrl: it.logoUrl || null
  }));

  const itemsJson = JSON.stringify(compactItems);

  // 1. Offline local cache
  try {
    localStorage.setItem(CATALOG_LOCAL_KEY, JSON.stringify({
      id: catalogId,
      name: safeName,
      items: compactItems,
      itemCount: compactItems.length,
      updatedAt: new Date().toISOString()
    }));
  } catch (cacheErr) {
    console.warn('Local catalog cache warning:', cacheErr);
  }

  // 2. Cloud Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      await setDoc(doc(db, 'users', userId, 'catalog', catalogId), {
        id: catalogId,
        userId,
        name: safeName,
        itemsJson,
        itemCount: compactItems.length,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore catalog save warning, stored in local cache:', err);
    }
  }

  return { id: catalogId, name: safeName, itemCount: compactItems.length };
}

/**
 * Recalls persistent cleaned catalog items from Cloud Firestore or offline cache.
 */
export async function loadPersistentCatalogFromFirestore(catalogId = 'current') {
  // 1. Check Cloud Firestore if logged in
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'catalog', catalogId));
      if (snap.exists()) {
        const data = snap.data();
        let parsed = [];
        try {
          parsed = JSON.parse(data.itemsJson || '[]');
        } catch {}
        return {
          id: data.id,
          name: data.name,
          items: parsed,
          itemCount: data.itemCount || parsed.length
        };
      }
    } catch (err) {
      console.warn('Cloud catalog fetch warning, falling back to local cache:', err);
    }
  }

  // 2. Fallback to local offline cache
  try {
    const raw = localStorage.getItem(CATALOG_LOCAL_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return null;
}

// ==========================================================================
// Avery Label Layout Configurations Persistence (Cloud Firestore & Cache)
// ==========================================================================

const LAYOUTS_LOCAL_KEY = 'avery_saved_layouts_cache';

/**
 * Saves an Avery label configuration layout into Cloud Firestore & offline cache.
 *
 * @param {Object} layout
 * @param {string} layout.id - Optional layout ID
 * @param {string} layout.name - Configuration title (e.g. "Weekly Shelf Tags")
 * @param {string} layout.templateId - Avery code (e.g. "5160")
 * @param {Object} layout.config - Options { filterCategory, filterStatus, startSlot, copies, showGuide, selectedBrand }
 * @param {Array} layout.items - List of queued label items
 * @returns {Promise<Object>} The saved layout record
 */
export async function saveAveryLayoutToFirestore(layout = {}) {
  const name = String(layout.name || 'Custom Layout').trim().slice(0, 128);
  if (!name) throw new Error('Layout name is required');

  const layoutId = (layout.id || 'layout_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)).slice(0, 64);
  const templateId = String(layout.templateId || '5160').slice(0, 32);

  const configObj = {
    templateId,
    filterCategory: layout.filterCategory || layout.config?.filterCategory || 'all',
    filterStatus: layout.filterStatus || layout.config?.filterStatus || 'approved',
    startSlot: Number(layout.startSlot || layout.config?.startSlot || 1),
    copies: Number(layout.copies || layout.config?.copies || 1),
    showGuide: Boolean(layout.showGuide ?? layout.config?.showGuide ?? false),
    selectedBrand: layout.selectedBrand || layout.config?.selectedBrand || '',
    items: Array.isArray(layout.items) ? layout.items : []
  };

  const configJson = JSON.stringify(configObj).slice(0, 1990000);
  const itemCount = configObj.items.length;

  const record = {
    id: layoutId,
    name,
    templateId,
    config: configObj,
    configJson,
    itemCount,
    updatedAt: new Date().toISOString()
  };

  // 1. Offline local cache
  try {
    const cached = JSON.parse(localStorage.getItem(LAYOUTS_LOCAL_KEY) || '{}');
    cached[layoutId] = record;
    localStorage.setItem(LAYOUTS_LOCAL_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('Local layout cache update warning:', err);
  }

  // 2. Cloud Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const docPath = `users/${userId}/layouts/${layoutId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'layouts', layoutId), {
        id: layoutId,
        userId,
        name,
        templateId,
        configJson,
        itemCount,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore layout save warning, retained in local cache:', err);
    }
  }

  return record;
}

/**
 * Lists all saved Avery label layouts from Cloud Firestore and offline cache.
 *
 * @returns {Promise<Array<Object>>}
 */
export async function listAveryLayoutsFromFirestore() {
  const layoutsMap = new Map();

  // 1. Read from local cache first
  try {
    const raw = localStorage.getItem(LAYOUTS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.values(parsed).forEach((l) => {
        if (l && l.id) layoutsMap.set(l.id, l);
      });
    }
  } catch (err) {
    console.warn('Error reading local layouts cache:', err);
  }

  // 2. If signed in, sync from Cloud Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'layouts'));
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.name) {
          let parsedConfig = {};
          try {
            parsedConfig = JSON.parse(data.configJson || '{}');
          } catch {}
          layoutsMap.set(d.id, {
            id: d.id,
            name: data.name,
            templateId: data.templateId || parsedConfig.templateId || '5160',
            config: parsedConfig,
            configJson: data.configJson,
            itemCount: data.itemCount || (parsedConfig.items?.length || 0),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
      });

      // Sync combined set back to local storage
      const exportObj = {};
      layoutsMap.forEach((val, key) => { exportObj[key] = val; });
      localStorage.setItem(LAYOUTS_LOCAL_KEY, JSON.stringify(exportObj));
    } catch (err) {
      console.warn('Cloud Firestore layout list warning, serving local cache:', err);
    }
  }

  return Array.from(layoutsMap.values()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/**
 * Loads a specific Avery layout by ID.
 *
 * @param {string} layoutId
 * @returns {Promise<Object|null>}
 */
export async function loadAveryLayoutFromFirestore(layoutId) {
  if (!layoutId) return null;

  // 1. Try Cloud Firestore if signed in
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'layouts', layoutId));
      if (snap.exists()) {
        const data = snap.data();
        let parsedConfig = {};
        try {
          parsedConfig = JSON.parse(data.configJson || '{}');
        } catch {}
        return {
          id: data.id || snap.id,
          name: data.name,
          templateId: data.templateId || parsedConfig.templateId || '5160',
          config: parsedConfig,
          configJson: data.configJson,
          itemCount: data.itemCount || (parsedConfig.items?.length || 0),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn('Cloud layout load warning, checking local cache:', err);
    }
  }

  // 2. Check local cache
  try {
    const raw = localStorage.getItem(LAYOUTS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[layoutId]) return parsed[layoutId];
    }
  } catch {}

  return null;
}

/**
 * Deletes an Avery layout from Cloud Firestore and local offline cache.
 *
 * @param {string} layoutId
 * @returns {Promise<boolean>}
 */
export async function deleteAveryLayoutFromFirestore(layoutId) {
  if (!layoutId) return false;

  // 1. Remove from local cache
  try {
    const cached = JSON.parse(localStorage.getItem(LAYOUTS_LOCAL_KEY) || '{}');
    delete cached[layoutId];
    localStorage.setItem(LAYOUTS_LOCAL_KEY, JSON.stringify(cached));
  } catch {}

  // 2. Remove from Firestore
  if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', userId, 'layouts', layoutId));
    } catch (err) {
      console.warn('Cloud layout delete warning:', err);
    }
  }

  return true;
}


