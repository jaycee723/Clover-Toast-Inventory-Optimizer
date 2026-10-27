import { db } from './index.ts';
import { sessions } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Retrieve all sessions for a user, ordered by most recently updated.
 */
export async function getUserSessions(userId: number) {
  try {
    return await db.select({
      id: sessions.id,
      name: sessions.name,
      recordsCount: sessions.recordsCount,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.updatedAt));
  } catch (error) {
    console.error('Database query failed in getUserSessions:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Retrieve a specific session by ID verifying ownership.
 */
export async function getSessionById(userId: number, sessionId: number) {
  try {
    const result = await db.select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in getSessionById:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Create a new inventory clean session.
 */
export async function createSession(
  userId: number,
  name: string,
  recordsCount: number = 0,
  decisionsJson: string = '',
  catalogJson: string = ''
) {
  try {
    const result = await db.insert(sessions)
      .values({
        userId,
        name: name.trim() || 'Untitled Session',
        recordsCount,
        decisionsJson,
        catalogJson,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in createSession:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Update an existing session.
 */
export async function updateSession(
  userId: number,
  sessionId: number,
  data: {
    name?: string;
    recordsCount?: number;
    decisionsJson?: string;
    catalogJson?: string;
  }
) {
  try {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.recordsCount !== undefined) updatePayload.recordsCount = data.recordsCount;
    if (data.decisionsJson !== undefined) updatePayload.decisionsJson = data.decisionsJson;
    if (data.catalogJson !== undefined) updatePayload.catalogJson = data.catalogJson;

    const result = await db.update(sessions)
      .set(updatePayload)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in updateSession:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

/**
 * Delete a session.
 */
export async function deleteSession(userId: number, sessionId: number) {
  try {
    const result = await db.delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in deleteSession:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
