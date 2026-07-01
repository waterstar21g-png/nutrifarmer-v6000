import { getDb } from '@/lib/v5000-auth/db';
import { v5000PostActions } from './schema';

export type PostActionType = 'edit' | 'delete';

export async function logPostAction(input: {
  postId: number;
  actorUserId: number;
  authorUserId: number;
  action: PostActionType;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(v5000PostActions).values({
      postId: input.postId,
      actorUserId: input.actorUserId,
      authorUserId: input.authorUserId,
      action: input.action,
    });
  } catch (err) {
    console.warn('[v5000-post-actions] log failed', err);
  }
}
