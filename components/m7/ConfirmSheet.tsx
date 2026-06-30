'use client';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = '중단하기',
  cancelLabel = '계속',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="m7-sheet" role="dialog" aria-modal="true" aria-labelledby="m7-sheet-title">
      <button type="button" className="m7-sheet__backdrop" aria-label="닫기" onClick={onCancel} />
      <div className="m7-sheet__panel">
        <h2 id="m7-sheet-title" className="m7-sheet__title">{title}</h2>
        <p className="m7-sheet__msg">{message}</p>
        <div className="m7-sheet__actions">
          <button type="button" className="m7-btn" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="m7-btn m7-btn--danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
