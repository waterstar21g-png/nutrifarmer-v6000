# V6000 Mobile Platform

> **생성일:** 2026-06-28  
> **위치:** `D:/함께온라인/My_BLOG/nutrifarmer-v6000`  
> **관계:** V5000 Native Platform과 **동일 Postgres·R2·API** 공유

---

## 1. 목적

- **V6000** = 모바일 전용 UI (375px 기준, 하단 네비, 카드형 목록)
- **V5000** = 데스크톱·글쓰기 에디터 (기존 www 유지)
- 글쓰기는 V5000 `/write` 링크 (모바일에서 새 탭)

---

## 2. 스택

| 항목 | 값 |
|------|-----|
| Framework | Next.js 15 App Router |
| Port (로컬) | **6000** (`npm run dev`) |
| API | `/api/v5000/*` (V5000과 동일) |
| DB / R2 | V5000 env 공유 |
| 세션 쿠키 | `nf-v5000-session` (동일 secret 시 SSO 가능) |

---

## 3. 화면

| 경로 | 설명 |
|------|------|
| `/` | 모바일 홈 — 히어로 + 카테고리 칩 + 최신 글 카드 |
| `/[category]` | 카테고리 글 목록 |
| `/[category]/[slug]?pid=` | 단일글 (배너 + 대표이미지 + 본문) |
| `/login` | V5000 auth 공유 로그인 |

---

## 4. 로컬 실행

```powershell
cd "D:/함께온라인/My_BLOG/nutrifarmer-v6000"
copy ..\nutrifarmer-v5000\.env.local .env.local
npm install
npm run dev
# http://localhost:6000
```

---

## 5. 배포

- Vercel: `nutrifarmer-v6000`
- URL: https://m.nutrifarmer.kr

---

## 6. V5000 대비 차이

| V5000 | V6000 |
|-------|-------|
| 2컬럼·히어로·8칸 그리드 | 1컬럼 카드 리스트 |
| `/write` 내장 | V5000 write URL 링크 |
| 3000+ 줄 globals.css | ~300줄 mobile-first CSS |
| max-width 없음 전폭 | max 480px 중앙 |

---

## 7. V5000 관계·요구사항 규칙

→ [`V5000-V6000-platform-relationship.md`](V5000-V6000-platform-relationship.md)
