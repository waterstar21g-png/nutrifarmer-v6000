export interface ImageKeywordItem {
  keyword: string;
  alt: string;
}

export function fallbackImageKeywords(context: string, title: string, excerpt: string): ImageKeywordItem[] {
  const text = [title, excerpt, context].filter(Boolean).join(' ');
  const items: ImageKeywordItem[] = [];

  if (/가족|아이|손|부모|어머니|아버지|손자|손녀/.test(text)) {
    items.push({ keyword: 'happy family outdoor', alt: '가족' });
  }
  if (/음식|요리|밥|식사|맛/.test(text)) {
    items.push({ keyword: 'korean home cooking', alt: '음식' });
  }
  if (/자연|산|바다|꽃|나무|하늘|여행/.test(text)) {
    items.push({ keyword: 'nature landscape korea', alt: '자연' });
  }
  if (/학교|공부|책|연구|대학|글/.test(text)) {
    items.push({ keyword: 'books study desk', alt: '학습·글쓰기' });
  }
  if (/사진|추억|기록|일상/.test(text)) {
    items.push({ keyword: 'daily life photography', alt: '일상 기록' });
  }

  if (items.length === 0) {
    items.push(
      { keyword: 'peaceful morning light', alt: '고요한 아침' },
      { keyword: 'journal notebook pen', alt: '기록' },
      { keyword: 'korean countryside', alt: '풍경' },
    );
  }

  return items.slice(0, 4);
}

export function parseImageKeywordsJson(raw: string): ImageKeywordItem[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => {
        if (!item || typeof item !== 'object') return null;
        const o = item as Record<string, string>;
        const keyword = (o.keyword ?? o.search ?? o.q ?? '').trim();
        const alt = (o.alt ?? o.caption ?? o.description ?? keyword).trim().slice(0, 100);
        if (!keyword) return null;
        return { keyword, alt: alt || keyword };
      })
      .filter((x): x is ImageKeywordItem => x !== null)
      .slice(0, 4);
  } catch {
    return [];
  }
}
