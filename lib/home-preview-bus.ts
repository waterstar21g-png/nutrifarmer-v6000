/** 홈 미리보기 — 헤더·그리드 간 동기화 (원본 nutrifarmer.kr category hub) */



export type PreviewZone = 'header' | 'showcase-r1' | 'showcase-r2' | 'about' | 'family';



type State = { zone: PreviewZone | null; slug: string | null };

type Listener = (state: State) => void;



const listeners = new Set<Listener>();

let current: State = { zone: null, slug: null };



export function subscribeHomePreview(fn: Listener): () => void {

  fn(current);

  listeners.add(fn);

  return () => listeners.delete(fn);

}



function emit(state: State) {

  current = state;

  listeners.forEach(fn => fn(state));

}



export function getHomePreviewState(): State {

  return current;

}



export function openHomePreview(zone: PreviewZone, slug: string) {

  emit({ zone, slug });

}



export function closeHomePreview(zone?: PreviewZone) {

  if (zone && current.zone !== zone) return;

  emit({ zone: null, slug: null });

}



export function closeAllHomePreviews() {

  emit({ zone: null, slug: null });

}


