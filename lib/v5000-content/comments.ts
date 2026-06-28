import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/v5000-auth/db';
import { findPublishedPostById } from './posts';
import { v5000Comments, type V5000CommentRow } from './schema';

export type PublicComment = {
  id: number;
  authorName: string;
  authorUrl: string | null;
  body: string;
  createdAt: string;
};

function toPublic(row: V5000CommentRow): PublicComment {
  return {
    id: row.id,
    authorName: row.authorName,
    authorUrl: row.authorUrl,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listApprovedComments(postId: number): Promise<PublicComment[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000Comments)
    .where(and(eq(v5000Comments.postId, postId), eq(v5000Comments.status, 'approved')))
    .orderBy(desc(v5000Comments.createdAt));
  return rows.map(toPublic);
}

export async function createComment(input: {
  postId: number;
  authorName: string;
  authorEmail: string;
  authorUrl?: string;
  body: string;
}): Promise<PublicComment> {
  const post = await findPublishedPostById(input.postId);
  if (!post) throw new Error('post_not_found');

  const db = getDb();
  const rows = await db
    .insert(v5000Comments)
    .values({
      postId: input.postId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      authorUrl: input.authorUrl || null,
      body: input.body,
      status: 'approved',
    })
    .returning();
  return toPublic(rows[0]!);
}
