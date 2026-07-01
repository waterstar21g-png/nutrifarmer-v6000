# V6000 Mobile Platform (V6.1 통합)

> **갱신:** 2026-07-01 — V6.1 모바일 쓰기·사진 AI (V6000 단일 앱)  
> **URL:** m.nutrifarmer.kr  
> **버전:** V6.1.0.0

---

## 역할

**단일 모바일 앱** — 읽기 + 쓰기 + 사진 AI

| 기능 | 경로 |
|------|------|
| 홈 | `/` |
| 카테고리 | `/categories`, `/[category]` |
| 테마 | `/theme`, `/theme/[key]` |
| 사진올리기 | `/upload`, `/photo`, `/done` |
| 글쓰기 | `/write`, `/text` |
| 계정 | `/login` |

---

## 하단 메뉴 (6탭)

홈 · 카테고리 · 테마 · 사진올리기 · 글쓰기 · 계정

---

## 세션

- 쿠키: `nf-v5000-session` (V5000 공유)
- **10분 미사용** 시 재로그인 권고 (`session_idle`)
- 활동 중 touch API로 슬라이딩 갱신

---

## 스택

| 항목 | 값 |
|------|-----|
| Port | **6000** |
| API / DB / R2 | V5000 공유 |
| Vision AI | `/api/v5000/ai/vision-draft` |

---

## 관계

- V5000: 데스크톱 (www)
- V6000 repo = **통합 모바일 앱** (읽기 + 쓰기 + 사진 AI)
