/**
 * @deprecated V7000 백업 — `@/lib/v6000-write-config` 사용
 * 하위 호환 re-export
 */
export {
  V6000_AUTO_MODE_KEY as V7000_AUTO_MODE_KEY,
  V6000_LAST_POST_KEY as V7000_LAST_POST_KEY,
  V6000_MENUS as V7000_MENUS,
  type V6000LastPost as V7000LastPost,
  type V6000MenuItem as V7000MenuItem,
  type PhotoFlowMode,
  PHOTO_FLOW_STEPS,
  TEXT_FLOW_STEPS,
  postReadUrl,
  menuTitleForMode,
} from '@/lib/v6000-write-config';
