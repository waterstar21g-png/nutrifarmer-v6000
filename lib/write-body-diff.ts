import { stripBodyPlain } from '@/lib/write-body-plain';

type DiffOp = { type: 'equal' | 'insert' | 'delete'; value: string };

/** 차수별 강조 색 (1=파랑, 2=청록, 3=초록, 4=보라, 5=주황) */
export const REVISION_LABELS = [
  { n: 1, name: '1차 변경', color: '#1a5fa8' },
  { n: 2, name: '2차 변경', color: '#0891b2' },
  { n: 3, name: '3차 변경', color: '#059669' },
  { n: 4, name: '4차 변경', color: '#7c3aed' },
  { n: 5, name: '5차+ 변경', color: '#c05621' },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 문자 단위 LCS diff */
function diffChars(oldText: string, newText: string): DiffOp[] {
  const a = [...oldText];
  const b = [...newText];
  const m = a.length;
  const n = b.length;

  if (m * n > 2_500_000) {
    return newText ? [{ type: 'insert', value: newText }] : [];
  }

  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const raw: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      raw.push({ type: 'equal', value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: 'insert', value: b[j - 1] });
      j--;
    } else {
      raw.push({ type: 'delete', value: a[i - 1] });
      i--;
    }
  }
  raw.reverse();

  const merged: DiffOp[] = [];
  for (const op of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) {
      last.value += op.value;
    } else {
      merged.push({ ...op });
    }
  }
  return merged;
}

function opsToHtml(ops: DiffOp[], revision: number): string {
  const revClass = `nf-rev-${Math.min(Math.max(revision, 1), 5)}`;
  let html = '';
  for (const op of ops) {
    const chunk = escapeHtml(op.value).replace(/\n/g, '<br>');
    if (op.type === 'equal') html += chunk;
    else if (op.type === 'delete') html += `<del class="nf-rev-del">${chunk}</del>`;
    else html += `<span class="${revClass}">${chunk}</span>`;
  }
  return html;
}

/** AI 결과를 우측 본문에 차수별 diff HTML로 반영 */
export function applyRevisionDiff(oldHtml: string, newPlain: string, revision: number): string {
  const oldPlain = stripBodyPlain(oldHtml);
  const next = newPlain.trim();
  if (!oldPlain) {
    const revClass = `nf-rev-${Math.min(Math.max(revision, 1), 5)}`;
    return `<span class="${revClass}">${escapeHtml(next).replace(/\n/g, '<br>')}</span>`;
  }
  if (!next) return oldHtml;
  return opsToHtml(diffChars(oldPlain, next), revision);
}

export type RevisionSnapshotState = {
  body: string;
  bodyRevision: number;
  bodySnapshots: string[];
  viewingRevision: number;
};

/** 임시저장 — 본문이 현재 보기 기준과 다르면 변경 구분에 새 스냅샷 기록 */
export function commitRevisionOnDraftSave<T extends RevisionSnapshotState>(
  prev: T,
  rawBodyHtml: string,
  normalize: (html: string) => string,
): { next: T; newRev?: number } {
  const body = normalize(rawBodyHtml);
  const baseRev = prev.viewingRevision;
  const baselineHtml = prev.bodySnapshots[baseRev];
  const baselinePlain = stripBodyPlain(baselineHtml ?? '');
  const currentPlain = stripBodyPlain(body);

  if (currentPlain === baselinePlain) {
    return { next: { ...prev, body } };
  }

  const revNum = baseRev + 1;
  const snapshots = prev.bodySnapshots.slice(0, baseRev + 1);
  if (snapshots[0] === undefined) {
    snapshots[0] = baselineHtml ?? '';
  }
  snapshots[revNum] = body;

  return {
    next: {
      ...prev,
      body,
      bodyRevision: revNum,
      bodySnapshots: snapshots,
      viewingRevision: revNum,
    },
    newRev: revNum,
  };
}
