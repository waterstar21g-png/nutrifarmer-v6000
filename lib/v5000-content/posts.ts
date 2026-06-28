import { and, desc, eq, getTableColumns, ilike, ne, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/v5000-auth/db';
import { SITE_URL } from '@/lib/v5000-auth/config';
import { v5000Users } from '@/lib/v5000-auth/schema';
import { v5000Posts, type V5000PostRow } from './schema';
import { slugify, uniqueSlug } from './slug';
import type { V5000PostDto } from './types';

export function postLink(categorySlug: string, slug: string): string {
  return `${SITE_URL}/${categorySlug}/${slug}`;
}

export type V5000PostWithAuthor = V5000PostRow & { authorDisplayName?: string | null };

export function toPostDto(row: V5000PostWithAuthor): V5000PostDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    categorySlug: row.categorySlug,
    status: row.status,
    link: postLink(row.categorySlug, row.slug),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    authorDisplayName: row.authorDisplayName ?? null,
  };
}

async function slugExists(slug: string, excludeId?: number): Promise<boolean> {
  const db = getDb();
  const conditions = excludeId
    ? and(eq(v5000Posts.slug, slug), ne(v5000Posts.id, excludeId))
    : eq(v5000Posts.slug, slug);
  const rows = await db.select({ id: v5000Posts.id }).from(v5000Posts).where(conditions).limit(1);
  return rows.length > 0;
}

export async function findPostById(id: number): Promise<V5000PostRow | null> {
  const db = getDb();
  const rows = await db.select().from(v5000Posts).where(eq(v5000Posts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findPublishedPostBySlug(slug: string): Promise<V5000PostRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000Posts)
    .where(and(eq(v5000Posts.slug, slug), eq(v5000Posts.status, 'publish')))
    .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function findPublishedPostById(id: number): Promise<V5000PostRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000Posts)
    .where(and(eq(v5000Posts.id, id), eq(v5000Posts.status, 'publish')))
    .limit(1);
  return rows[0] ?? null;
}

export async function listPublishedByCategory(categorySlug: string, limit = 100): Promise<V5000PostRow[]> {
  const db = getDb();
  return db
    .select()
    .from(v5000Posts)
    .where(and(eq(v5000Posts.categorySlug, categorySlug), eq(v5000Posts.status, 'publish')))
    .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
    .limit(Math.min(limit, 100));
}

export async function listPosts(opts: {
  authorId?: number;
  categorySlug?: string;
  status?: string;
  search?: string;
  titleSearch?: string;
  bodySearch?: string;
  limit?: number;
}): Promise<V5000PostWithAuthor[]> {
  const db = getDb();
  const limit = Math.min(opts.limit ?? 30, 100);
  const filters = [];

  if (opts.authorId) filters.push(eq(v5000Posts.authorId, opts.authorId));
  if (opts.categorySlug) filters.push(eq(v5000Posts.categorySlug, opts.categorySlug));
  if (opts.status) filters.push(eq(v5000Posts.status, opts.status));
  if (opts.titleSearch?.trim()) {
    filters.push(ilike(v5000Posts.title, `%${opts.titleSearch.trim()}%`));
  }
  if (opts.bodySearch?.trim()) {
    const q = `%${opts.bodySearch.trim()}%`;
    filters.push(or(ilike(v5000Posts.excerpt, q), ilike(v5000Posts.body, q))!);
  }
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim()}%`;
    filters.push(or(ilike(v5000Posts.title, q), ilike(v5000Posts.excerpt, q))!);
  }

  const where = filters.length ? and(...filters) : undefined;

  return db
    .select({
      ...getTableColumns(v5000Posts),
      authorDisplayName: v5000Users.displayName,
    })
    .from(v5000Posts)
    .innerJoin(v5000Users, eq(v5000Posts.authorId, v5000Users.id))
    .where(where)
    .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
    .limit(limit);
}

export interface CreatePostInput {
  title: string;
  body: string;
  excerpt: string;
  categorySlug: string;
  status: 'draft' | 'publish';
  authorId: number;
  slug?: string;
}

export async function createPost(input: CreatePostInput): Promise<V5000PostRow> {
  const db = getDb();
  const slug = input.slug
    ? slugify(input.slug)
    : await uniqueSlug(input.title || 'post', s => slugExists(s));

  const now = new Date();
  const publishedAt = input.status === 'publish' ? now : null;

  const rows = await db
    .insert(v5000Posts)
    .values({
      slug,
      title: input.title || '(제목 없음)',
      body: input.body,
      excerpt: input.excerpt,
      status: input.status,
      authorId: input.authorId,
      categorySlug: input.categorySlug,
      publishedAt,
      updatedAt: now,
    })
    .returning();

  return rows[0]!;
}

export interface UpdatePostInput {
  title?: string;
  body?: string;
  excerpt?: string;
  categorySlug?: string;
  status?: 'draft' | 'publish';
  slug?: string;
}

export async function updatePost(id: number, input: UpdatePostInput): Promise<V5000PostRow | null> {
  const existing = await findPostById(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date();
  const patch: Partial<typeof v5000Posts.$inferInsert> = { updatedAt: now };

  if (input.title !== undefined) patch.title = input.title || '(제목 없음)';
  if (input.body !== undefined) patch.body = input.body;
  if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
  if (input.categorySlug !== undefined) patch.categorySlug = input.categorySlug;

  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === 'publish' && !existing.publishedAt) {
      patch.publishedAt = now;
    }
  }

  if (input.slug !== undefined) {
    patch.slug = await uniqueSlug(input.slug || input.title || existing.title, s => slugExists(s, id));
  } else if (input.title !== undefined && input.title !== existing.title && existing.status === 'draft') {
    patch.slug = await uniqueSlug(input.title, s => slugExists(s, id));
  }

  const rows = await db.update(v5000Posts).set(patch).where(eq(v5000Posts.id, id)).returning();
  return rows[0] ?? null;
}

export async function deletePost(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(v5000Posts).where(eq(v5000Posts.id, id)).returning({ id: v5000Posts.id });
  return result.length > 0;
}

export async function countPublishedPosts(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(v5000Posts)
    .where(eq(v5000Posts.status, 'publish'));
  return rows[0]?.count ?? 0;
}

export async function countPublishedPostsByAuthor(authorId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(v5000Posts)
    .where(and(eq(v5000Posts.authorId, authorId), eq(v5000Posts.status, 'publish')));
  return rows[0]?.count ?? 0;
}

export async function countPublishedByCategory(categorySlug: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(v5000Posts)
    .where(and(eq(v5000Posts.categorySlug, categorySlug), eq(v5000Posts.status, 'publish')));
  return rows[0]?.count ?? 0;
}

export async function listLatestPublished(limit = 30): Promise<V5000PostRow[]> {
  const db = getDb();
  return db
    .select()
    .from(v5000Posts)
    .where(eq(v5000Posts.status, 'publish'))
    .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
    .limit(Math.min(limit, 100));
}

export async function listPublishedPaginated(
  categorySlug: string,
  page: number,
  perPage: number,
): Promise<{ rows: V5000PostRow[]; total: number; totalPages: number }> {
  const db = getDb();
  const where = and(eq(v5000Posts.categorySlug, categorySlug), eq(v5000Posts.status, 'publish'));
  const offset = Math.max(0, (page - 1) * perPage);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(v5000Posts)
      .where(where)
      .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
      .limit(perPage)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(v5000Posts).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    rows,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
  };
}

export async function searchPublishedPosts(search: string, limit = 12): Promise<V5000PostRow[]> {
  const q = search.trim();
  if (!q) return [];

  const db = getDb();
  const pattern = `%${q}%`;
  return db
    .select()
    .from(v5000Posts)
    .where(
      and(
        eq(v5000Posts.status, 'publish'),
        or(ilike(v5000Posts.title, pattern), ilike(v5000Posts.excerpt, pattern))!,
      ),
    )
    .orderBy(desc(v5000Posts.publishedAt), desc(v5000Posts.updatedAt))
    .limit(Math.min(limit, 100));
}
