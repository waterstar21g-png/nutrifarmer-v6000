export type DbErrorKind = 'quota' | 'unconfigured' | 'unknown';

export function classifyDbError(err: unknown): DbErrorKind {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/402|data transfer quota|exceeded.*quota/i.test(msg)) return 'quota';
  if (/POSTGRES_URL is not configured|No database connection string/i.test(msg)) {
    return 'unconfigured';
  }
  return 'unknown';
}

/** 사용자용 — 글이 사라졌다는 뉘앙스를 주지 않음 */
export function postsUnavailableMessage(kind: DbErrorKind): string {
  switch (kind) {
    case 'quota':
      return '서버 저장소가 잠시 한도에 도달해 글 목록 연결이 끊겼습니다. 올려 두신 글은 그대로 보관되어 있으며, 곧 다시 보실 수 있습니다.';
    case 'unconfigured':
      return '글 목록 연결 설정을 점검 중입니다. 올려 두신 글 데이터는 안전하게 보관되어 있습니다.';
    default:
      return '지금은 글 목록을 가져오지 못했습니다. 올려 두신 글은 삭제되지 않았으니, 잠시 후 다시 불러와 주세요.';
  }
}

export function postsStaleBannerMessage(): string {
  return '최근에 불러온 글 목록을 보여드립니다. 새로 올린 글은 연결이 복구되면 바로 반영됩니다.';
}
