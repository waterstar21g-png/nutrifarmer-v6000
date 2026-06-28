export interface V5000Category {
  slug: string;
  name: string;
}

export interface V5000PostDto {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  status: string;
  link: string;
  publishedAt: string | null;
  updatedAt: string;
  authorDisplayName: string | null;
}
