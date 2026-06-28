/** 본문 embed 블록 — DOM 조작 헬퍼 */

export const BODY_EMBED_SELECTOR = '[data-nfw-embed]';

export function rangeFromPoint(x: number, y: number): Range | null {
  const doc = document;
  if (typeof doc.caretRangeFromPoint === 'function') {
    return doc.caretRangeFromPoint(x, y);
  }
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (pos) {
    const range = doc.createRange();
    range.setStart(pos.offsetNode, pos.offset);
    range.collapse(true);
    return range;
  }
  return null;
}

export function insertNodeAtRange(range: Range, node: Node): void {
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export function moveEmbedBlock(block: HTMLElement, editor: HTMLElement, x: number, y: number): void {
  const range = rangeFromPoint(x, y);
  if (!range || !editor.contains(range.startContainer)) {
    editor.appendChild(block);
    return;
  }
  if (block.contains(range.startContainer)) {
    editor.appendChild(block);
    return;
  }
  block.remove();
  insertNodeAtRange(range, block);
}
