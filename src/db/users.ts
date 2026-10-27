import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

/**
 * Safely registers or fetches a user under concurrent requests using Drizzle upsert.
 */
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email: email || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Look up user record by Firebase Auth UID.
 */
export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
