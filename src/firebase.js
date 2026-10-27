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
  firestoreDatabaseId: "(default)",
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

