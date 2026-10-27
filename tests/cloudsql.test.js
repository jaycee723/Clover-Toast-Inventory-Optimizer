import test from 'node:test';
import assert from 'node:assert/strict';
import { users, sessions } from '../src/db/schema.ts';
import { requireAuth } from '../src/middleware/auth.js';
import { adminAuth } from '../src/lib/firebase-admin.js';

test('Cloud SQL schema exports valid users and sessions tables with correct column mappings', () => {
  assert.ok(users, 'users table must be exported');
  assert.ok(sessions, 'sessions table must be exported');

  // Verify users table columns
  assert.ok('id' in users, 'users must have id column');
  assert.ok('uid' in users, 'users must have uid column');
  assert.ok('email' in users, 'users must have email column');
  assert.ok('createdAt' in users, 'users must have createdAt column');

  // Verify sessions table columns
  assert.ok('id' in sessions, 'sessions must have id column');
  assert.ok('userId' in sessions, 'sessions must have userId column');
  assert.ok('name' in sessions, 'sessions must have name column');
  assert.ok('recordsCount' in sessions, 'sessions must have recordsCount column');
  assert.ok('decisionsJson' in sessions, 'sessions must have decisionsJson column');
  assert.ok('catalogJson' in sessions, 'sessions must have catalogJson column');
  assert.ok('createdAt' in sessions, 'sessions must have createdAt column');
  assert.ok('updatedAt' in sessions, 'sessions must have updatedAt column');
});

test('Firebase Admin SDK is initialized with valid Auth instance', () => {
  assert.ok(adminAuth, 'adminAuth must be initialized and exported');
  assert.equal(typeof adminAuth.verifyIdToken, 'function', 'adminAuth must have verifyIdToken method');
});

test('requireAuth middleware rejects requests with missing or malformed Authorization header', async () => {
  const reqNoHeader = { headers: {} };
  let statusCode = null;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(data) {
          responseData = data;
        }
      };
    }
  };

  let nextCalled = false;
  await requireAuth(reqNoHeader, res, () => { nextCalled = true; });

  assert.equal(statusCode, 401);
  assert.ok(responseData.error.includes('Missing token'));
  assert.equal(nextCalled, false);

  const reqMalformed = { headers: { authorization: 'Basic abc123xyz' } };
  statusCode = null;
  responseData = null;
  await requireAuth(reqMalformed, res, () => { nextCalled = true; });

  assert.equal(statusCode, 401);
  assert.ok(responseData.error.includes('Missing token'));
  assert.equal(nextCalled, false);
});
